import { get } from "./api.services.js";

/**
 * Fetch the full trophy room for one player. Returns the payload as
 * the Playmaker emits it: `summary`, `latest`, and the full `trophies`
 * array with every trophy in one of three render-ready states
 * (earned, locked, masked).
 *
 * The frontend never has to call this twice — one round trip yields
 * every state the trophy room renders.
 *
 * @param {string} playerId
 * @returns {Promise<{
 *   playerId: string,
 *   summary: { total: number, unlocked: number, byRarity: Record<string, number>, byCategory: Record<string, number> },
 *   latest: { id: string, name: string, rarity: string, unlockedAt: string } | null,
 *   trophies: Array<object>
 * }>}
 * @example
 *   const room = await getPlayerTrophies("uid-123");
 *   console.log(`${room.summary.unlocked} / ${room.summary.total}`);
 */
export async function getPlayerTrophies(playerId) {
	const response = await get(
		`/v1/players/${encodeURIComponent(playerId)}/trophies`,
	);
	return response.data;
}
