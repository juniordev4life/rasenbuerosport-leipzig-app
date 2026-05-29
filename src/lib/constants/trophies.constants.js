/**
 * Frontend-side metadata for the 9 trophy categories. The backend
 * stamps `category` on every trophy; this map tells the trophy room
 * how each category should look (icon colour, gradient tint) and in
 * what order the regal-shelves stack on the page.
 *
 * Colours mirror the HTML mockup — keep these in sync with the
 * design.
 */

export const CATEGORY_META = {
	win: {
		colorHex: "#84CC16",
		bgRgba: "rgba(132, 204, 22, 0.12)",
		borderRgba: "rgba(132, 204, 22, 0.25)",
		i18nKey: "trophies.category.win",
		order: 0,
	},
	streak: {
		colorHex: "#E24B4A",
		bgRgba: "rgba(226, 75, 74, 0.12)",
		borderRgba: "rgba(226, 75, 74, 0.25)",
		i18nKey: "trophies.category.streak",
		order: 1,
	},
	goal: {
		colorHex: "#EC4899",
		bgRgba: "rgba(236, 72, 153, 0.12)",
		borderRgba: "rgba(236, 72, 153, 0.25)",
		i18nKey: "trophies.category.goal",
		order: 2,
	},
	defense: {
		colorHex: "#818CF8",
		bgRgba: "rgba(129, 140, 248, 0.12)",
		borderRgba: "rgba(129, 140, 248, 0.25)",
		i18nKey: "trophies.category.defense",
		order: 3,
	},
	special: {
		colorHex: "#A855F7",
		bgRgba: "rgba(168, 85, 247, 0.12)",
		borderRgba: "rgba(168, 85, 247, 0.25)",
		i18nKey: "trophies.category.special",
		order: 4,
	},
	duo: {
		colorHex: "#22C55E",
		bgRgba: "rgba(34, 197, 94, 0.12)",
		borderRgba: "rgba(34, 197, 94, 0.25)",
		i18nKey: "trophies.category.duo",
		order: 5,
	},
	rivalry: {
		colorHex: "#FB923C",
		bgRgba: "rgba(251, 146, 60, 0.12)",
		borderRgba: "rgba(251, 146, 60, 0.25)",
		i18nKey: "trophies.category.rivalry",
		order: 6,
	},
	meta: {
		colorHex: "#94A3B8",
		bgRgba: "rgba(148, 163, 184, 0.12)",
		borderRgba: "rgba(148, 163, 184, 0.25)",
		i18nKey: "trophies.category.meta",
		order: 7,
	},
	hidden: {
		colorHex: "#A78BFA",
		bgRgba: "rgba(167, 139, 250, 0.12)",
		borderRgba: "rgba(167, 139, 250, 0.25)",
		i18nKey: "trophies.category.hidden",
		order: 8,
	},
};

/**
 * Rarity metadata — colour + display label key. Matches the
 * mockup's bronze/silver/gold/diamond palette.
 */
export const RARITY_META = {
	bronze: {
		colorHex: "#CD7F32",
		i18nKey: "trophies.rarity.bronze",
	},
	silver: {
		colorHex: "#C0C0C0",
		i18nKey: "trophies.rarity.silver",
	},
	gold: {
		colorHex: "#FBBF24",
		i18nKey: "trophies.rarity.gold",
	},
	diamond: {
		colorHex: "#67E8F9",
		i18nKey: "trophies.rarity.diamond",
	},
};

/**
 * Categories ordered for rendering — used to drive the shelf
 * sequence on the trophy room.
 *
 * @returns {Array<string>} Category keys in display order
 * @example
 *   for (const cat of orderedCategories()) renderShelf(cat);
 */
export function orderedCategories() {
	return Object.entries(CATEGORY_META)
		.sort((a, b) => a[1].order - b[1].order)
		.map(([key]) => key);
}
