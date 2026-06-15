import { ROUTES } from "$lib/constants/routes.constants.js";

/**
 * Prefix → Tolgee title key, consulted longest-prefix-first so detail
 * routes inherit their section title (e.g. `/app/games/123` → games).
 * @type {Array<[string, string]>}
 */
const TITLE_MAP = [
	[ROUTES.LEADERBOARD, "nav.leaderboard"],
	[ROUTES.HISTORY, "nav.games"],
	[ROUTES.NEW_GAME, "nav.new_game"],
	[ROUTES.GAME_DETAIL, "nav.games"],
	[ROUTES.TEAMS, "nav.teams"],
	[ROUTES.STATS, "nav.stats"],
	[ROUTES.WRAPPED, "nav.wrapped"],
	[ROUTES.SEASONS, "nav.seasons"],
	[ROUTES.COMPARE, "compare.title"],
	[ROUTES.CHALLENGES, "challenges.title"],
	[ROUTES.SETTINGS, "nav.settings"],
	[ROUTES.PROFILE, "nav.profile"],
];

/**
 * Resolve a route pathname to the Tolgee key for its desktop top-bar
 * title. The dashboard is intentionally excluded (the top bar shows the
 * personalised greeting there instead) and returns `null`, as do unknown
 * routes (the top bar then falls back to the app name).
 *
 * @param {string} pathname - Current `page.url.pathname`.
 * @returns {string|null} A Tolgee key (e.g. `"nav.leaderboard"`) or `null`.
 * @example
 * getPageTitleKey("/app/leaderboard"); // → "nav.leaderboard"
 * getPageTitleKey("/app/games/abc");   // → "nav.games"
 * getPageTitleKey("/app/dashboard");   // → null
 */
export function getPageTitleKey(pathname) {
	if (!pathname || pathname === ROUTES.DASHBOARD) return null;

	const match = TITLE_MAP.filter(
		([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`),
	).sort((a, b) => b[0].length - a[0].length)[0];

	return match ? match[1] : null;
}
