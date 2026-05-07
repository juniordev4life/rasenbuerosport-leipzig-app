/**
 * Formats a goal event as a football minute notation.
 * @param {{ minute: number, stoppage?: number }} event
 * @returns {string}
 * @example
 * formatMinute({ minute: 45, stoppage: 2 }); // → "45+2'"
 * formatMinute({ minute: 23, stoppage: 0 }); // → "23'"
 * formatMinute({ minute: 23 });              // → "23'"
 */
export function formatMinute({ minute, stoppage = 0 }) {
	return stoppage > 0 ? `${minute}+${stoppage}'` : `${minute}'`;
}

/**
 * Derives the match period from a minute value.
 * @param {number} minute
 * @returns {"first_half"|"second_half"|"et_first"|"et_second"}
 * @example
 * getPeriod(30);  // → "first_half"
 * getPeriod(75);  // → "second_half"
 * getPeriod(100); // → "et_first"
 * getPeriod(115); // → "et_second"
 */
export function getPeriod(minute) {
	if (minute <= 45) return "first_half";
	if (minute <= 90) return "second_half";
	if (minute <= 105) return "et_first";
	return "et_second";
}
