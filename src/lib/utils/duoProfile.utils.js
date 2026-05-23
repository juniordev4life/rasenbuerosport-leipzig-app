/**
 * Pure helpers for the duo profile page. Maps the existing duo-detail
 * API response (`/v1/duos/:p1/:p2`) into the new design's view
 * model — lifecycle phase, spider values, simple chemistry proxy and
 * the strengths/weaknesses tag lists.
 */

const FRESH_THRESHOLD = 5;
const MATURE_THRESHOLD = 10;

/**
 * @param {number} matchCount
 * @returns {"fresh"|"finding"|"mature"}
 */
export function computeLifecycle(matchCount) {
	if (matchCount < FRESH_THRESHOLD) return "fresh";
	if (matchCount < MATURE_THRESHOLD) return "finding";
	return "mature";
}

/**
 * Map the duo's averaged match stats onto the six radar axes. Unknown
 * values default to 50 so the polygon stays visually coherent even
 * when the backend has not aggregated everything yet.
 *
 * @param {object} duoDetail
 * @returns {number[]} 6 values 0–100
 */
export function deriveSpiderValues(duoDetail) {
	const stats = duoDetail?.avg_match_stats ?? null;
	const winRate = duoDetail?.win_rate ?? 50;

	const possession = clamp01(stats?.avg_possession ?? 50);
	const passing = clamp01(stats?.avg_pass_accuracy ?? 50);
	const efficiency = clamp01(stats?.avg_shot_accuracy ?? 50);

	const offensive =
		stats?.avg_xg_per_game != null
			? clamp01(Math.round((stats.avg_xg_per_game / 4) * 100))
			: clamp01(winRate);

	const defending = clamp01(winRate);
	const pressing = clamp01(Math.round((passing + possession) / 2));

	return [offensive, possession, passing, defending, pressing, efficiency];
}

/**
 * Heuristic chemistry score (0–100). Mixes win-rate, streak status
 * and match-volume bonus. Returns null below the mature threshold so
 * the UI shows the dashed placeholder instead.
 *
 * @param {object} duoDetail
 * @returns {number|null}
 */
export function deriveChemistry(duoDetail) {
	const games = duoDetail?.total_games ?? 0;
	if (games < MATURE_THRESHOLD) return null;
	const wr = duoDetail?.win_rate ?? 50;
	const volumeBoost = Math.min(15, Math.floor(games / 4));
	const streak = duoDetail?.streak;
	const streakBoost = streak?.type === "win" ? Math.min(8, streak.count) : 0;
	const score = Math.round(wr * 0.6 + 30 + volumeBoost * 0.6 + streakBoost);
	return Math.max(0, Math.min(100, score));
}

/**
 * Auto-tag generator mirroring the spec heuristic. Picks strengths
 * (axis ≥ 75), weaknesses (axis ≤ 40) and a handful of combination
 * "character" tags.
 *
 * @param {number[]} values [offensive, possession, passing, defending, pressing, efficiency]
 * @param {"de"|"en"} [locale]
 * @returns {{ strengths: string[], weaknesses: string[], character: string[] }}
 */
export function generateDuoTags(values, locale = "de") {
	const [offensive, possession, passing, defending, pressing, efficiency] =
		values;
	const strengths = [];
	const weaknesses = [];
	const character = [];

	const T = locale === "en" ? LABELS_EN : LABELS_DE;

	if (efficiency > 75) strengths.push(T.efficient_finishing);
	if (defending > 75) strengths.push(T.solid_defence);
	if (passing > 75) strengths.push(T.passing);
	if (offensive > 75) strengths.push(T.dangerous);
	if (pressing > 75) strengths.push(T.pressing);

	if (possession < 40) weaknesses.push(T.low_possession);
	if (passing < 40) weaknesses.push(T.poor_passing);
	if (defending < 40) weaknesses.push(T.weak_defence);
	if (pressing < 40) weaknesses.push(T.passive);

	if (offensive > 60 && defending > 60 && possession < 50) {
		character.push(T.counter);
	}
	if (defending > 70 && possession < 50) {
		character.push(T.defensive);
	}
	if (possession > 65 && passing > 65) {
		character.push(T.possession_play);
	}
	if (efficiency > 80 && offensive > 70) {
		character.push(T.cold_blooded);
	}

	return { strengths, weaknesses, character };
}

/**
 * Derive a Sophie hero verdict from lifecycle + duo stats. Used as a
 * deterministic fallback while the LLM-side generation is not wired
 * up yet.
 *
 * @param {"fresh"|"finding"|"mature"} lifecycle
 * @param {{ win_rate?: number, total_games?: number, tags?: string[] }} ctx
 * @param {{ default: string, freshKey: string, findingKey: string, matureKeyHigh: string, matureKeyMid: string, matureKeyLow: string }} keys
 * @param {(key: string, params?: object) => string} t
 * @returns {string}
 */
export function deriveSophieHeroQuote(lifecycle, ctx, keys, t) {
	if (lifecycle === "fresh") return t(keys.freshKey);
	if (lifecycle === "finding") return t(keys.findingKey);
	const wr = ctx?.win_rate ?? 0;
	if (wr >= 65) return t(keys.matureKeyHigh, { wr });
	if (wr >= 45) return t(keys.matureKeyMid, { wr });
	return t(keys.matureKeyLow, { wr });
}

function clamp01(n) {
	if (!Number.isFinite(n)) return 50;
	return Math.max(0, Math.min(100, Math.round(n)));
}

const LABELS_DE = {
	efficient_finishing: "Effiziente Abschlüsse",
	solid_defence: "Defensiv solide",
	passing: "Pass-Genauigkeit",
	dangerous: "Torgefährlich",
	pressing: "Aggressives Pressing",
	low_possession: "Wenig Ballbesitz",
	poor_passing: "Pass-Schwächen",
	weak_defence: "Defensiv anfällig",
	passive: "Passive Spielweise",
	counter: "Konter-orientiert",
	defensive: "Defensiv geprägt",
	possession_play: "Ballbesitz-Spiel",
	cold_blooded: "Kaltschnäuzig",
};

const LABELS_EN = {
	efficient_finishing: "Efficient finishing",
	solid_defence: "Solid defence",
	passing: "Passing accuracy",
	dangerous: "Dangerous",
	pressing: "Aggressive pressing",
	low_possession: "Low possession",
	poor_passing: "Poor passing",
	weak_defence: "Weak defence",
	passive: "Passive play",
	counter: "Counter-attacking",
	defensive: "Defence-first",
	possession_play: "Possession football",
	cold_blooded: "Cold-blooded",
};
