import { get } from "./api.services.js";

/**
 * Fetch the active challenges for the current Berlin week along with the
 * caller's progress.
 *
 * @returns {Promise<{
 *   week_start: string,
 *   week_end: string,
 *   ms_remaining: number,
 *   challenges: Array<object>,
 * }>}
 *
 * @example
 *   const { challenges } = (await fetchActiveChallenges()).data;
 */
export async function fetchActiveChallenges() {
	return get("/v1/challenges/active");
}

/**
 * Fetch up to `limit` past weeks with completion data for the caller.
 *
 * @param {number} [limit=12]
 * @returns {Promise<object>}
 */
export async function fetchChallengeHistory(limit = 12) {
	return get(`/v1/challenges/history?limit=${limit}`);
}

/**
 * Fetch the all-time challenge bonus-points leaderboard.
 *
 * @param {number} [limit=20]
 * @returns {Promise<object>}
 */
export async function fetchChallengeLeaderboard(limit = 20) {
	return get(`/v1/challenges/leaderboard?limit=${limit}`);
}
