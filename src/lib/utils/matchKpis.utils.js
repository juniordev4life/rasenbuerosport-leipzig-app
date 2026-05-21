/**
 * Helpers around `game.match_stats`: pull the headline KPIs out for the
 * "Wichtigste Zahlen" panel and rank the remaining stats by divergence
 * so the detail-stats panel can show a useful Top-5 instead of dumping
 * every single key.
 */

/** @typedef {{ home: number|null, away: number|null }} StatPair */

/** @typedef {{ key: string, labelKey: string, unit: string, decimals: number }} StatDef */

/** Keys highlighted as headline KPIs at the top of the report. */
/** @type {StatDef[]} */
export const HEADLINE_KPI_DEFS = [
	{
		key: "possession",
		labelKey: "match_stats.possession",
		unit: "%",
		decimals: 0,
	},
	{ key: "xg", labelKey: "match_stats.xg", unit: "", decimals: 1 },
	{ key: "shots", labelKey: "match_stats.shots", unit: "", decimals: 0 },
	{
		key: "shot_accuracy",
		labelKey: "match_stats.shot_accuracy",
		unit: "%",
		decimals: 0,
	},
];

/** Detail stats considered for the Top-5 ranking. */
/** @type {StatDef[]} */
export const DETAIL_STAT_DEFS = [
	{
		key: "pass_accuracy",
		labelKey: "match_stats.pass_accuracy",
		unit: "%",
		decimals: 0,
	},
	{ key: "passes", labelKey: "match_stats.passes", unit: "", decimals: 0 },
	{ key: "duels", labelKey: "match_stats.duels", unit: "", decimals: 0 },
	{
		key: "duels_won",
		labelKey: "match_stats.duels_won",
		unit: "",
		decimals: 0,
	},
	{
		key: "tackle_success",
		labelKey: "match_stats.tackle_success",
		unit: "%",
		decimals: 0,
	},
	{
		key: "interceptions",
		labelKey: "match_stats.interceptions",
		unit: "",
		decimals: 0,
	},
	{
		key: "dribbling",
		labelKey: "match_stats.dribbling",
		unit: "%",
		decimals: 0,
	},
	{
		key: "dribbled_past",
		labelKey: "match_stats.dribbled_past",
		unit: "",
		decimals: 0,
	},
	{ key: "saves", labelKey: "match_stats.saves", unit: "", decimals: 0 },
	{ key: "fouls", labelKey: "match_stats.fouls", unit: "", decimals: 0 },
	{ key: "corners", labelKey: "match_stats.corners", unit: "", decimals: 0 },
	{
		key: "yellow_cards",
		labelKey: "match_stats.yellow_cards",
		unit: "",
		decimals: 0,
	},
	{
		key: "key_passes",
		labelKey: "match_stats.key_passes",
		unit: "",
		decimals: 0,
	},
	{ key: "crosses", labelKey: "match_stats.crosses", unit: "", decimals: 0 },
	{ key: "blocks", labelKey: "match_stats.blocks", unit: "", decimals: 0 },
	{
		key: "clearances",
		labelKey: "match_stats.clearances",
		unit: "",
		decimals: 0,
	},
];

/**
 * Read a {home, away} pair from match_stats; returns null when either
 * side is missing.
 *
 * @param {object|null|undefined} matchStats
 * @param {string} key
 * @returns {StatPair|null}
 */
export function getStatPair(matchStats, key) {
	const node = matchStats?.[key];
	if (!node) return null;
	if (node.home == null || node.away == null) return null;
	return { home: node.home, away: node.away };
}

/**
 * Resolve the headline-KPI definitions to their values, dropping
 * any KPI that has no data for this match.
 *
 * @param {object|null|undefined} matchStats
 * @returns {Array<StatDef & { home: number, away: number }>}
 * @example
 *   const kpis = getHeadlineKpis(game.match_stats);
 *   // → [{ key: "possession", home: 54, away: 46, ... }, ...]
 */
export function getHeadlineKpis(matchStats) {
	return HEADLINE_KPI_DEFS.map((def) => {
		const pair = getStatPair(matchStats, def.key);
		return pair ? { ...def, home: pair.home, away: pair.away } : null;
	}).filter((x) => x !== null);
}

/**
 * Rank the detail-stat candidates by their home/away divergence and
 * return the Top-N (default 5). Equal stats are sorted last so the
 * panel surfaces "interesting" differences first.
 *
 * @param {object|null|undefined} matchStats
 * @param {number} [limit=5]
 * @returns {Array<StatDef & { home: number, away: number }>}
 * @example
 *   const top5 = getTopDetailStats(game.match_stats);
 */
export function getTopDetailStats(matchStats, limit = 5) {
	const resolved = DETAIL_STAT_DEFS.map((def) => {
		const pair = getStatPair(matchStats, def.key);
		return pair ? { ...def, home: pair.home, away: pair.away } : null;
	}).filter((x) => x !== null);

	resolved.sort((a, b) => divergence(b) - divergence(a));
	return resolved.slice(0, limit);
}

/**
 * Normalised divergence between home and away. Percentages are kept
 * absolute; raw counts use relative gap so e.g. 47 vs 11 outranks
 * 75% vs 63%.
 *
 * @param {StatDef & { home: number, away: number }} stat
 * @returns {number}
 */
function divergence(stat) {
	const diff = Math.abs(stat.home - stat.away);
	if (stat.unit === "%") return diff;
	const total = stat.home + stat.away;
	if (total === 0) return 0;
	return (diff / total) * 100;
}

/**
 * Format a number for display, swapping decimal separator to a comma
 * to match the German UI ("2,7" instead of "2.7").
 *
 * @param {number|null|undefined} value
 * @param {number} decimals
 * @returns {string}
 */
export function formatStatValue(value, decimals) {
	if (value == null) return "–";
	if (decimals > 0) return value.toFixed(decimals).replace(".", ",");
	return String(Math.round(value));
}

/**
 * Decide who "won" a stat row given home/away values. Returns
 * `"home"`, `"away"`, or `null` for ties.
 *
 * @param {number} home
 * @param {number} away
 * @returns {"home"|"away"|null}
 */
export function statWinner(home, away) {
	if (home === away) return null;
	return home > away ? "home" : "away";
}

/**
 * Split a total into two bar-widths in percent. Defaults to 50/50
 * when both sides are zero so the bar still renders nicely.
 *
 * @param {number} home
 * @param {number} away
 * @returns {{ home: number, away: number }}
 */
export function statBarShares(home, away) {
	const total = home + away;
	if (total === 0) return { home: 50, away: 50 };
	const h = Math.round((home / total) * 100);
	return { home: h, away: 100 - h };
}
