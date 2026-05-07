import { describe, expect, it } from "vitest";
import { formatMinute, getPeriod } from "$lib/utils/minute.utils.js";

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
