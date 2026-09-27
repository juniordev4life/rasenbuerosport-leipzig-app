/**
 * @file Pure helpers for the FC26 recap story (`SeasonRecapStory.svelte`).
 * Kept outside the component so slide availability, navigation and
 * progress can be unit-tested without mounting the full Svelte tree
 * and its timers/animations.
 */

/**
 * Filter a fixed slide list down to the ones with data to show. Each
 * slide declares an optional `hasData(recap)` guard; slides without
 * one are always shown (e.g. the intro and the finale).
 *
 * @param {Array<{ id: string, hasData?: (recap: object) => boolean }>} slides
 * @param {object|null} recap - The payload from `getSeasonRecap`.
 * @returns {Array<{ id: string, hasData?: (recap: object) => boolean }>}
 *   The slides whose data is present, in the given order.
 * @example
 *   availableSlides(SLIDES, recap).map((s) => s.id);
 *   // → ["intro", "numbers", "goals", "elo_journey", "finale"]
 */
export function availableSlides(slides, recap) {
	return (slides ?? []).filter(
		(slide) => !slide.hasData || slide.hasData(recap),
	);
}

/**
 * Clamp-advance the current slide index by one step (`+1` / `-1`).
 * Stays within `[0, length - 1]` instead of wrapping, so calling this
 * again at either end is a safe no-op rather than jumping to the
 * other side of the story.
 *
 * @param {number} index - Current slide index.
 * @param {number} length - Total number of available slides.
 * @param {1|-1} step
 * @returns {number}
 * @example
 *   nextSlideIndex(0, 5, -1); // → 0 (no previous slide, stays put)
 *   nextSlideIndex(2, 5, 1);  // → 3
 */
export function nextSlideIndex(index, length, step) {
	if (length <= 0) return 0;
	return Math.min(length - 1, Math.max(0, index + step));
}

/**
 * Whether the given index is the last slide of the story — i.e.
 * whether auto-advance should stop instead of moving on.
 *
 * @param {number} index
 * @param {number} length
 * @returns {boolean}
 * @example
 *   isLastSlide(4, 5); // → true
 *   isLastSlide(0, 1); // → true (a single-slide story has no "next")
 */
export function isLastSlide(index, length) {
	return length <= 0 || index >= length - 1;
}

const RECAP_FLAG_PREFIX = "rbl:recap:";
const RECAP_FLAG_SUFFIX = ":v1";

function recapFlagKey(seasonId) {
	return `${RECAP_FLAG_PREFIX}${seasonId}${RECAP_FLAG_SUFFIX}`;
}

/**
 * Whether the signed-in device has already seen the recap story for a
 * given season. Returns `false` when `localStorage` is unavailable
 * (SSR, private mode) — better to over-show the story than to
 * silently swallow it.
 *
 * @param {string} seasonId
 * @returns {boolean}
 * @example
 *   if (!isRecapSeen("fc26")) offerRecapStory("fc26");
 */
export function isRecapSeen(seasonId) {
	if (typeof window === "undefined") return false;
	try {
		return window.localStorage.getItem(recapFlagKey(seasonId)) === "1";
	} catch {
		return false;
	}
}

/**
 * Persist that the recap story for a season has been shown (closed or
 * finished), so the auto-launcher doesn't offer it again. Silently
 * no-ops when `localStorage` is unavailable.
 *
 * @param {string} seasonId
 * @returns {void}
 * @example
 *   markRecapSeen("fc26");
 */
export function markRecapSeen(seasonId) {
	if (typeof window === "undefined") return;
	try {
		window.localStorage.setItem(recapFlagKey(seasonId), "1");
	} catch {
		// Storage quota or privacy mode — the story may be offered again
		// next session, which is an acceptable fallback.
	}
}

/**
 * Per-slide progress-bar fill ratios (0..1) for the top progress bars,
 * Instagram-story style: every bar before the active one is full, the
 * active one reflects `elapsedRatio`, and every bar after it is empty.
 *
 * @param {number} count - Total number of slides.
 * @param {number} activeIndex
 * @param {number} elapsedRatio - 0..1 progress within the active slide.
 * @returns {number[]}
 * @example
 *   slideProgressRatios(3, 1, 0.5); // → [1, 0.5, 0]
 */
export function slideProgressRatios(count, activeIndex, elapsedRatio) {
	const clamped = Math.max(0, Math.min(1, elapsedRatio || 0));
	return Array.from({ length: Math.max(0, count) }, (_, i) => {
		if (i < activeIndex) return 1;
		if (i > activeIndex) return 0;
		return clamped;
	});
}
