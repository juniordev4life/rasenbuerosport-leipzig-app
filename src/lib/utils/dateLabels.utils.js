/**
 * Short month and weekday names for chart axes, taken from
 * `Intl.DateTimeFormat` so they follow the UI language without word
 * lists. Dates are built and formatted in UTC, so the names never
 * shift with the device's time zone.
 */

/**
 * Short name of the month in a `"YYYY-MM"` key.
 *
 * @param {string} monthKey Year and month, e.g. `"2026-03"`.
 * @param {string} locale BCP 47 tag, e.g. `"de-DE"` or `"en-US"`.
 * @returns {string} The month name, or `monthKey` unchanged when it holds no valid month.
 * @example
 *   monthShortLabel("2026-03", "de-DE"); // → "Mär"
 *   monthShortLabel("2026-03", "en-US"); // → "Mar"
 */
export function monthShortLabel(monthKey, locale) {
	const month = Number.parseInt(monthKey?.split("-")[1], 10);
	if (!(month >= 1 && month <= 12)) return monthKey;
	const format = new Intl.DateTimeFormat(locale, {
		month: "short",
		timeZone: "UTC",
	});
	return format.format(Date.UTC(2000, month - 1, 15));
}

/**
 * Short weekday names from Sunday to Saturday, the order in which the
 * API counts weekdays (0 = Sunday).
 *
 * @param {string} locale BCP 47 tag, e.g. `"de-DE"` or `"en-US"`.
 * @returns {string[]} Seven names, Sunday first.
 * @example
 *   weekdayShortLabels("de-DE"); // → ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"]
 *   weekdayShortLabels("en-US"); // → ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
 */
export function weekdayShortLabels(locale) {
	const format = new Intl.DateTimeFormat(locale, {
		weekday: "short",
		timeZone: "UTC",
	});
	// 2 January 2000 was a Sunday.
	return Array.from({ length: 7 }, (_, day) =>
		format.format(Date.UTC(2000, 0, 2 + day)),
	);
}
