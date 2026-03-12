<script>
import { getTranslate } from "@tolgee/svelte";

/**
 * MatchStatsDisplay - Renders extracted FC26 match statistics
 * Grouped into sections: Overview, Passes, Defense
 */
let { matchStats } = $props();

const { t } = getTranslate();

/** @type {Array<{key: string, labelKey: string, unit?: string, decimals?: number}>} */
const OVERVIEW_STATS = [
	{ key: "possession", labelKey: "match_stats.possession", unit: "%" },
	{ key: "shots", labelKey: "match_stats.shots" },
	{ key: "xg", labelKey: "match_stats.xg", decimals: 1 },
	{ key: "passes", labelKey: "match_stats.passes" },
	{ key: "pass_accuracy", labelKey: "match_stats.pass_accuracy", unit: "%" },
	{ key: "duels", labelKey: "match_stats.duels" },
	{ key: "duels_won", labelKey: "match_stats.duels_won" },
	{ key: "interceptions", labelKey: "match_stats.interceptions" },
	{ key: "saves", labelKey: "match_stats.saves" },
	{ key: "fouls", labelKey: "match_stats.fouls" },
	{ key: "corners", labelKey: "match_stats.corners" },
	{ key: "yellow_cards", labelKey: "match_stats.yellow_cards" },
	{ key: "dribbling", labelKey: "match_stats.dribbling", unit: "%" },
	{ key: "shot_accuracy", labelKey: "match_stats.shot_accuracy", unit: "%" },
];

/** @type {Array<{key: string, labelKey: string, unit?: string, decimals?: number}>} */
const PASSES_STATS = [
	{ key: "completed_passes", labelKey: "match_stats.completed_passes" },
	{ key: "intercepted_passes", labelKey: "match_stats.intercepted_passes" },
	{ key: "offside_passes", labelKey: "match_stats.offside_passes" },
	{ key: "ground_passes", labelKey: "match_stats.ground_passes" },
	{ key: "lob_passes", labelKey: "match_stats.lob_passes" },
	{ key: "through_balls", labelKey: "match_stats.through_balls" },
	{ key: "lobbed_through_balls", labelKey: "match_stats.lobbed_through_balls" },
	{ key: "crosses", labelKey: "match_stats.crosses" },
	{ key: "set_pieces", labelKey: "match_stats.set_pieces" },
	{ key: "key_passes", labelKey: "match_stats.key_passes" },
	{ key: "first_time_passes", labelKey: "match_stats.first_time_passes" },
	{ key: "double_passes", labelKey: "match_stats.double_passes" },
	{ key: "wing_passes", labelKey: "match_stats.wing_passes" },
	{ key: "solo_runs", labelKey: "match_stats.solo_runs" },
];

/** @type {Array<{key: string, labelKey: string, unit?: string, decimals?: number}>} */
const DEFENSE_STATS = [
	{ key: "tackle_success", labelKey: "match_stats.tackle_success", unit: "%" },
	{ key: "fair_tackles", labelKey: "match_stats.fair_tackles" },
	{ key: "won_tackles", labelKey: "match_stats.won_tackles" },
	{ key: "slide_tackles", labelKey: "match_stats.slide_tackles" },
	{ key: "blocks", labelKey: "match_stats.blocks" },
	{ key: "clearances", labelKey: "match_stats.clearances" },
	{ key: "attacking_duels_won", labelKey: "match_stats.attacking_duels_won" },
	{ key: "defensive_duels_won", labelKey: "match_stats.defensive_duels_won" },
	{ key: "aerial_duels_won", labelKey: "match_stats.aerial_duels_won" },
	{ key: "dribbled_past", labelKey: "match_stats.dribbled_past" },
	{ key: "penalties_conceded", labelKey: "match_stats.penalties_conceded" },
	{ key: "red_cards", labelKey: "match_stats.red_cards" },
];

/** Filter stats that exist in the data */
function filterVisible(defs) {
	return defs.filter(
		(s) => matchStats?.[s.key] != null && matchStats[s.key].home != null,
	);
}

const visibleOverview = $derived(filterVisible(OVERVIEW_STATS));
const visiblePasses = $derived(filterVisible(PASSES_STATS));
const visibleDefense = $derived(filterVisible(DEFENSE_STATS));

/**
 * Format a stat value for display
 * @param {number} value
 * @param {object} stat
 * @returns {string}
 */
function formatValue(value, stat) {
	if (value == null) return "-";
	if (stat.decimals != null) {
		return value.toFixed(stat.decimals).replace(".", ",");
	}
	return String(value);
}

/**
 * Calculate bar width percentage for comparison bars
 * @param {number} home
 * @param {number} away
 * @param {string} side - "home" or "away"
 * @returns {number}
 */
function getBarWidth(home, away, side) {
	const total = home + away;
	if (total === 0) return 50;
	return side === "home" ? (home / total) * 100 : (away / total) * 100;
}
</script>

{#snippet statSection(stats, sectionTitle)}
	{#if stats.length > 0}
		{#if sectionTitle}
			<h4 class="text-xs font-bold text-text-secondary uppercase tracking-wider mt-4 mb-2 pt-3 border-t border-border">
				{sectionTitle}
			</h4>
		{/if}
		<div class="flex flex-col gap-2.5">
			{#each stats as stat (stat.key)}
				{@const home = matchStats[stat.key].home}
				{@const away = matchStats[stat.key].away}

				<div class="flex flex-col gap-1">
					<div class="flex items-center">
						<span class="w-12 text-right text-xs font-semibold text-accent-red">
							{formatValue(home, stat)}{stat.unit || ""}
						</span>
						<span class="flex-1 text-center text-[10px] text-text-secondary px-2 truncate">
							{$t(stat.labelKey)}
						</span>
						<span class="w-12 text-left text-xs font-semibold text-blue-400">
							{formatValue(away, stat)}{stat.unit || ""}
						</span>
					</div>

					{#if home != null && away != null}
						<div class="flex h-1 rounded-full overflow-hidden gap-0.5">
							<div
								class="rounded-full transition-all {home >= away ? 'bg-accent-red' : 'bg-accent-red/40'}"
								style="width: {getBarWidth(home, away, 'home')}%"
							></div>
							<div
								class="rounded-full transition-all {away >= home ? 'bg-blue-400' : 'bg-blue-400/40'}"
								style="width: {getBarWidth(home, away, 'away')}%"
							></div>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
{/snippet}

<div class="bg-bg-secondary border border-border rounded-lg p-4">
	<h3 class="text-sm font-medium text-text-primary mb-4">{$t("match_stats.title")}</h3>

	<!-- Overview Section (always first, no sub-header if only section) -->
	{@render statSection(visibleOverview, visiblePasses.length > 0 || visibleDefense.length > 0 ? $t("match_stats.section_overview") : null)}

	<!-- Passes Section -->
	{@render statSection(visiblePasses, $t("match_stats.section_passes"))}

	<!-- Defense Section -->
	{@render statSection(visibleDefense, $t("match_stats.section_defense"))}
</div>
