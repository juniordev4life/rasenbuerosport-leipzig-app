/**
 * Football teams with league and country metadata.
 * Source: teams.json (25 European top leagues, curated from Transfermarkt).
 * Used for autocomplete and league-based statistics.
 * The `name` field is stored in the DB as plain text — league/country
 * can always be resolved via this constant.
 *
 * @typedef {object} FootballTeam
 * @property {string} name - Team display name
 * @property {string} league - League name (qualified to be unique)
 * @property {string} country - Country code (ISO 3166-1 alpha-2 or subdivision like GB-ENG)
 */

import teamsData from "$lib/data/teams.json";

/**
 * League names that appear in multiple countries — qualified for clarity.
 * Key format: "leagueName|countryCode"
 */
const LEAGUE_QUALIFIERS = {
	"Bundesliga|AT": "Austrian Bundesliga",
	"Premier Liga|RU": "Russian Premier Liga",
	"Premier Liga|UA": "Ukrainian Premier Liga",
	"Superliga|DK": "Danish Superliga",
	"Superliga|RO": "Romanian Superliga",
	"Super League|CH": "Swiss Super League",
};

/** @type {FootballTeam[]} */
export const FOOTBALL_TEAMS = teamsData
	.flatMap((league) =>
		league.teams.map((name) => ({
			name,
			league:
				LEAGUE_QUALIFIERS[`${league.league}|${league.countryCode}`] ||
				league.league,
			country: league.countryCode,
		})),
	)
	.sort((a, b) => a.name.localeCompare(b.name));

/**
 * Helper to find team metadata by name
 * @param {string} teamName - The team name as stored in DB
 * @returns {FootballTeam|undefined}
 */
export function getTeamByName(teamName) {
	return FOOTBALL_TEAMS.find((t) => t.name === teamName);
}

/** Subdivision flag emojis for GB regions */
const SUBDIVISION_FLAGS = {
	"GB-ENG": "\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}",
	"GB-SCT": "\u{1F3F4}\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}",
	"GB-WLS": "\u{1F3F4}\u{E0067}\u{E0062}\u{E0077}\u{E006C}\u{E0073}\u{E007F}",
};

/**
 * Country flag emoji from ISO country code or subdivision code
 * @param {string} countryCode - ISO 3166-1 alpha-2 code (e.g. "DE") or subdivision (e.g. "GB-ENG")
 * @returns {string} Flag emoji
 */
export function getCountryFlag(countryCode) {
	if (!countryCode) return "";

	// Handle GB subdivision flags (England, Scotland, Wales)
	if (SUBDIVISION_FLAGS[countryCode]) {
		return SUBDIVISION_FLAGS[countryCode];
	}

	// Standard 2-character ISO code
	if (countryCode.length !== 2) return "";
	const offset = 127397;
	return String.fromCodePoint(
		...[...countryCode.toUpperCase()].map((c) => c.charCodeAt(0) + offset),
	);
}
