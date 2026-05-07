import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

/**
 * Vitest global setup — runs once before every test file.
 *
 * Stubs browser APIs that jsdom does not implement and that some components
 * touch (haptics, ResizeObserver, matchMedia). Keep this file tight: prefer
 * per-test mocking via `vi.mock(...)` for everything domain-specific
 * (`apiRequest`, Firebase, Tolgee).
 */

// Haptic feedback used by MinutePicker and friends.
if (!("vibrate" in navigator)) {
	Object.defineProperty(navigator, "vibrate", {
		value: vi.fn(),
		writable: true,
		configurable: true,
	});
}

// matchMedia is used by theme + responsive helpers.
if (!window.matchMedia) {
	Object.defineProperty(window, "matchMedia", {
		writable: true,
		value: vi.fn().mockImplementation((query) => ({
			matches: false,
			media: query,
			onchange: null,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			dispatchEvent: vi.fn(),
		})),
	});
}

// ResizeObserver is used by chart components.
if (!window.ResizeObserver) {
	window.ResizeObserver = class {
		observe() {}
		unobserve() {}
		disconnect() {}
	};
}
