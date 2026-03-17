<script>
import { getTranslate } from "@tolgee/svelte";
import { getBaseChartOptions, getChartTheme } from "$lib/utils/chart.utils.js";
import ChartCanvas from "./ChartCanvas.svelte";

/** @type {{ stats?: object }} */
let { stats = null } = $props();

const { t } = getTranslate();

const chartConfig = $derived.by(() => {
	if (!stats) return null;
	const theme = getChartTheme();

	const labels = [
		$t("stats_dashboard.radar_possession"),
		$t("stats_dashboard.radar_pass_accuracy"),
		$t("stats_dashboard.radar_shot_accuracy"),
		$t("stats_dashboard.radar_duels"),
		$t("stats_dashboard.radar_xg_efficiency"),
	];

	// Normalize xG efficiency to 0-100 scale (1.0 = 50, 2.0 = 100)
	const xgEff =
		stats.xg_efficiency != null
			? Math.min(Math.round(stats.xg_efficiency * 50), 100)
			: 0;

	const values = [
		stats.avg_possession || 0,
		stats.avg_pass_accuracy || 0,
		stats.avg_shot_accuracy || 0,
		stats.avg_duels_won_rate || 0,
		xgEff,
	];

	return {
		type: "radar",
		data: {
			labels,
			datasets: [
				{
					data: values,
					backgroundColor: `${theme.accentRed}30`,
					borderColor: theme.accentRed,
					borderWidth: 2,
					pointBackgroundColor: theme.accentRed,
					pointRadius: 4,
				},
			],
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			plugins: {
				legend: { display: false },
				tooltip: {
					backgroundColor: "rgba(0,0,0,0.85)",
					titleColor: "#fff",
					bodyColor: "#fff",
					padding: 10,
					cornerRadius: 8,
				},
			},
			scales: {
				r: {
					beginAtZero: true,
					max: 100,
					ticks: {
						stepSize: 25,
						color: theme.textSecondary,
						font: { size: 9 },
						backdropColor: "transparent",
					},
					grid: { color: `${theme.border}40` },
					angleLines: { color: `${theme.border}40` },
					pointLabels: {
						color: theme.textSecondary,
						font: { size: 10 },
					},
				},
			},
		},
	};
});
</script>

{#if stats && chartConfig}
	<div class="bg-bg-secondary border border-border rounded-lg p-4">
		<h3 class="text-sm font-medium text-text-secondary mb-3">{$t("stats_dashboard.player_radar")}</h3>
		<ChartCanvas config={chartConfig} height="h-56" />
	</div>
{/if}
