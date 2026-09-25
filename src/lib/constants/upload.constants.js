/**
 * Firebase Storage upload limits. `storage.rules` enforces the same values,
 * so change both together; `tests/rules/storage.rules.test.js` uses these
 * constants for its boundary cases.
 */

/** Largest avatar the app and the rules accept (2 MiB). */
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

/** Largest match-stats screenshot the app and the rules accept (10 MiB). */
export const MATCH_STATS_MAX_BYTES = 10 * 1024 * 1024;
