<script>
	import { getTranslate } from "@tolgee/svelte";

	/** @type {{ careerStats: object | null }} */
	let { careerStats = null } = $props();

	const { t } = getTranslate();

	/**
	 * Stat display definitions for the 2x2 grid
	 * @type {Array<{key: string, labelKey: string, unit: string, emoji: string, decimals?: number}>}
	 */
	const STATS = [
		{ key: "avg_possession", labelKey: "profile.career_stats.possession", unit: "%", emoji: "🎯" },
		{ key: "avg_pass_accuracy", labelKey: "profile.career_stats.pass_accuracy", unit: "%", emoji: "🎯" },
		{ key: "xg_efficiency", labelKey: "profile.career_stats.xg_efficiency", unit: "x", emoji: "🔫" },
		{ key: "avg_duels_won_rate", labelKey: "profile.career_stats.duels_won", unit: "%", emoji: "💪" },
	];

	/**
	 * Format stat value for display
	 * @param {number | null} value
	 * @param {object} stat
	 * @returns {string}
	 */
	function formatValue(value, stat) {
		if (value == null) return "-";
		if (stat.key === "xg_efficiency") {
			return value.toFixed(2).replace(".", ",");
		}
		return String(Math.round(value));
	}
</script>

{#if careerStats && careerStats.games_with_stats > 0}
	<div class="bg-bg-secondary border border-border rounded-lg p-4">
		<div class="flex items-center justify-between mb-3">
			<h3 class="text-sm font-medium text-text-primary">
				{$t("profile.career_stats.title")}
			</h3>
			<span class="text-[10px] text-text-secondary">
				{$t("profile.career_stats.based_on", { count: careerStats.games_with_stats })}
			</span>
		</div>

		<div class="grid grid-cols-2 gap-2.5">
			{#each STATS as stat (stat.key)}
				<div class="bg-bg-primary/50 rounded-lg p-3 text-center">
					<p class="text-xl font-bold text-text-primary">
						{formatValue(careerStats[stat.key], stat)}{#if careerStats[stat.key] != null}<span class="text-sm font-normal text-text-secondary">{stat.unit}</span>{/if}
					</p>
					<p class="text-[10px] text-text-secondary mt-0.5">
						{$t(stat.labelKey)}
					</p>
				</div>
			{/each}
		</div>
	</div>
{/if}
