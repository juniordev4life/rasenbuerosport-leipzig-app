/**
 * Relative timestamp formatter for the Historie match cards.
 * Returns localised strings like "heute, 14:32" / "gestern, 09:48" /
 * "vor 3 Tagen" / "13.04.2026" depending on how far back the time is.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * @param {string|Date} input
 * @param {"de"|"en"} [locale]
 * @returns {string}
 *
 * @example
 *   relativeTime("2026-05-22T14:32:00Z", "de");
 *   // → "heute, 14:32"
 */
export function relativeTime(input, locale = "de") {
	const date = input instanceof Date ? input : new Date(input);
	if (!Number.isFinite(date.getTime())) return "";
	const now = new Date();
	const todayMs = startOfDay(now);
	const yesterdayMs = todayMs - DAY_MS;
	const ts = date.getTime();
	const time = date.toLocaleTimeString(locale === "en" ? "en-GB" : "de-DE", {
		hour: "2-digit",
		minute: "2-digit",
	});

	if (ts >= todayMs) {
		return locale === "en" ? `today, ${time}` : `heute, ${time}`;
	}
	if (ts >= yesterdayMs) {
		return locale === "en" ? `yesterday, ${time}` : `gestern, ${time}`;
	}
	const daysAgo = Math.floor((todayMs - startOfDay(date)) / DAY_MS);
	if (daysAgo < 7) {
		return locale === "en" ? `${daysAgo} days ago` : `vor ${daysAgo} Tagen`;
	}
	return date.toLocaleDateString(locale === "en" ? "en-GB" : "de-DE", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	});
}

function startOfDay(date) {
	const d = new Date(date);
	d.setHours(0, 0, 0, 0);
	return d.getTime();
}
