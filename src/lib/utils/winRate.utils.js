/**
 * Helpers around the relationship/stats `winRate` field that the API
 * ships as a decimal probability in `[0, 1]` (e.g. `0.83` for an 83 %
 * win rate). The decimal contract is documented on the backend's
 * `RelationshipCard.winRate` JSDoc — these helpers are the single
 * Frontend conversion point so the math doesn't get re-invented (and
 * mis-applied) at every call site.
 */

/**
 * Convert a backend-style win ratio (0..1) into an integer percentage
 * suitable for display (0..100). Hands back 0 for anything that isn't
 * a finite, in-range number so a missing or malformed field can't
 * print `NaN%` in the UI.
 *
 * @param {number|null|undefined} ratio
 *   Win ratio as serialised by the API — a decimal in [0, 1].
 * @returns {number}
 *   Integer percent in [0, 100].
 * @example
 *   winRateRatioToPercent(0.83);   // → 83
 *   winRateRatioToPercent(0);      // → 0
 *   winRateRatioToPercent(null);   // → 0
 *   winRateRatioToPercent(1);      // → 100
 */
export function winRateRatioToPercent(ratio) {
	if (typeof ratio !== "number" || !Number.isFinite(ratio)) return 0;
	const clamped = Math.max(0, Math.min(1, ratio));
	return Math.round(clamped * 100);
}

/**
 * Best-effort percentage from a relationship-card-shaped record. Uses
 * the API's `winRate` ratio when available, falls back to recomputing
 * from `wins` / (`totalMatches` ∥ `wins + losses`). Centralised so
 * call sites don't have to reason about both the wire format and the
 * fallback path.
 *
 * @param {{wins?: number, losses?: number, totalMatches?: number, winRate?: number}|null} card
 * @returns {number} Integer percent in [0, 100].
 * @example
 *   // Trusting the API field
 *   relationCardWinRatePercent({ wins: 4, losses: 16, winRate: 0.2 }); // → 20
 *   // Falling back to wins / total
 *   relationCardWinRatePercent({ wins: 6, totalMatches: 8 });          // → 75
 */
export function relationCardWinRatePercent(card) {
	if (!card) return 0;
	if (typeof card.winRate === "number" && Number.isFinite(card.winRate)) {
		return winRateRatioToPercent(card.winRate);
	}
	const wins = card.wins ?? 0;
	const total =
		typeof card.totalMatches === "number" && card.totalMatches > 0
			? card.totalMatches
			: wins + (card.losses ?? 0);
	if (total <= 0) return 0;
	return Math.round((wins / total) * 100);
}
