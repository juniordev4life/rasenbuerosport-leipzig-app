/**
 * Minutes that allow stoppage time entries (end of each half).
 * @type {ReadonlyArray<number>}
 */
const STOPPAGE_ENDPOINTS = Object.freeze([45, 90, 105, 120]);

/**
 * Maximum stoppage value at any single endpoint (matches `MinutePicker`).
 * @type {number}
 */
const MAX_STOPPAGE = 5;

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

/**
 * Lexicographic comparator for `(minute, stoppage)` pairs. Returns a negative
 * number if `a` is earlier than `b`, zero if equal, positive if later.
 *
 * Both fields default to `0` when missing, so legacy entries without
 * `stoppage` compare cleanly against current ones.
 *
 * @param {{ minute?: number, stoppage?: number }} a
 * @param {{ minute?: number, stoppage?: number }} b
 * @returns {number}
 * @example
 * compareMinute({ minute: 11 }, { minute: 12 });               // → < 0
 * compareMinute({ minute: 45, stoppage: 2 }, { minute: 45 });  // → > 0
 * compareMinute({ minute: 30 }, { minute: 30 });               // → 0
 */
export function compareMinute(a, b) {
	const am = a?.minute ?? 0;
	const bm = b?.minute ?? 0;
	if (am !== bm) return am - bm;
	return (a?.stoppage ?? 0) - (b?.stoppage ?? 0);
}

/**
 * Compute the smallest `(minute, stoppage)` pair that may legally come AFTER
 * the latest event already on the timeline within the given period.
 *
 * Rules:
 * - Penalty shootout (`period === "penalty"`) returns `null` — events there
 *   carry no minute and require no order.
 * - Empty regular period defaults to `(1, 0)`.
 * - Empty extra-time period defaults to `(91, 0)` — extra time always starts
 *   after minute 90 regardless of how regular play ended.
 * - When the prior event is at a stoppage-fähiger Endpunkt (45/90/105/120) and
 *   the stoppage is below the cap, the next event may stay on the same minute
 *   with `stoppage + 1`.
 * - Otherwise, the floor jumps to `(minute + 1, 0)`.
 *
 * @param {Array<{ period?: string, minute?: number, stoppage?: number }>} [timeline]
 * @param {"regular"|"extra_time"|"penalty"} period
 * @returns {{ minute: number, stoppage: number }|null}
 * @example
 * getMinMinuteForNextEvent([], "regular");
 * // → { minute: 1, stoppage: 0 }
 *
 * getMinMinuteForNextEvent(
 *   [{ period: "regular", minute: 45, stoppage: 2 }],
 *   "regular"
 * );
 * // → { minute: 45, stoppage: 3 }
 *
 * getMinMinuteForNextEvent(
 *   [{ period: "regular", minute: 30 }],
 *   "regular"
 * );
 * // → { minute: 31, stoppage: 0 }
 *
 * getMinMinuteForNextEvent([], "extra_time");
 * // → { minute: 91, stoppage: 0 }
 *
 * getMinMinuteForNextEvent([], "penalty");
 * // → null
 */
export function getMinMinuteForNextEvent(timeline, period) {
	if (period === "penalty") return null;

	const events = (timeline ?? []).filter(
		(e) => (e?.period ?? "regular") === period && typeof e?.minute === "number",
	);

	if (events.length === 0) {
		return period === "extra_time"
			? { minute: 91, stoppage: 0 }
			: { minute: 1, stoppage: 0 };
	}

	let last = events[0];
	for (const e of events) {
		if (compareMinute(e, last) > 0) last = e;
	}

	const lastMin = last.minute;
	const lastStop = last.stoppage ?? 0;

	if (STOPPAGE_ENDPOINTS.includes(lastMin) && lastStop < MAX_STOPPAGE) {
		return { minute: lastMin, stoppage: lastStop + 1 };
	}
	return { minute: lastMin + 1, stoppage: 0 };
}

/**
 * Validate that a candidate `(minute, stoppage)` pair is strictly after every
 * prior event of the same period on the timeline. Returns the floor that was
 * checked against, so callers can render an "earliest allowed" hint.
 *
 * @param {{ minute: number, stoppage?: number }} candidate
 * @param {Array<{ period?: string, minute?: number, stoppage?: number }>} timeline
 * @param {"regular"|"extra_time"|"penalty"} period
 * @returns {{ valid: boolean, floor: { minute: number, stoppage: number }|null }}
 * @example
 * validateMinuteAgainstTimeline(
 *   { minute: 12 },
 *   [{ period: "regular", minute: 11 }],
 *   "regular"
 * );
 * // → { valid: true, floor: { minute: 12, stoppage: 0 } }
 *
 * validateMinuteAgainstTimeline(
 *   { minute: 11 },
 *   [{ period: "regular", minute: 11 }],
 *   "regular"
 * );
 * // → { valid: false, floor: { minute: 12, stoppage: 0 } }
 */
export function validateMinuteAgainstTimeline(candidate, timeline, period) {
	const floor = getMinMinuteForNextEvent(timeline, period);
	if (!floor) return { valid: true, floor: null };
	const valid = compareMinute(candidate, floor) >= 0;
	return { valid, floor };
}
