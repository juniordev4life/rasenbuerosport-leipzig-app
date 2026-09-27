/**
 * @file Pure sorting helpers for the Rangliste (Skill-Rating and Liga
 * views). Kept framework-agnostic so the page's `$derived` blocks stay
 * thin and the sort orders are unit-testable without mounting Svelte
 * components. None of these mutate their input array.
 */

/**
 * Sort season-rating players for display. The server already sorts
 * `GET /v1/seasons/:id/rating` by `rating` desc (ties: username) — the
 * "Aktuell" view keeps that order client-side. The "Form" view instead
 * sorts by `form_delta` desc, since the server has no form-sorted
 * variant. Both fall back to username so the order stays stable when
 * values tie or are missing.
 *
 * @param {Array<object>} players - `rating.players` from `getSeasonRating`.
 * @param {"current"|"form"} sortBy
 * @returns {Array<object>} A new, sorted array.
 * @example
 *   sortPlayers(players, "form")[0].form_delta; // → the biggest gainer
 */
export function sortPlayers(players, sortBy) {
	const list = [...(players ?? [])];
	const key = sortBy === "form" ? "form_delta" : "rating";
	list.sort(
		(a, b) =>
			(b[key] ?? Number.NEGATIVE_INFINITY) -
				(a[key] ?? Number.NEGATIVE_INFINITY) ||
			(a.username ?? "").localeCompare(b.username ?? ""),
	);
	return list;
}

/**
 * Sort Liga (season-table) rows. "total" mirrors the server's default
 * order (points, then points-per-game, goal difference, goals for);
 * "per_game" leads with `points_per_game` instead, which is fairer
 * when players have played very different numbers of matches.
 *
 * @param {Array<object>} rows - `table.rows` from `getSeasonTable`.
 * @param {"total"|"per_game"} mode
 * @returns {Array<object>} A new, sorted array.
 * @example
 *   sortTableRows(rows, "per_game")[0].points_per_game; // → the best rate
 */
export function sortTableRows(rows, mode) {
	const list = [...(rows ?? [])];
	const primary = mode === "per_game" ? "points_per_game" : "points";
	const secondary = mode === "per_game" ? "points" : "points_per_game";
	list.sort(
		(a, b) =>
			(b[primary] ?? Number.NEGATIVE_INFINITY) -
				(a[primary] ?? Number.NEGATIVE_INFINITY) ||
			(b[secondary] ?? Number.NEGATIVE_INFINITY) -
				(a[secondary] ?? Number.NEGATIVE_INFINITY) ||
			(b.goal_diff ?? Number.NEGATIVE_INFINITY) -
				(a.goal_diff ?? Number.NEGATIVE_INFINITY) ||
			(b.goals_for ?? Number.NEGATIVE_INFINITY) -
				(a.goals_for ?? Number.NEGATIVE_INFINITY),
	);
	return list;
}

/**
 * Build the sorted `<a>_<b>` duo id the `/app/duo/:id` route expects,
 * from two player ids in any order. The API's `duo_id` already comes
 * pre-sorted in this shape; this helper lets call sites derive the
 * same id locally (and lets the format be unit-tested on its own).
 *
 * @param {string} playerIdA
 * @param {string} playerIdB
 * @returns {string}
 * @example
 *   buildDuoId("bob", "alice"); // → "alice_bob"
 */
export function buildDuoId(playerIdA, playerIdB) {
	return [playerIdA, playerIdB].sort().join("_");
}
