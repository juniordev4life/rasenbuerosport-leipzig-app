import { describe, expect, it } from "vitest";
import {
	cancelEntry,
	getEventTimeError,
	initialLiveMatchState,
} from "$lib/utils/liveMatchState.utils.js";

describe("getEventTimeError", () => {
	it.each([
		["an empty field", Number.NaN],
		["minute 0", 0],
		["minute 121", 121],
	])("rejects %s as out of range", (_label, minute) => {
		// Arrange + Act
		const error = getEventTimeError([], minute, null);

		// Assert
		expect(error).toEqual({ reason: "range" });
	});

	it("rejects stoppage time above +10", () => {
		// Arrange + Act
		const error = getEventTimeError([], 90, 11);

		// Assert
		expect(error).toEqual({ reason: "stoppage_range" });
	});

	it("accepts any minute from 1 to 120 on an empty match", () => {
		// Arrange + Act + Assert
		expect(getEventTimeError([], 1, null)).toBeNull();
		expect(getEventTimeError([], 120, 4)).toBeNull();
	});

	it("accepts the last event's minute and rejects an earlier one", () => {
		// Arrange
		const events = [{ minute: 30, stoppage: 0 }];

		// Act
		const sameMinute = getEventTimeError(events, 30, null);
		const earlier = getEventTimeError(events, 29, null);

		// Assert
		expect(sameMinute).toBeNull();
		expect(earlier).toEqual({ reason: "floor", earliest: "30" });
	});

	it("accepts stoppage time right after an event in the same minute", () => {
		// Arrange
		const events = [{ minute: 45, stoppage: 0 }];

		// Act + Assert
		expect(getEventTimeError(events, 45, 2)).toBeNull();
	});

	it("keeps the stoppage order within a stoppage minute", () => {
		// Arrange
		const events = [{ minute: 45, stoppage: 3 }];

		// Act
		const withoutStoppage = getEventTimeError(events, 45, null);
		const lowerStoppage = getEventTimeError(events, 45, 2);

		// Assert
		expect(withoutStoppage).toEqual({ reason: "floor", earliest: "45+3" });
		expect(lowerStoppage).toEqual({ reason: "floor", earliest: "45+3" });
		expect(getEventTimeError(events, 45, 3)).toBeNull();
		expect(getEventTimeError(events, 46, null)).toBeNull();
	});
});

describe("next entry defaults", () => {
	it.each([
		["a regular minute", { minute: 30, stoppage: 0 }, 30, null],
		["stoppage time", { minute: 45, stoppage: 3 }, 45, 3],
	])("start on the last event's time after %s", (_label, last, minute, stoppage) => {
		// Arrange
		const state = { ...initialLiveMatchState(), events: [last] };

		// Act
		const next = cancelEntry(state);

		// Assert
		expect(next.minute).toBe(minute);
		expect(next.stoppageMinutes).toBe(stoppage);
	});
});
