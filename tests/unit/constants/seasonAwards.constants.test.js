/**
 * Unit tests for formatAwardValue: per-game ratios take the locale's
 * decimal separator, whole-number awards stay plain like ELO elsewhere.
 */

import { describe, expect, it } from "vitest";
import { formatAwardValue } from "$lib/constants/seasonAwards.constants.js";

describe("formatAwardValue", () => {
	it.each([
		["de-DE", "0,12"],
		["en-US", "0.12"],
	])("writes a per-game ratio with the %s decimal separator", (locale, expected) => {
		// Act
		const text = formatAwardValue(0.12, "cards_per_game", locale);

		// Assert
		expect(text).toBe(expected);
	});

	it("always shows two decimals for a per-game ratio", () => {
		// Act
		const text = formatAwardValue(2.5, "goals_per_game", "de-DE");

		// Assert
		expect(text).toBe("2,50");
	});

	it("falls back to German without a locale", () => {
		// Act
		const text = formatAwardValue(0.12, "cards_per_game");

		// Assert
		expect(text).toBe("0,12");
	});

	it.each([
		"de-DE",
		"en-US",
	])("rounds whole-number units without a thousands separator in %s", (locale) => {
		// Act
		const text = formatAwardValue(1624.4, "elo", locale);

		// Assert
		expect(text).toBe("1624");
	});

	it.each([null, undefined, Number.NaN])("shows a dash for %s", (value) => {
		// Act
		const text = formatAwardValue(value, "elo", "de-DE");

		// Assert
		expect(text).toBe("—");
	});
});
