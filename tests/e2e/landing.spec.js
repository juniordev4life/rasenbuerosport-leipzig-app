import { expect, test } from "@playwright/test";

/**
 * Smoke test — verifies that the SvelteKit dev server boots and the landing
 * page renders. Anchors the E2E pipeline so subsequent suites (auth, new game,
 * special events, challenges) have a known-good baseline to extend.
 */
test.describe("smoke", () => {
	test("landing page loads", async ({ page }) => {
		// Arrange & Act
		const response = await page.goto("/");

		// Assert
		expect(response?.status()).toBeLessThan(400);
		await expect(page.locator("body")).toBeVisible();
	});
});
