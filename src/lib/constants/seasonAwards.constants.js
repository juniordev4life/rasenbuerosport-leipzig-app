/**
 * Frontend display metadata for the fixed season-award keys returned by
 * `GET /v1/seasons/:id/awards` (and folded into a recap's
 * `league.awards`). Keyed by the award's `key` field. The label itself
 * resolves through i18n (`season_awards.<key>.label`) — this map only
 * owns the emoji and the display order, since both are fixed by the
 * award definition rather than by locale.
 */

export const AWARD_EMOJI = Object.freeze({
	champion: "\u{1F451}", // 👑
	top_scorer: "⚽", // ⚽
	top_assister: "\u{1F3AF}", // 🎯
	dream_duo: "\u{1F91D}", // 🤝
	penalty_king: "\u{1F945}", // 🥅
	fair_play: "\u{1F54A}️", // 🕊️
	wall: "\u{1F9F1}", // 🧱
	marathon: "\u{1F3C3}", // 🏃
	form_of_the_year: "\u{1F4C8}", // 📈
	lunch_king: "\u{1F96A}", // 🥪
	comeback_king: "\u{1F504}", // 🔄
	unlucky: "\u{1F643}", // 🙃
});

/**
 * Display order for an awards grid/strip — the champion leads, the
 * lighter/funnier awards trail. Unknown keys (a future award the
 * frontend doesn't know about yet) are appended by {@link orderAwards}
 * rather than dropped.
 */
export const AWARD_ORDER = Object.freeze([
	"champion",
	"top_scorer",
	"top_assister",
	"dream_duo",
	"wall",
	"fair_play",
	"penalty_king",
	"form_of_the_year",
	"marathon",
	"lunch_king",
	"comeback_king",
	"unlucky",
]);

/**
 * Sort a list of award objects (as returned by the API) into the fixed
 * display order above.
 *
 * @param {Array<{ key: string }>} awards
 * @returns {Array<{ key: string }>} A new, sorted array.
 * @example
 *   orderAwards([{ key: "top_scorer" }, { key: "champion" }]).map((a) => a.key);
 *   // → ["champion", "top_scorer"]
 */
export function orderAwards(awards) {
	const rank = new Map(AWARD_ORDER.map((key, i) => [key, i]));
	return [...(awards ?? [])].sort(
		(a, b) =>
			(rank.get(a.key) ?? AWARD_ORDER.length) -
			(rank.get(b.key) ?? AWARD_ORDER.length),
	);
}

/**
 * Format an award's numeric `value` for display, based on its `unit`.
 * Per-game ratios render with two decimals and the locale's decimal
 * separator; everything else (ELO, goals, assists, points, games) is a
 * whole number without a thousands separator, as the app shows ELO
 * everywhere else.
 *
 * @param {number|null|undefined} value
 * @param {string} unit - One of the API's award `unit` values.
 * @param {string} [locale] - BCP 47 tag, e.g. `"de-DE"` or `"en-US"`.
 * @returns {string}
 * @example
 *   formatAwardValue(1624, "elo", "de-DE");            // → "1624"
 *   formatAwardValue(0.12, "cards_per_game", "de-DE");  // → "0,12"
 *   formatAwardValue(0.12, "cards_per_game", "en-US");  // → "0.12"
 *   formatAwardValue(null, "elo");                      // → "—"
 */
export function formatAwardValue(value, unit, locale = "de-DE") {
	if (typeof value !== "number" || !Number.isFinite(value)) return "—";
	if (unit === "cards_per_game" || unit === "goals_per_game") {
		return new Intl.NumberFormat(locale, {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		}).format(value);
	}
	return String(Math.round(value));
}
