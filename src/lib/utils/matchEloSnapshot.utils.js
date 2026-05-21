/**
 * Helpers for reading per-player ELO results out of `game.elo_snapshot`.
 * The snapshot shape is produced by `eloEngine.services.js` in the API
 * and looks like:
 *   { teamA: [{ playerId, ratingBefore, ratingAfter, delta, ... }], teamB: [...] }
 * teamA == home, teamB == away.
 */

/** @typedef {{ delta: number, ratingBefore: number, ratingAfter: number }} EloResult */

/**
 * Build a `{ [playerId]: { delta, ratingBefore, ratingAfter } }` map
 * from a game's elo_snapshot. Missing snapshots → empty map.
 *
 * @param {object|null|undefined} snapshot
 * @returns {Record<string, EloResult>}
 * @example
 *   const elo = getEloDeltaByPlayer(game.elo_snapshot);
 *   elo["marco"]?.delta // → 12
 */
export function getEloDeltaByPlayer(snapshot) {
	/** @type {Record<string, EloResult>} */
	const out = {};
	if (!snapshot) return out;
	for (const side of ["teamA", "teamB"]) {
		const arr = Array.isArray(snapshot[side]) ? snapshot[side] : [];
		for (const entry of arr) {
			if (!entry?.playerId) continue;
			out[entry.playerId] = {
				delta: entry.delta ?? 0,
				ratingBefore: entry.ratingBefore ?? 0,
				ratingAfter: entry.ratingAfter ?? 0,
			};
		}
	}
	return out;
}

/**
 * Format an ELO delta as a signed integer string with a leading
 * minus-sign for losses and a unicode minus for proper typography.
 *
 * @param {number} delta
 * @returns {string}
 * @example
 *   formatEloDelta(12) // → "+12"
 *   formatEloDelta(-8) // → "−8"
 */
export function formatEloDelta(delta) {
	if (delta > 0) return `+${delta}`;
	if (delta < 0) return `−${Math.abs(delta)}`;
	return "±0";
}
