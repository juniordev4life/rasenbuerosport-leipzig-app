/**
 * Teams data service with in-memory caching.
 * Fetches enriched team data (logos, ratings, stars) from the API
 * and provides lookup/search utilities.
 *
 * Replaces the static teams.json approach with live API data.
 */
import { get } from "$lib/services/api.services.js";

/** @type {TeamData[]|null} */
let teamsCache = null;

/** @type {Map<string, TeamData>} */
const teamsByNameCache = new Map();

/** @type {Promise<TeamData[]>|null} */
let fetchPromise = null;

/**
 * @typedef {object} TeamData
 * @property {string} id
 * @property {string} name
 * @property {string|null} short_name
 * @property {string|null} logo_url
 * @property {number|null} sofifa_id
 * @property {number|null} overall_rating
 * @property {number|null} star_rating
 * @property {string|null} league_name
 * @property {string|null} country_code
 */

/**
 * Fetches all teams from API (cached after first call).
 * Uses a shared promise to deduplicate concurrent calls.
 * @returns {Promise<TeamData[]>}
 */
export async function getAllTeams() {
	if (teamsCache) return teamsCache;
	if (fetchPromise) return fetchPromise;

	fetchPromise = get("/v1/teams")
		.then((res) => {
			teamsCache = res.data || [];
			teamsByNameCache.clear();
			for (const team of teamsCache) {
				teamsByNameCache.set(team.name, team);
			}
			fetchPromise = null;
			return teamsCache;
		})
		.catch((err) => {
			fetchPromise = null;
			throw err;
		});

	return fetchPromise;
}

/**
 * Searches teams by name or league (client-side filter on cached data).
 * @param {string} query - Search query
 * @param {number} [limit=8] - Max results
 * @returns {Promise<TeamData[]>}
 */
export async function searchTeams(query, limit = 8) {
	const teams = await getAllTeams();
	if (!query || query.length < 1) return [];

	const q = query.toLowerCase();
	return teams
		.filter(
			(t) =>
				t.name.toLowerCase().includes(q) ||
				t.league_name?.toLowerCase().includes(q),
		)
		.slice(0, limit);
}

/**
 * Finds a team by exact name match.
 * @param {string} teamName
 * @returns {Promise<TeamData|undefined>}
 */
export async function getTeamByName(teamName) {
	if (!teamName) return undefined;
	await getAllTeams();
	return teamsByNameCache.get(teamName);
}

/**
 * Gets unique league names from the teams data.
 * @returns {Promise<string[]>}
 */
export async function getLeagues() {
	const teams = await getAllTeams();
	const leagues = [...new Set(teams.map((t) => t.league_name).filter(Boolean))];
	return leagues.sort();
}

/**
 * Invalidates the cache (e.g., after data changes).
 */
export function invalidateTeamsCache() {
	teamsCache = null;
	teamsByNameCache.clear();
	fetchPromise = null;
}
