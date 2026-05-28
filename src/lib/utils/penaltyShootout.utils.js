/**
 * Pure-logic helpers for the penalty-shootout workflow.
 *
 * Kept framework-agnostic so the same functions drive the UI's
 * derived state in `PenaltyStep.svelte` and the backend's response
 * shape in `penaltyShootout.services.js` (once the API is wired in
 * a later etappe).
 *
 * A "shot" is `{ team: 'home' | 'away', result: 'goal' | 'missed',
 * shooterId, keeperId }`. The functions here only ever read `team`
 * and `result` — the rest of the shape is irrelevant for sequencing
 * and scoring.
 */

/** Standard number of shots per team before sudden death kicks in. */
export const PENALTY_REGULAR_ROUNDS = 5;

/**
 * ELO deltas applied per shot. Tuned to match the spec in
 * `roadmap/elfmeterschiessen/ELFMETERSCHIESSEN_IMPLEMENTATION.md`.
 * Centralised here so the same numbers drive the live preview and
 * the eventual backend computation.
 */
export const PENALTY_ELO_DELTAS = Object.freeze({
	GOAL_SCORED: 3,
	PENALTY_MISSED: -5,
	PENALTY_SAVED: 5,
});

/**
 * Counts the goals scored so far per side.
 *
 * @param {Array<{ team: 'home' | 'away', result: 'goal' | 'missed' }>} shots
 * @returns {{ home: number, away: number }}
 * @example
 *   computeRunningScore([
 *     { team: 'home', result: 'goal' },
 *     { team: 'away', result: 'missed' },
 *   ]); // { home: 1, away: 0 }
 */
export function computeRunningScore(shots) {
	let home = 0;
	let away = 0;
	for (const shot of shots) {
		if (shot.result !== "goal") continue;
		if (shot.team === "home") home += 1;
		else if (shot.team === "away") away += 1;
	}
	return { home, away };
}

/**
 * Counts how many shots each side has taken so far.
 *
 * @param {Array<{ team: 'home' | 'away' }>} shots
 * @returns {{ home: number, away: number }}
 * @example
 *   countShotsTaken([{ team: 'home' }, { team: 'home' }]); // { home: 2, away: 0 }
 */
export function countShotsTaken(shots) {
	let home = 0;
	let away = 0;
	for (const shot of shots) {
		if (shot.team === "home") home += 1;
		else if (shot.team === "away") away += 1;
	}
	return { home, away };
}

/**
 * The penalty shootout alternates home / away / home / away. With an
 * empty list home shoots first; after every shot, the other side is
 * up next. Sudden death keeps the same alternation.
 *
 * @param {Array<{ team: 'home' | 'away' }>} shots
 * @returns {'home' | 'away'}
 * @example
 *   getNextShootingTeam([]);                      // 'home'
 *   getNextShootingTeam([{ team: 'home' }]);      // 'away'
 *   getNextShootingTeam([{ team: 'home' }, { team: 'away' }]); // 'home'
 */
export function getNextShootingTeam(shots) {
	return shots.length % 2 === 0 ? "home" : "away";
}

/**
 * 1-based round counter. Each round = one home shot + one away shot.
 * A round counts as "current" while either side still needs to
 * shoot in it.
 *
 * @param {Array<unknown>} shots
 * @returns {number}
 * @example
 *   getCurrentRound([]);                        // 1
 *   getCurrentRound([{}]);                      // 1 (home done, away pending)
 *   getCurrentRound([{}, {}]);                  // 2
 *   getCurrentRound([{}, {}, {}]);              // 2 (home of round 2 done)
 */
export function getCurrentRound(shots) {
	return Math.floor(shots.length / 2) + 1;
}

/**
 * Determines whether the shootout is mathematically decided.
 *
 * Two phases:
 *   1. Regular: each side has up to 5 shots. The shootout ends
 *      early as soon as one side's lead exceeds the other side's
 *      remaining shots.
 *   2. Sudden death: after both sides have taken 5 shots, both
 *      must shoot the same number per round — a winner emerges
 *      the moment the score diverges at an even shot count.
 *
 * @param {Array<{ team: 'home' | 'away', result: 'goal' | 'missed' }>} shots
 * @returns {{ decided: boolean, winnerSide: 'home' | 'away' | null }}
 * @example
 *   // Regular phase, home leads 3-0 after 3-2 shots, away has 3 left, max reach 3 → tied possible, not decided
 *   isPenaltyShootoutDecided([
 *     { team: 'home', result: 'goal' },
 *     { team: 'away', result: 'missed' },
 *     { team: 'home', result: 'goal' },
 *     { team: 'away', result: 'missed' },
 *     { team: 'home', result: 'goal' },
 *   ]); // { decided: false, winnerSide: null }
 */
export function isPenaltyShootoutDecided(shots) {
	const score = computeRunningScore(shots);
	const taken = countShotsTaken(shots);
	const homeShotsRemaining = Math.max(0, PENALTY_REGULAR_ROUNDS - taken.home);
	const awayShotsRemaining = Math.max(0, PENALTY_REGULAR_ROUNDS - taken.away);

	// Regular 5-round phase.
	if (
		taken.home < PENALTY_REGULAR_ROUNDS ||
		taken.away < PENALTY_REGULAR_ROUNDS
	) {
		if (score.home > score.away + awayShotsRemaining) {
			return { decided: true, winnerSide: "home" };
		}
		if (score.away > score.home + homeShotsRemaining) {
			return { decided: true, winnerSide: "away" };
		}
		return { decided: false, winnerSide: null };
	}

	// Sudden death: decision only at an even shot count.
	if (taken.home === taken.away && score.home !== score.away) {
		return {
			decided: true,
			winnerSide: score.home > score.away ? "home" : "away",
		};
	}
	return { decided: false, winnerSide: null };
}

/**
 * ELO-delta map for a single shot. Keyed by player ID so the caller
 * can apply the deltas to whatever shape it stores players in.
 *
 * - Goal: shooter +GOAL_SCORED, no opponent delta
 * - Missed with keeper: shooter PENALTY_MISSED, keeper PENALTY_SAVED
 * - Missed without keeper (post / wide): shooter PENALTY_MISSED only
 *
 * @param {{ shooterId: string, result: 'goal' | 'missed', keeperId?: string | null }} shot
 * @returns {Record<string, number>}
 * @example
 *   computePenaltyShotEloDeltas({ shooterId: 'a', result: 'goal' });
 *   // { a: 3 }
 *   computePenaltyShotEloDeltas({ shooterId: 'a', result: 'missed', keeperId: 'b' });
 *   // { a: -5, b: 5 }
 */
export function computePenaltyShotEloDeltas(shot) {
	const deltas = {};
	if (shot.result === "goal") {
		deltas[shot.shooterId] = PENALTY_ELO_DELTAS.GOAL_SCORED;
		return deltas;
	}
	if (shot.result === "missed") {
		deltas[shot.shooterId] = PENALTY_ELO_DELTAS.PENALTY_MISSED;
		if (shot.keeperId) {
			deltas[shot.keeperId] = PENALTY_ELO_DELTAS.PENALTY_SAVED;
		}
	}
	return deltas;
}

/**
 * For visual layout: how many cells the sequence board should
 * render per row. Always at least `PENALTY_REGULAR_ROUNDS`; grows
 * by one per sudden-death round so a fresh active cell is always
 * visible.
 *
 * @param {Array<unknown>} shots
 * @returns {number}
 * @example
 *   getBoardCellCount([]);              // 5
 *   getBoardCellCount(Array(12).fill({})); // 7  (6 regular + 1 sudden-death round, plus active)
 */
export function getBoardCellCount(shots) {
	const round = getCurrentRound(shots);
	return Math.max(PENALTY_REGULAR_ROUNDS, round);
}
