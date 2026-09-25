import { existsSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

// Path-based on purpose: in jsdom tests Vite rewrites
// `new URL("<path>", import.meta.url)` to resolve against `self.location`
// (http://localhost:3000), not against this file.
const STATIC_DIR = join(import.meta.dirname, "../../static");

/**
 * The worker hardcodes its notification artwork. A path missing from
 * `static/` does not 404 in production — Firebase rewrites it to
 * index.html — so the notification silently renders without an icon.
 */
describe("service worker push handler", () => {
	let options;

	beforeAll(async () => {
		const listeners = {};
		const showNotification = vi.fn();
		vi.stubGlobal("self", {
			addEventListener: (type, listener) => {
				listeners[type] = listener;
			},
			registration: { showNotification },
		});
		await import("../../src/service-worker.js");

		listeners.push({
			data: { json: () => ({ title: "Goal!" }) },
			waitUntil: vi.fn(),
		});
		options = showNotification.mock.calls[0][1];
	});

	afterAll(() => {
		vi.unstubAllGlobals();
	});

	it.each(["icon", "badge"])("points %s at a file in static/", (key) => {
		expect(existsSync(join(STATIC_DIR, options[key]))).toBe(true);
	});
});
