import { beforeEach, describe, expect, it } from "vitest";
import {
	availableSlides,
	findClosedSeasonWithRecap,
	isLastSlide,
	isRecapSeen,
	isRecentlyGenerated,
	markRecapSeen,
	nextSlideIndex,
	slideProgressRatios,
} from "$lib/utils/recapStory.utils.js";

describe("availableSlides", () => {
	const slides = [
		{ id: "intro" },
		{ id: "goals", hasData: (r) => typeof r?.goals === "number" },
		{ id: "awards", hasData: (r) => (r?.awards?.length ?? 0) > 0 },
		{ id: "finale" },
	];

	it("keeps slides without a hasData guard", () => {
		const result = availableSlides(slides, {});

		expect(result.map((s) => s.id)).toEqual(["intro", "finale"]);
	});

	it("includes a guarded slide when its data is present", () => {
		const result = availableSlides(slides, { goals: 12 });

		expect(result.map((s) => s.id)).toEqual(["intro", "goals", "finale"]);
	});

	it("skips a guarded slide when its data is missing", () => {
		const result = availableSlides(slides, { goals: 12, awards: [] });

		expect(result.map((s) => s.id)).toEqual(["intro", "goals", "finale"]);
	});

	it("returns an empty array for an empty slide list", () => {
		expect(availableSlides([], {})).toEqual([]);
	});
});

describe("nextSlideIndex", () => {
	it("advances by one step", () => {
		expect(nextSlideIndex(2, 5, 1)).toBe(3);
	});

	it("goes back by one step", () => {
		expect(nextSlideIndex(2, 5, -1)).toBe(1);
	});

	it("clamps at the first slide", () => {
		expect(nextSlideIndex(0, 5, -1)).toBe(0);
	});

	it("clamps at the last slide", () => {
		expect(nextSlideIndex(4, 5, 1)).toBe(4);
	});

	it("returns 0 for an empty story", () => {
		expect(nextSlideIndex(0, 0, 1)).toBe(0);
	});
});

describe("isLastSlide", () => {
	it("is true on the last index", () => {
		expect(isLastSlide(4, 5)).toBe(true);
	});

	it("is false before the last index", () => {
		expect(isLastSlide(3, 5)).toBe(false);
	});

	it("is true for a single-slide story", () => {
		expect(isLastSlide(0, 1)).toBe(true);
	});

	it("is true for an empty story", () => {
		expect(isLastSlide(0, 0)).toBe(true);
	});
});

describe("slideProgressRatios", () => {
	it("fills earlier bars, partially fills the active one, empties the rest", () => {
		expect(slideProgressRatios(3, 1, 0.5)).toEqual([1, 0.5, 0]);
	});

	it("clamps the active ratio to [0, 1]", () => {
		expect(slideProgressRatios(2, 0, 1.4)).toEqual([1, 0]);
		expect(slideProgressRatios(2, 0, -0.4)).toEqual([0, 0]);
	});

	it("returns an empty array for zero slides", () => {
		expect(slideProgressRatios(0, 0, 0.5)).toEqual([]);
	});
});

describe("isRecapSeen / markRecapSeen", () => {
	beforeEach(() => {
		window.localStorage.clear();
	});

	it("is not seen before it has been marked", () => {
		expect(isRecapSeen("fc26")).toBe(false);
	});

	it("is seen after being marked", () => {
		markRecapSeen("fc26");

		expect(isRecapSeen("fc26")).toBe(true);
	});

	it("tracks each season independently", () => {
		markRecapSeen("fc26");

		expect(isRecapSeen("fc27")).toBe(false);
	});

	it("stores the flag under the documented key format", () => {
		markRecapSeen("fc26");

		expect(window.localStorage.getItem("rbl:recap:fc26:v1")).toBe("1");
	});
});

describe("findClosedSeasonWithRecap", () => {
	it("finds the most recent closed season with a recap", () => {
		const seasons = [
			{ id: "fc27", is_current: true, has_recap: false },
			{ id: "fc26", is_current: false, has_recap: true },
			{ id: "fc25", is_current: false, has_recap: true },
		];

		expect(findClosedSeasonWithRecap(seasons)?.id).toBe("fc26");
	});

	it("skips a closed season without a recap yet", () => {
		const seasons = [
			{ id: "fc27", is_current: true, has_recap: false },
			{ id: "fc26", is_current: false, has_recap: false },
		];

		expect(findClosedSeasonWithRecap(seasons)).toBeNull();
	});

	it("returns null for an empty list", () => {
		expect(findClosedSeasonWithRecap([])).toBeNull();
	});
});

describe("isRecentlyGenerated", () => {
	const now = new Date("2026-09-23T00:00:00.000Z");

	it("is true within the window", () => {
		expect(isRecentlyGenerated("2026-09-20T00:00:00.000Z", 14, now)).toBe(true);
	});

	it("is false outside the window", () => {
		expect(isRecentlyGenerated("2026-08-01T00:00:00.000Z", 14, now)).toBe(false);
	});

	it("is false for a missing timestamp", () => {
		expect(isRecentlyGenerated(null, 14, now)).toBe(false);
	});

	it("is false for an unparsable timestamp", () => {
		expect(isRecentlyGenerated("not-a-date", 14, now)).toBe(false);
	});
});
