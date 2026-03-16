import { writable } from "svelte/store";

/**
 * Global season selection store.
 * "all" means all-time, otherwise a season key like "2026-Q1".
 * Persists across page navigation within a session.
 * @type {import('svelte/store').Writable<string>}
 */
export const selectedSeason = writable("all");
