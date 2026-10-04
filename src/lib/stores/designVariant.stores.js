import { writable } from "svelte/store";

/**
 * The app's two looks (see docs/DESIGN.md): "a" — red and white, the
 * default — and "b" — the football pitch. Picked in Settings and stored
 * per device; the OS light/dark setting plays no part.
 */
export const DESIGN_VARIANTS = /** @type {const} */ (["a", "b"]);
export const DEFAULT_DESIGN_VARIANT = "a";

/** localStorage key, also read by the inline script in src/app.html. */
export const DESIGN_VARIANT_STORAGE_KEY = "rbl:design-variant";

/**
 * Narrow any stored value to a known variant.
 *
 * @param {unknown} value
 * @returns {"a"|"b"}
 * @example
 *   normalizeDesignVariant("b"); // "b"
 *   normalizeDesignVariant("dark"); // "a"
 */
export function normalizeDesignVariant(value) {
	return DESIGN_VARIANTS.includes(/** @type {any} */ (value))
		? /** @type {"a"|"b"} */ (value)
		: DEFAULT_DESIGN_VARIANT;
}

/**
 * The variant the inline script in app.html already applied, so the store
 * starts in sync with the page and never flashes the other look.
 *
 * @returns {"a"|"b"}
 */
function initialVariant() {
	if (typeof document === "undefined") return DEFAULT_DESIGN_VARIANT;
	return normalizeDesignVariant(document.documentElement.dataset.variant);
}

/** @type {import('svelte/store').Writable<"a"|"b">} */
export const designVariant = writable(initialVariant());

/**
 * Put a variant on the page: `data-variant` on <html> (the CSS tokens key
 * off it), the browser's theme colour, and the device's stored choice.
 *
 * @param {"a"|"b"} variant
 * @returns {void}
 * @example
 *   designVariant.subscribe(applyDesignVariant);
 */
export function applyDesignVariant(variant) {
	if (typeof document === "undefined") return;
	const root = document.documentElement;
	root.dataset.variant = variant;
	const themeColor = getComputedStyle(root)
		.getPropertyValue("--theme-color")
		.trim();
	const meta = document.querySelector('meta[name="theme-color"]');
	if (meta && themeColor) meta.setAttribute("content", themeColor);
	try {
		localStorage.setItem(DESIGN_VARIANT_STORAGE_KEY, variant);
	} catch {
		// Private mode or blocked storage: the choice lasts for this visit.
	}
}
