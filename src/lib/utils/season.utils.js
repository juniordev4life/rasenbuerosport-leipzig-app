const PROJECT_START_YEAR = 2026;
const PROJECT_START_QUARTER = 1;

/**
 * Gets the current season key
 * @returns {string}
 */
export function getCurrentSeason() {
	const now = new Date();
	const quarter = Math.ceil((now.getMonth() + 1) / 3);
	return `${now.getFullYear()}-Q${quarter}`;
}

/**
 * Lists all seasons from current back to project start
 * @returns {string[]}
 */
export function listAllSeasons() {
	const now = new Date();
	let y = now.getFullYear();
	let q = Math.ceil((now.getMonth() + 1) / 3);
	const seasons = [];

	while (
		y > PROJECT_START_YEAR ||
		(y === PROJECT_START_YEAR && q >= PROJECT_START_QUARTER)
	) {
		seasons.push(`${y}-Q${q}`);
		q--;
		if (q < 1) {
			q = 4;
			y--;
		}
	}

	return seasons;
}

/**
 * Gets a localized display name for a season key
 * @param {string} seasonKey
 * @param {string} locale - "de" or "en"
 * @returns {string}
 */
export function getSeasonLabel(seasonKey, locale = "de") {
	const match = seasonKey.match(/^(\d{4})-Q([1-4])$/);
	if (!match) return seasonKey;

	const year = match[1];
	const q = match[2];
	const labels = {
		de: {
			1: "Jan\u2013M\u00e4r",
			2: "Apr\u2013Jun",
			3: "Jul\u2013Sep",
			4: "Okt\u2013Dez",
		},
		en: {
			1: "Jan\u2013Mar",
			2: "Apr\u2013Jun",
			3: "Jul\u2013Sep",
			4: "Oct\u2013Dec",
		},
	};

	return `Q${q} ${year} (${labels[locale]?.[q] || labels.en[q]})`;
}
