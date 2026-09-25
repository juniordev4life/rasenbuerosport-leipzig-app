import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { svelteTesting } from "@testing-library/svelte/vite";
import { defineConfig } from "vitest/config";

/**
 * Vite + Vitest configuration for the Striker app.
 *
 * Coverage thresholds: 60% for lines, functions, statements and branches,
 * applied globally to all covered `src/` files (no per-directory overrides).
 * `app.html`, `app.css`, route `+layout.js`/`+page.js` files and tests are
 * excluded from coverage.
 *
 * The `svelteTesting()` plugin flips Vite into browser-resolution mode for
 * test runs so `@testing-library/svelte`'s `mount(...)` resolves the
 * client-side build of Svelte 5 instead of the server build (which would
 * throw `lifecycle_function_unavailable`).
 */
export default defineConfig({
	plugins: [tailwindcss(), sveltekit(), svelteTesting()],
	test: {
		environment: "jsdom",
		globals: false,
		setupFiles: ["./tests/setup.js"],
		include: ["tests/unit/**/*.test.js", "src/**/*.test.js"],
		exclude: ["tests/e2e/**", "node_modules/**", "build/**", ".svelte-kit/**"],
		coverage: {
			provider: "v8",
			reporter: ["text", "html", "lcov"],
			include: ["src/**/*.js", "src/**/*.svelte"],
			exclude: [
				"src/app.html",
				"src/app.css",
				"src/app.d.ts",
				"src/**/+layout.js",
				"src/**/+page.js",
				"**/*.test.js",
			],
			thresholds: {
				lines: 60,
				functions: 60,
				statements: 60,
				branches: 60,
			},
		},
	},
});
