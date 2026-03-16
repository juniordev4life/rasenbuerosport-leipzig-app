import { ROUTES } from "$lib/constants/routes.constants.js";

/**
 * Build a rematch URL from game data
 * @param {object} params
 * @param {string[]} params.homePlayers - Home player IDs
 * @param {string[]} params.awayPlayers - Away player IDs
 * @param {string} params.homeTeam - Home team name
 * @param {string} params.awayTeam - Away team name
 * @param {boolean} [params.swap=false] - Whether to swap home/away sides
 * @returns {string} URL path with query params
 */
export function buildRematchUrl({
	homePlayers,
	awayPlayers,
	homeTeam,
	awayTeam,
	swap = false,
}) {
	const params = new URLSearchParams();

	if (swap) {
		params.set("hp", awayPlayers.join(","));
		params.set("ap", homePlayers.join(","));
		params.set("ht", awayTeam);
		params.set("at", homeTeam);
	} else {
		params.set("hp", homePlayers.join(","));
		params.set("ap", awayPlayers.join(","));
		params.set("ht", homeTeam);
		params.set("at", awayTeam);
	}

	return `${ROUTES.NEW_GAME}?${params.toString()}`;
}

/**
 * Parse rematch params from URL search params
 * @param {URLSearchParams} searchParams
 * @returns {{ homePlayers: string[], awayPlayers: string[], homeTeam: string, awayTeam: string } | null}
 */
export function parseRematchParams(searchParams) {
	const hp = searchParams.get("hp");
	const ap = searchParams.get("ap");
	const ht = searchParams.get("ht");
	const at = searchParams.get("at");

	if (!hp || !ap || !ht || !at) return null;

	return {
		homePlayers: hp.split(",").filter(Boolean),
		awayPlayers: ap.split(",").filter(Boolean),
		homeTeam: ht,
		awayTeam: at,
	};
}
