/**
 * @file Derives per-player ELO histories from a games window. The
 *       leaderboard endpoint exposes legacy points, not ELO, so the
 *       Rangliste rebuilds the rating timeline from
 *       `game.elo_snapshot.teamA/teamB[].ratingAfter` instead.
 *
 *       The games array is assumed to be newest-first (matching the
 *       /v1/games response). Per-player series are returned
 *       oldest-first so they can be fed straight to a sparkline.
 */

const FORM_WINDOW = 10;

/**
 * Build a per-player ELO timeline plus aggregated W/D/L/Δ stats from
 * the given games window. Optionally filter to a single match mode
 * (e.g. "2v2"). Games without an `elo_snapshot` are ignored for the
 * timeline but still counted for win/loss bookkeeping.
 *
 * @param {Array<object>} games Newest-first games array.
 * @param {{ mode?: "2v2"|"1v1"|"all" }} [opts]
 * @returns {Map<string, {
 *   playerId: string,
 *   username: string|null,
 *   avatarUrl: string|null,
 *   ratings: number[],
 *   currentRating: number|null,
 *   formDelta: number|null,
 *   weekDelta: number,
 *   wins: number,
 *   draws: number,
 *   losses: number,
 *   games: number,
 *   currentStreak: { type: "win"|"loss"|"draw", count: number }|null,
 * }>}
 *
 * @example
 *   const map = buildEloHistory(games, { mode: "2v2" });
 *   const me = map.get(userId);
 *   me?.currentRating; // → 1432
 *   me?.ratings;       // → [1410, 1418, …, 1432]
 */
export function buildEloHistory(games, opts = {}) {
	const { mode = "all" } = opts;
	const map = new Map();
	const weekStart = startOfIsoWeekTime(new Date());

	const filtered = (games ?? []).filter(
		(g) => mode === "all" || g.mode === mode,
	);
	const ordered = [...filtered].reverse();

	for (const game of ordered) {
		const homeScore = game.score_home ?? 0;
		const awayScore = game.score_away ?? 0;
		const isDraw = homeScore === awayScore;
		const winnerSide = isDraw ? null : homeScore > awayScore ? "home" : "away";
		const playedAtMs = game.played_at ? new Date(game.played_at).getTime() : 0;

		const snap = game.elo_snapshot;
		const entries = snap ? [...(snap.teamA ?? []), ...(snap.teamB ?? [])] : [];

		for (const gp of game.game_players ?? []) {
			const entry = map.get(gp.player_id) ?? {
				playerId: gp.player_id,
				username: gp.profiles?.username ?? null,
				avatarUrl: gp.profiles?.avatar_url ?? null,
				ratings: [],
				currentRating: null,
				formDelta: null,
				weekDelta: 0,
				wins: 0,
				draws: 0,
				losses: 0,
				games: 0,
				currentStreak: null,
				_outcomes: [],
			};

			entry.games += 1;
			let outcome;
			if (isDraw) {
				entry.draws += 1;
				outcome = "draw";
			} else if (gp.team === winnerSide) {
				entry.wins += 1;
				outcome = "win";
			} else {
				entry.losses += 1;
				outcome = "loss";
			}
			entry._outcomes.push(outcome);

			const eloEntry = entries.find((e) => e.playerId === gp.player_id);
			if (eloEntry?.ratingAfter != null) {
				entry.ratings.push(eloEntry.ratingAfter);
				entry.currentRating = eloEntry.ratingAfter;
				if (playedAtMs >= weekStart && eloEntry.delta != null) {
					entry.weekDelta += eloEntry.delta;
				}
			}

			map.set(gp.player_id, entry);
		}
	}

	for (const entry of map.values()) {
		const tail = entry.ratings.slice(-FORM_WINDOW);
		if (tail.length >= 2) {
			entry.formDelta = tail[tail.length - 1] - tail[0];
		}
		entry.currentStreak = computeCurrentStreak(entry._outcomes);
		entry._outcomes = undefined;
	}

	return map;
}

/**
 * Walk the outcome list from the latest game backwards and return the
 * length of the run of identical outcomes, ignoring draws as a
 * streak-breaker rather than a continuation.
 *
 * @param {Array<"win"|"loss"|"draw">} outcomes Oldest-first outcomes.
 * @returns {{ type: "win"|"loss"|"draw", count: number }|null}
 */
function computeCurrentStreak(outcomes) {
	if (!outcomes?.length) return null;
	const last = outcomes[outcomes.length - 1];
	if (last === "draw") return { type: "draw", count: 1 };
	let count = 0;
	for (let i = outcomes.length - 1; i >= 0; i -= 1) {
		if (outcomes[i] === last) count += 1;
		else break;
	}
	return { type: last, count };
}

/**
 * Monday 00:00 of the current ISO week as a millis timestamp. Inlined
 * here so the utility stays free of dashboard-side dependencies.
 *
 * @param {Date} date
 * @returns {number}
 */
function startOfIsoWeekTime(date) {
	const d = new Date(date);
	const dayNum = (d.getDay() + 6) % 7;
	d.setDate(d.getDate() - dayNum);
	d.setHours(0, 0, 0, 0);
	return d.getTime();
}
