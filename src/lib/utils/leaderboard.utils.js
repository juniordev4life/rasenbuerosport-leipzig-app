/**
 * @file Pure sorting helpers for the Rangliste (Skill-Rating and Liga
 * views). Kept framework-agnostic so the page's `$derived` blocks stay
 * thin and the sort orders are unit-testable without mounting Svelte
 * components. None of these mutate their input array.
 */

/**
 * Sort season-rating players for display. The server sorts
 * `GET /v1/seasons/:id/rating` with qualified players first (by rating
 * desc), then non-qualified ones (also by rating desc) — a player
 * qualifies for a closed season's standings once they reach
 * `season.min_games`; every player qualifies in the current season.
 * The "Aktuell" view keeps that same qualified-first order client-side
 * (defensively re-applied rather than trusted purely from array order).
 * The "Form" view instead sorts by `form_delta` desc, ungated by
 * qualification, since the server has no form-sorted variant. Both
 * fall back to username so the order stays stable when values tie or
 * are missing.
 *
 * @param {Array<object>} players - `rating.players` from `getSeasonRating`.
 * @param {"current"|"form"} sortBy
 * @returns {Array<object>} A new, sorted array.
 * @example
 *   sortPlayers(players, "form")[0].form_delta; // → the biggest gainer
 */
export function sortPlayers(players, sortBy) {
	const list = [...(players ?? [])];
	if (sortBy === "form") {
		list.sort(
			(a, b) =>
				(b.form_delta ?? Number.NEGATIVE_INFINITY) -
					(a.form_delta ?? Number.NEGATIVE_INFINITY) ||
				(a.username ?? "").localeCompare(b.username ?? ""),
		);
		return list;
	}
	list.sort(
		(a, b) =>
			Number(b.qualified ?? true) - Number(a.qualified ?? true) ||
			(b.rating ?? Number.NEGATIVE_INFINITY) -
				(a.rating ?? Number.NEGATIVE_INFINITY) ||
			(a.username ?? "").localeCompare(b.username ?? ""),
	);
	return list;
}

/**
 * Find the season leader for the hero card — the first *qualified*
 * player in rating order. In a closed season a player with fewer than
 * `season.min_games` can still show the highest raw rating (e.g. a
 * hot streak on very few games) without being the champion, so the
 * hero must skip non-qualified entries rather than always taking
 * rank 1. Every player qualifies in the current season, so this is
 * equivalent to the top rating there.
 *
 * @param {Array<object>} players - `rating.players` from `getSeasonRating`.
 * @returns {object|null}
 * @example
 *   findSeasonLeader([
 *     { username: "Hendrik", rating: 1623, qualified: false },
 *     { username: "Nikinho", rating: 1613, qualified: true },
 *   ]).username; // → "Nikinho"
 */
export function findSeasonLeader(players) {
	return (players ?? []).find((p) => p.qualified ?? true) ?? null;
}

/**
 * Index of the first non-qualified player in a qualified-first sorted
 * list (see {@link sortPlayers}) — where the Rangliste inserts the
 * "unter N Spielen · nicht gewertet" divider. Returns -1 when every
 * player qualifies, which callers should read as "no divider".
 *
 * @param {Array<{ qualified?: boolean }>} sortedPlayers
 * @returns {number}
 * @example
 *   firstUnqualifiedIndex([{ qualified: true }, { qualified: false }]); // → 1
 *   firstUnqualifiedIndex([{ qualified: true }]);                       // → -1
 */
export function firstUnqualifiedIndex(sortedPlayers) {
	return (sortedPlayers ?? []).findIndex((p) => p.qualified === false);
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
