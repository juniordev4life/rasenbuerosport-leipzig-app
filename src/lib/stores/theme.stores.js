import { writable } from "svelte/store";

/** @type {import('svelte/store').Writable<'light'|'dark'|'system'>} */
export const theme = writable("system");
