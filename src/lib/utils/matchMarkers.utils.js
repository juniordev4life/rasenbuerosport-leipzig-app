/**
 * Client-side marker detection for the Historie page. Backend doesn't
 * (yet) emit primary markers on each game, so we infer them from the
 * already-shipped fields (`score_home`, `score_away`, `score_timeline`).
 *
 * Priority order (highest first):
 *   1. comeback     — losing side trailed by ≥ 2 then won
 *   2. hattrick     — single player scored ≥ 3 goals
 *   3. klar         — final goal difference ≥ 4
 *   4. zunull       — losing team scored 0
 *   5. torreich     — combined goals ≥ 6
 *   6. krimi        — goal difference = 1 and there was a late goal
 *
 * Only the highest-priority match is returned so the match card stays
 * compact.
 */

const LATE_PERIOD_RATIO = 0.8;

/**
 * @typedef {{ home: number, away: number, period?: string|number|null, scored_by?: string|null }} TimelineEntry
 */

/**
 * Detect the single primary marker for a game.
 *
 * @param {{
 *   score_home?: number,
 *   score_away?: number,
 *   score_timeline?: TimelineEntry[]|null,
 *   game_players?: Array<{ player_id: string, profiles?: { username?: string } }>,
 * }} game
 * @returns {{ type: "comeback"|"hattrick"|"klar"|"zunull"|"torreich"|"krimi", scorerName?: string|null }|null}
 *
 * @example
 *   primaryMarker({ score_home: 4, score_away: 3, score_timeline: [...] });
 *   // → { type: "comeback" }
 */
export function primaryMarker(game) {
	const home = game?.score_home ?? 0;
	const away = game?.score_away ?? 0;
	const total = home + away;
	const diff = Math.abs(home - away);
	const timeline = Array.isArray(game?.score_timeline)
		? game.score_timeline
		: [];

	if (detectComeback(home, away, timeline)) return { type: "comeback" };
	const hattrick = detectHattrick(timeline, game?.game_players);
	if (hattrick) return { type: "hattrick", scorerName: hattrick.scorerName };
	if (diff >= 4) return { type: "klar" };
	if (home === 0 || away === 0) return { type: "zunull" };
	if (total >= 6) return { type: "torreich" };
	if (diff === 1 && hasLateGoal(timeline)) return { type: "krimi" };
	return null;
}

/**
 * @param {number} home
 * @param {number} away
 * @param {TimelineEntry[]} timeline
 */
function detectComeback(home, away, timeline) {
	if (home === away) return false;
	const winnerSide = home > away ? "home" : "away";
	const otherSide = winnerSide === "home" ? "away" : "home";
	let maxLead = 0;
	for (const entry of timeline) {
		const lead = (entry?.[otherSide] ?? 0) - (entry?.[winnerSide] ?? 0);
		if (lead > maxLead) maxLead = lead;
	}
	return maxLead >= 2;
}

/**
 * @param {TimelineEntry[]} timeline
 * @param {Array<{ player_id: string, profiles?: { username?: string } }>=} players
 */
function detectHattrick(timeline, players = []) {
	if (!timeline.length) return null;
	const counts = new Map();
	for (const entry of timeline) {
		const scorerId = entry?.scored_by ?? null;
		if (!scorerId) continue;
		counts.set(scorerId, (counts.get(scorerId) ?? 0) + 1);
	}
	for (const [id, count] of counts.entries()) {
		if (count >= 3) {
			const player = (players ?? []).find((p) => p.player_id === id);
			return { scorerName: player?.profiles?.username ?? null };
		}
	}
	return null;
}

/**
 * @param {TimelineEntry[]} timeline
 */
function hasLateGoal(timeline) {
	if (!timeline.length) return false;
	const total = timeline.length;
	const lateIndex = Math.ceil(total * LATE_PERIOD_RATIO);
	for (let i = lateIndex; i < total; i += 1) {
		const entry = timeline[i];
		const prev = timeline[i - 1];
		if (!entry || !prev) continue;
		if (entry.home !== prev.home || entry.away !== prev.away) return true;
	}
	return false;
}
