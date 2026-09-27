import { writable } from "svelte/store";

/**
 * Selected league season for the Rangliste (Skill-Rating + Liga
 * views). Holds a season id (e.g. "fc27") or the alias "current".
 *
 * Distinct from `season.stores.js`, which tracks the calendar-quarter
 * season used by the personal/community stats pages — a league season
 * is an EA FC edition, not a calendar quarter, and ELO runs
 * continuously across them (no reset).
 *
 * @type {import('svelte/store').Writable<string>}
 */
export const selectedLeagueSeason = writable("current");
