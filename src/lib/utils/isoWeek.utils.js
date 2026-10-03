/**
 * ISO 8601 calendar week ("KW") of a date, in local time. Weeks start on
 * Monday; week 1 is the one with the year's first Thursday.
 *
 * @param {Date} date
 * @returns {number} 1–53
 * @example
 *   isoWeek(new Date(2026, 8, 28)); // 40
 */
export function isoWeek(date) {
	const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
	const dayNum = (d.getDay() + 6) % 7;
	d.setDate(d.getDate() - dayNum + 3);
	const firstThursday = new Date(d.getFullYear(), 0, 4);
	const diff = d - firstThursday;
	return 1 + Math.round(diff / (7 * 24 * 60 * 60 * 1000));
}
