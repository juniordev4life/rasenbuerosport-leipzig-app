import { describe, expect, it } from "vitest";
import {
	compareMinute,
	formatMinute,
	getMinMinuteForNextEvent,
	getPeriod,
	validateMinuteAgainstTimeline,
} from "$lib/utils/minute.utils.js";

describe("formatMinute", () => {
	it("renders plain minute when stoppage is zero", () => {
		expect(formatMinute({ minute: 23, stoppage: 0 })).toBe("23'");
	});

	it("renders plain minute when stoppage is omitted", () => {
		expect(formatMinute({ minute: 7 })).toBe("7'");
	});

	it("renders stoppage notation when stoppage > 0", () => {
		expect(formatMinute({ minute: 45, stoppage: 2 })).toBe("45+2'");
		expect(formatMinute({ minute: 90, stoppage: 5 })).toBe("90+5'");
	});
});

describe("getPeriod", () => {
	it("classifies first half (1-45)", () => {
		expect(getPeriod(1)).toBe("first_half");
		expect(getPeriod(45)).toBe("first_half");
	});

	it("classifies second half (46-90)", () => {
		expect(getPeriod(46)).toBe("second_half");
		expect(getPeriod(90)).toBe("second_half");
	});

	it("classifies first et half (91-105)", () => {
		expect(getPeriod(91)).toBe("et_first");
		expect(getPeriod(105)).toBe("et_first");
	});

	it("classifies second et half (106-120)", () => {
		expect(getPeriod(106)).toBe("et_second");
		expect(getPeriod(120)).toBe("et_second");
	});
});

describe("compareMinute", () => {
	it("orders by minute first", () => {
		expect(compareMinute({ minute: 11 }, { minute: 12 })).toBeLessThan(0);
		expect(compareMinute({ minute: 30 }, { minute: 12 })).toBeGreaterThan(0);
	});

	it("breaks ties with stoppage", () => {
		expect(
			compareMinute({ minute: 45, stoppage: 1 }, { minute: 45, stoppage: 2 }),
		).toBeLessThan(0);
	});

	it("treats missing stoppage as 0", () => {
		expect(compareMinute({ minute: 30 }, { minute: 30, stoppage: 0 })).toBe(0);
	});

	it("returns 0 for identical pairs", () => {
		expect(
			compareMinute({ minute: 60, stoppage: 1 }, { minute: 60, stoppage: 1 }),
		).toBe(0);
	});
});

describe("getMinMinuteForNextEvent", () => {
	it("returns null for the penalty shootout", () => {
		expect(getMinMinuteForNextEvent([], "penalty")).toBeNull();
	});

	it("starts regular play at minute 1 with an empty timeline", () => {
		expect(getMinMinuteForNextEvent([], "regular")).toEqual({
			minute: 1,
			stoppage: 0,
		});
	});

	it("starts extra time at minute 91 even when regular ended at 90+5", () => {
		const timeline = [{ period: "regular", minute: 90, stoppage: 5 }];
		expect(getMinMinuteForNextEvent(timeline, "extra_time")).toEqual({
			minute: 91,
			stoppage: 0,
		});
	});

	it("advances stoppage at endpoints when room remains", () => {
		const timeline = [{ period: "regular", minute: 45, stoppage: 2 }];
		expect(getMinMinuteForNextEvent(timeline, "regular")).toEqual({
			minute: 45,
			stoppage: 3,
		});
	});

	it("jumps past the half when the stoppage cap is reached", () => {
		const timeline = [{ period: "regular", minute: 45, stoppage: 5 }];
		expect(getMinMinuteForNextEvent(timeline, "regular")).toEqual({
			minute: 46,
			stoppage: 0,
		});
	});

	it("advances to the next minute outside endpoints", () => {
		const timeline = [{ period: "regular", minute: 30 }];
		expect(getMinMinuteForNextEvent(timeline, "regular")).toEqual({
			minute: 31,
			stoppage: 0,
		});
	});

	it("only considers events from the same period", () => {
		const timeline = [
			{ period: "regular", minute: 80 },
			{ period: "extra_time", minute: 100 },
		];
		expect(getMinMinuteForNextEvent(timeline, "regular")).toEqual({
			minute: 81,
			stoppage: 0,
		});
		expect(getMinMinuteForNextEvent(timeline, "extra_time")).toEqual({
			minute: 101,
			stoppage: 0,
		});
	});

	it("treats entries without an explicit period as regular", () => {
		const timeline = [{ minute: 50 }];
		expect(getMinMinuteForNextEvent(timeline, "regular")).toEqual({
			minute: 51,
			stoppage: 0,
		});
	});
});

describe("validateMinuteAgainstTimeline", () => {
	it("accepts a candidate that strictly advances the timeline", () => {
		const result = validateMinuteAgainstTimeline(
			{ minute: 12 },
			[{ period: "regular", minute: 11 }],
			"regular",
		);
		expect(result.valid).toBe(true);
		expect(result.floor).toEqual({ minute: 12, stoppage: 0 });
	});

	it("rejects a candidate equal to the previous event", () => {
		const result = validateMinuteAgainstTimeline(
			{ minute: 11 },
			[{ period: "regular", minute: 11 }],
			"regular",
		);
		expect(result.valid).toBe(false);
		expect(result.floor).toEqual({ minute: 12, stoppage: 0 });
	});

	it("rejects a stoppage candidate that is below the floor", () => {
		const result = validateMinuteAgainstTimeline(
			{ minute: 45, stoppage: 2 },
			[{ period: "regular", minute: 45, stoppage: 2 }],
			"regular",
		);
		expect(result.valid).toBe(false);
		expect(result.floor).toEqual({ minute: 45, stoppage: 3 });
	});

	it("always validates penalty-shootout candidates", () => {
		const result = validateMinuteAgainstTimeline(
			{ minute: undefined },
			[{ period: "penalty" }],
			"penalty",
		);
		expect(result.valid).toBe(true);
		expect(result.floor).toBeNull();
	});
});
