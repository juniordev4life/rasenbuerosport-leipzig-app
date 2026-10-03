import { ROUTES } from "$lib/constants/routes.constants.js";

/** Bottom-nav tabs: phones show no back button on these pages. */
const MOBILE_ROOTS = new Set([
	ROUTES.DASHBOARD,
	ROUTES.LEADERBOARD,
	ROUTES.HISTORY,
	ROUTES.PROFILE,
]);

/** Sidebar destinations (plus Settings from the account menu): desktop
 * shows no back button on these pages. */
const DESKTOP_ROOTS = new Set([
	...MOBILE_ROOTS,
	ROUTES.NEW_GAME,
	ROUTES.STATS,
	ROUTES.TEAMS,
	ROUTES.WRAPPED,
	ROUTES.SETTINGS,
]);

/**
 * Whether the header of the given layout shows a back button: every page
 * under `/app/` except the layout's top-level destinations.
 *
 * @param {string} pathname - Current `page.url.pathname`.
 * @param {"mobile"|"desktop"} layout - Phone header or desktop top bar.
 * @returns {boolean} True when a back button belongs in the header.
 * @example
 * hasBackButton("/app/games/abc", "mobile"); // → true
 * hasBackButton("/app/stats", "mobile");     // → true
 * hasBackButton("/app/stats", "desktop");    // → false
 */
export function hasBackButton(pathname, layout) {
	if (!pathname?.startsWith("/app/")) return false;
	const roots = layout === "desktop" ? DESKTOP_ROOTS : MOBILE_ROOTS;
	return !roots.has(pathname);
}

/**
 * Go back one step. A page opened directly (no history to return to)
 * goes to the dashboard instead.
 *
 * @returns {void}
 * @example
 * <button onclick={goBack}>Zurück</button>
 */
export function goBack() {
	if (typeof history !== "undefined" && history.length > 1) {
		history.back();
		return;
	}
	window.location.assign(ROUTES.DASHBOARD);
}
