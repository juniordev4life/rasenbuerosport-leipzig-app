import { get } from "./api.services.js";

/**
 * Fetch every league season (an EA FC edition, not a calendar quarter —
 * see `season.stores.js` for that other kind of season), newest first.
 * Exactly one entry has `is_current: true`.
 *
 * @returns {Promise<Array<object>>}
 * @example
 *   const seasons = await getLeagueSeasons();
 *   const current = seasons.find((s) => s.is_current);
 */
export async function getLeagueSeasons() {
	const response = await get("/v1/seasons");
	return response.data ?? [];
}

/**
 * Fetch the Skill-Rating (League-ELO v2) for a season — players and
 * duos, sorted by rating desc. For the current season, `rating` is the
 * live value; for a closed season it is the rating at season end.
 *
 * @param {string} [seasonId] - A season id (e.g. "fc26") or "current".
 * @returns {Promise<{ season: object|null, players: Array<object>, duos: Array<object> }>}
 * @example
 *   const rating = await getSeasonRating("current");
 *   rating.players[0].rating; // → 1624
 */
export async function getSeasonRating(seasonId = "current") {
	const response = await get(
		`/v1/seasons/${encodeURIComponent(seasonId)}/rating`,
	);
	return response.data ?? { season: null, players: [], duos: [] };
}

/**
 * Fetch the signed-in player's recap for a season. Resolves to `null`
 * when the player has no recap for that season (no games, or the
 * recap hasn't been generated yet) — callers should treat that as "no
 * recap to show", not as an error.
 *
 * @param {string} seasonId - A season id, e.g. "fc26".
 * @returns {Promise<object|null>}
 * @example
 *   const recap = await getSeasonRecap("fc26");
 *   if (recap) openRecapStory(recap);
 */
export async function getSeasonRecap(seasonId) {
	const response = await get(
		`/v1/seasons/${encodeURIComponent(seasonId)}/recap/me`,
	);
	return response.data ?? null;
}

/**
 * Fetch the league-wide awards for a season (champion, top scorer,
 * dream duo, ...) — the same list embedded in a recap's `league.awards`.
 *
 * @param {string} seasonId - A season id, e.g. "fc26".
 * @returns {Promise<{ season: object|null, awards: Array<object> }>}
 * @example
 *   const { awards } = await getSeasonAwards("fc26");
 *   awards.find((a) => a.key === "champion")?.players;
 */
export async function getSeasonAwards(seasonId) {
	const response = await get(
		`/v1/seasons/${encodeURIComponent(seasonId)}/awards`,
	);
	return response.data ?? { season: null, awards: [] };
}
