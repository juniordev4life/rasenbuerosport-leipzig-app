import { describe, expect, it } from "vitest";
import { isoWeek } from "$lib/utils/isoWeek.utils.js";

describe("isoWeek", () => {
	it("returns the ISO calendar week", () => {
		expect(isoWeek(new Date(2026, 8, 28))).toBe(40);
		expect(isoWeek(new Date(2026, 9, 3))).toBe(40);
	});

	it("puts early January into the previous year's last week when it starts late", () => {
		// 1 Jan 2027 is a Friday → still week 53 of 2026
		expect(isoWeek(new Date(2027, 0, 1))).toBe(53);
		expect(isoWeek(new Date(2027, 0, 4))).toBe(1);
	});
});
