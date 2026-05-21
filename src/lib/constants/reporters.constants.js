/**
 * Reporter personas for the AI Spielbericht. Three voices, three
 * characters — Marcel (Chronist), Sophie (Analytikerin), Frank
 * (Euphoriker). The reporter id stored on `games.reporter_id` is the
 * legacy slug (`klassiker`/`analyst`/`euphoriker`); the mapping below
 * resolves it to the full persona used by the UI.
 */

/**
 * @typedef {object} ReporterPersona
 * @property {string} id - Legacy reporter id (matches `games.reporter_id`).
 * @property {string} slug - Short slug for image lookup + i18n keys.
 * @property {string} name - First name shown in the card header.
 * @property {string} titleKey - i18n key for the role title (e.g. "Der Chronist").
 * @property {string} imageUrl - Public path to the photo asset.
 * @property {string} accentClass - Tailwind class for the accent colour.
 * @property {string} ringClass - Tailwind ring class for the avatar.
 * @property {string} gradientFromClass - Tailwind gradient-from for the card.
 * @property {Array<{ iconKey: string, labelKey: string }>} pills
 * @property {string[]} bioKeys - i18n keys, one per bio paragraph.
 * @property {string} quoteKey - i18n key for the pull quote.
 */

/** @type {Record<string, ReporterPersona>} */
export const REPORTERS = {
	klassiker: {
		id: "klassiker",
		slug: "marcel",
		name: "Marcel",
		titleKey: "match_report.reporter_bio.marcel.title",
		imageUrl: "/images/reporter/marcel.webp",
		accentClass: "text-accent-red",
		ringClass: "ring-accent-red",
		gradientFromClass: "from-accent-red/10",
		pills: [
			{ iconKey: "📺", labelKey: "match_report.reporter_bio.marcel.pill_experience" },
			{ iconKey: "🎙", labelKey: "match_report.reporter_bio.marcel.pill_role" },
		],
		bioKeys: [
			"match_report.reporter_bio.marcel.bio_1",
			"match_report.reporter_bio.marcel.bio_2",
		],
		quoteKey: "match_report.reporter_bio.marcel.quote",
	},
	analyst: {
		id: "analyst",
		slug: "sophie",
		name: "Sophie",
		titleKey: "match_report.reporter_bio.sophie.title",
		imageUrl: "/images/reporter/sophie.webp",
		accentClass: "text-blue-400",
		ringClass: "ring-blue-400",
		gradientFromClass: "from-blue-400/10",
		pills: [
			{ iconKey: "📊", labelKey: "match_report.reporter_bio.sophie.pill_field" },
			{ iconKey: "🎓", labelKey: "match_report.reporter_bio.sophie.pill_degree" },
		],
		bioKeys: [
			"match_report.reporter_bio.sophie.bio_1",
			"match_report.reporter_bio.sophie.bio_2",
		],
		quoteKey: "match_report.reporter_bio.sophie.quote",
	},
	euphoriker: {
		id: "euphoriker",
		slug: "frank",
		name: "Frank",
		titleKey: "match_report.reporter_bio.frank.title",
		imageUrl: "/images/reporter/frank.webp",
		accentClass: "text-warning",
		ringClass: "ring-warning",
		gradientFromClass: "from-warning/10",
		pills: [
			{ iconKey: "🔥", labelKey: "match_report.reporter_bio.frank.pill_experience" },
			{ iconKey: "⚽", labelKey: "match_report.reporter_bio.frank.pill_role" },
		],
		bioKeys: [
			"match_report.reporter_bio.frank.bio_1",
			"match_report.reporter_bio.frank.bio_2",
		],
		quoteKey: "match_report.reporter_bio.frank.quote",
	},
};

/**
 * Resolve a reporter id to its persona definition, returning `null`
 * for unknown ids (e.g. legacy games predating the persona system).
 *
 * @param {string|null|undefined} reporterId
 * @returns {ReporterPersona|null}
 * @example
 *   getReporter("klassiker")?.name // → "Marcel"
 */
export function getReporter(reporterId) {
	if (!reporterId) return null;
	return REPORTERS[reporterId] ?? null;
}
