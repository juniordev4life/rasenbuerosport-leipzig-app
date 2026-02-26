<script>
	import { getTranslate } from "@tolgee/svelte";

	/**
	 * MatchStatsDisplay - Renders extracted FC26 match statistics
	 * Two-column layout: home value | stat name | away value
	 */
	let { matchStats } = $props();

	const { t } = getTranslate();

	/**
	 * Stat definitions for display order and formatting
	 * @type {Array<{key: string, labelKey: string, unit?: string, decimals?: number}>}
	 */
	const STAT_DEFINITIONS = [
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

	/** Filter to only stats that exist in the data */
	const visibleStats = $derived(
		STAT_DEFINITIONS.filter(
			(s) => matchStats?.[s.key] != null && matchStats[s.key].home != null,
		),
	);

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

<div class="bg-bg-secondary border border-border rounded-lg p-4">
	<h3 class="text-sm font-medium text-text-primary mb-4">{$t("match_stats.title")}</h3>

	<div class="flex flex-col gap-2.5">
		{#each visibleStats as stat (stat.key)}
			{@const home = matchStats[stat.key].home}
			{@const away = matchStats[stat.key].away}
			{@const isPercentage = stat.unit === "%"}

			<!-- Stat Row -->
			<div class="flex flex-col gap-1">
				<!-- Values + Label -->
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

				<!-- Comparison Bar -->
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
</div>
