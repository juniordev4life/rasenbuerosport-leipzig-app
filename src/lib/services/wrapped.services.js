import { get } from "./api.services.js";

/**
 * Fetch the most recent persisted wrapped snapshot.
 * Returns null when no wrapped exists yet.
 *
 * @returns {Promise<object|null>}
 * @example
 *   const wrapped = await getLatestWrapped();
 *   if (wrapped?.talkrunde?.status === "ready") { ... }
 */
export async function getLatestWrapped() {
	const response = await get("/v1/wrapped/latest");
	return response.data ?? null;
}

/**
 * Fetch all wrapped snapshots (newest first). Used by the wrapped
 * page to drive the week navigation.
 *
 * @param {number} [limit]
 * @returns {Promise<Array<object>>}
 */
export async function listWrapped(limit = 20) {
	const response = await get(`/v1/wrapped?limit=${limit}`);
	return response.data ?? [];
}

/**
 * Fetch a specific wrapped by its `week_start` (Monday of the target
 * week, YYYY-MM-DD). Returns null when that week has never been
 * generated.
 *
 * @param {string} weekStart - ISO date, e.g. "2026-05-25"
 * @returns {Promise<object|null>}
 */
export async function getWrappedByWeekStart(weekStart) {
	const response = await get(
		`/v1/wrapped/${encodeURIComponent(weekStart)}`,
	);
	return response.data ?? null;
}
