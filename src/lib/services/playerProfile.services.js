import { get } from "./api.services.js";

/**
 * Fetch the V2 player profile (6-axis spider, archetype, bio, relationships, top badges).
 *
 * @param {string} playerId - Firebase UID of the target player.
 * @returns {Promise<object>} The profile payload (state, axes, archetype, bio, relationships, topBadges, recentForm, ...).
 */
export async function getPlayerProfile(playerId) {
	const response = await get(
		`/v1/players/${encodeURIComponent(playerId)}/profile`,
	);
	return response.data;
}

/**
 * Fetch career-wide stats for a player from
 * `/v1/stats/players/:playerId`. Returns the full aggregate (goals,
 * assists, hattricks, longest win streak, highest win, peak ELO, …)
 * used by the profile's lifetime stats card and elsewhere.
 * Server-side aggregation, so no client limit applies.
 *
 * Note: the path is `/stats/players/:id` — the bare `/stats/:id` route
 * is the H2H comparison endpoint and would return a completely
 * different shape.
 *
 * @param {string} playerId
 * @returns {Promise<object>}
 */
export async function getPlayerCareerStats(playerId) {
	const response = await get(
		`/v1/stats/players/${encodeURIComponent(playerId)}`,
	);
	return response.data;
}
