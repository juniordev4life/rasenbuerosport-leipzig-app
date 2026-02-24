import { writable } from "svelte/store";

/** @type {import('svelte/store').Writable<object|null>} */
export const user = writable(null);

/** @type {import('svelte/store').Writable<object|null>} */
export const session = writable(null);

/** @type {import('svelte/store').Writable<boolean>} */
export const isLoading = writable(true);
