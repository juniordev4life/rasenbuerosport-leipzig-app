/**
 * Filters of the Historie page: who played (`who`: "all" | "me"), the
 * time window (`zeit`: "all" | "today" | "thisweek" | "thismonth") and
 * the result (`erg`: "all" | "wins" | "losses" | "zunull").
 *
 * `/v1/games` filters by player only (`mine`). Its `from`/`to` take
 * plain dates compared in the database's time zone, not the local day
 * the windows below use, and it has no result filter or total count.
 * So the window and the result are applied to the pages loaded so far,
 * and `isHistoryComplete` tells when no later page can add a match.
 */

import {
	startOfDay,
	startOfMonth,
	startOfWeek,
} from "$lib/utils/dateGrouping.utils.js";

const WINDOW_START = {
	today: startOfDay,
	thisweek: startOfWeek,
	thismonth: startOfMonth,
};

/**
 * Start of a Historie time window, in local time.
 *
 * @param {string} zeit - "all" | "today" | "thisweek" | "thismonth"
 * @param {Date} [now]
 * @returns {number|null} Epoch ms, or `null` for "all"
 * @example
 *   getWindowStart("thisweek", new Date(2026, 9, 4)); // Mon 28 Sep, 00:00
 *   getWindowStart("all"); // null
 */
export function getWindowStart(zeit, now = new Date()) {
	return WINDOW_START[zeit]?.(now) ?? null;
}

/**
 * Whether the page should ask the API for the signed-in player's games
 * only. Wins and losses are always that player's, so they need it too.
 *
 * @param {string} who - "all" | "me"
 * @param {string} erg - "all" | "wins" | "losses" | "zunull"
 * @returns {boolean}
 * @example
 *   ownGamesOnly("all", "wins"); // true
 */
export function ownGamesOnly(who, erg) {
	return who === "me" || erg === "wins" || erg === "losses";
}

/**
 * Result of a game from one player's point of view, by the same rules as
 * the result letter on `MatchCard`: a penalty shootout decides a level
 * score, and a game still being analysed (`pending`, a 0:0 placeholder)
 * has no result yet.
 *
 * @param {object} game - Game row from `/v1/games`
 * @param {string|null} playerId
 * @returns {"W"|"D"|"L"|null} `null` if the player did not play or the
 *   result is pending
 * @example
 *   getPlayerResult(
 *     {
 *       score_home: 1,
 *       score_away: 1,
 *       penalty_shootout: { winner_side: "away" },
 *       game_players: [{ player_id: "jay", team: "away" }],
 *     },
 *     "jay",
 *   ); // "W"
 */
export function getPlayerResult(game, playerId) {
	const entry = findPlayer(game, playerId);
	if (!entry || game.pending) return null;
	const home = game.score_home ?? 0;
	const away = game.score_away ?? 0;
	const winner =
		game.penalty_shootout?.winner_side ??
		(home === away ? null : home > away ? "home" : "away");
	if (!winner) return "D";
	return entry.team === winner ? "W" : "L";
}

/**
 * Whether a game passes the Historie filters. "Nur Siege" and "Nur
 * Niederlagen" have no neutral reading, so they mean the signed-in
 * player's wins and losses under "Alle Spiele" as well.
 *
 * @param {object} game - Game row from `/v1/games`
 * @param {{ who: string, erg: string, windowStart: number|null, userId: string|null }} filters
 * @returns {boolean}
 * @example
 *   const windowStart = getWindowStart("thisweek");
 *   games.filter((g) => matchesHistoryFilters(g, { who, erg, windowStart, userId }));
 */
export function matchesHistoryFilters(game, { who, erg, windowStart, userId }) {
	const ts = new Date(game.played_at).getTime();
	if (!Number.isFinite(ts)) return false;
	if (windowStart != null && ts < windowStart) return false;
	if (who === "me" && !findPlayer(game, userId)) return false;
	if (erg === "wins") return getPlayerResult(game, userId) === "W";
	if (erg === "losses") return getPlayerResult(game, userId) === "L";
	if (erg === "zunull") {
		const home = game.score_home ?? 0;
		const away = game.score_away ?? 0;
		return !game.pending && (home === 0 || away === 0);
	}
	return true;
}

/**
 * Whether every game that can pass the filters is loaded. The API sends
 * games newest first, so once a loaded game is older than the time
 * window, no later page can add a match. Without a window only the end
 * of the list (`hasMore` false) tells.
 *
 * @param {{ games: object[], hasMore: boolean, windowStart: number|null }} list
 * @returns {boolean}
 * @example
 *   isHistoryComplete({ games, hasMore: true, windowStart: getWindowStart("today") });
 */
export function isHistoryComplete({ games, hasMore, windowStart }) {
	if (!hasMore) return true;
	if (windowStart == null || games.length === 0) return false;
	return new Date(games.at(-1).played_at).getTime() < windowStart;
}

/**
 * @param {object} game
 * @param {string|null} playerId
 * @returns {object|null} The player's `game_players` entry
 */
function findPlayer(game, playerId) {
	if (!playerId) return null;
	return game.game_players?.find((p) => p.player_id === playerId) ?? null;
}
