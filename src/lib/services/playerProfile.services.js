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
