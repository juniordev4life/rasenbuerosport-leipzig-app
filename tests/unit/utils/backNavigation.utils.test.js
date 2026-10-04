import { describe, expect, it } from "vitest";
import { hasBackButton } from "../../../src/lib/utils/backNavigation.utils.js";

describe("hasBackButton", () => {
	it.each([
		["/app/dashboard", "mobile", false],
		["/app/profile", "mobile", false],
		["/app/stats", "mobile", true],
		["/app/stats", "desktop", false],
		["/app/settings", "desktop", false],
		["/app/games/abc", "mobile", true],
		["/app/games/abc", "desktop", true],
		["/app/profile/trophies", "desktop", true],
		["/auth/login", "mobile", false],
		[undefined, "desktop", false],
	])("%s on %s → %s", (pathname, layout, expected) => {
		// Arrange + Act
		const result = hasBackButton(pathname, layout);

		// Assert
		expect(result).toBe(expected);
	});
});
