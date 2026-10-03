/**
 * Unit tests for the chart axis labels: month and weekday names come
 * from Intl in the UI language, independent of the device time zone.
 */

import { describe, expect, it } from "vitest";
import {
	monthShortLabel,
	weekdayShortLabels,
} from "$lib/utils/dateLabels.utils.js";

describe("monthShortLabel", () => {
	it.each([
		["de-DE", "2026-03", "Mär"],
		["de-DE", "2026-10", "Okt"],
		["en-US", "2026-03", "Mar"],
		["en-US", "2026-10", "Oct"],
	])("names the %s month of %s as %s", (locale, monthKey, expected) => {
		// Act
		const label = monthShortLabel(monthKey, locale);

		// Assert
		expect(label).toBe(expected);
	});

	it.each([
		"2026",
		"2026-00",
		"2026-13",
		"",
	])("returns %j unchanged when it holds no valid month", (monthKey) => {
		// Act
		const label = monthShortLabel(monthKey, "en-US");

		// Assert
		expect(label).toBe(monthKey);
	});
});

describe("weekdayShortLabels", () => {
	it("lists the German names from Sunday to Saturday", () => {
		// Act
		const labels = weekdayShortLabels("de-DE");

		// Assert
		expect(labels).toEqual(["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"]);
	});

	it("lists the English names from Sunday to Saturday", () => {
		// Act
		const labels = weekdayShortLabels("en-US");

		// Assert
		expect(labels).toEqual(["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]);
	});
});
