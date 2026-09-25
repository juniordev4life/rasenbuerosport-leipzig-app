import { defineConfig } from "vitest/config";

/**
 * Vitest config for the Storage security rules tests.
 *
 * They talk to the Storage emulator, so they run in Node instead of jsdom and
 * stay out of `npm run test:unit`. `npm run test:rules` starts the emulator
 * around this config.
 */
export default defineConfig({
	test: {
		environment: "node",
		globals: false,
		include: ["tests/rules/**/*.test.js"],
		testTimeout: 20_000,
		hookTimeout: 20_000,
	},
});
