/**
 * Frontend-side metadata for the 9 trophy categories. The backend
 * stamps `category` on every trophy; this map gives each category its
 * label and its place in the shelf order of the trophy room. Categories
 * share one look — they are told apart by name and icon, not by colour.
 */
export const CATEGORY_META = {
	win: { i18nKey: "trophies.category.win", order: 0 },
	streak: { i18nKey: "trophies.category.streak", order: 1 },
	goal: { i18nKey: "trophies.category.goal", order: 2 },
	defense: { i18nKey: "trophies.category.defense", order: 3 },
	special: { i18nKey: "trophies.category.special", order: 4 },
	duo: { i18nKey: "trophies.category.duo", order: 5 },
	rivalry: { i18nKey: "trophies.category.rivalry", order: 6 },
	meta: { i18nKey: "trophies.category.meta", order: 7 },
	hidden: { i18nKey: "trophies.category.hidden", order: 8 },
};

/**
 * Rarity metadata: the tier colour as a CSS custom property (it follows
 * the active design variant) and the display label key.
 */
export const RARITY_META = {
	bronze: {
		color: "var(--color-tier-bronze)",
		i18nKey: "trophies.rarity.bronze",
	},
	silver: {
		color: "var(--color-tier-silver)",
		i18nKey: "trophies.rarity.silver",
	},
	gold: {
		color: "var(--color-tier-gold)",
		i18nKey: "trophies.rarity.gold",
	},
	diamond: {
		color: "var(--color-tier-diamond)",
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
