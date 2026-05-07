import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for end-to-end tests.
 *
 * Tests live under `tests/e2e/`. By default the config starts the SvelteKit
 * dev server (port 5173); set `E2E_BASE_URL` to point at an already-running
 * preview/staging deployment instead.
 *
 * Keep CI-only behavior gated on `process.env.CI` (retries, single worker,
 * `forbidOnly`) so local runs stay fast.
 */
export default defineConfig({
	testDir: "./tests/e2e",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
	use: {
		baseURL: process.env.E2E_BASE_URL || "http://localhost:5173",
		trace: "on-first-retry",
		screenshot: "only-on-failure",
	},
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
	],
	webServer: process.env.E2E_BASE_URL
		? undefined
		: {
				command: "npm run dev",
				port: 5173,
				reuseExistingServer: !process.env.CI,
				timeout: 120 * 1000,
			},
});
