<script>
import { getTranslate } from "@tolgee/svelte";
import { designVariant } from "$lib/stores/designVariant.stores.js";
import { getBaseChartOptions, getChartTheme } from "$lib/utils/chart.utils.js";
import ChartCanvas from "./ChartCanvas.svelte";
import ChartCard from "./ChartCard.svelte";

/**
 * The signed-in player's career match stats on five axes (0–100). Drawn
 * like the profile's character radar: a red outline, condensed caps
 * labels in design A; a lightly filled shape with white points and
 * sentence-case labels in B.
 *
 * @type {{ stats?: object }}
 */
let { stats = null } = $props();

const { t } = getTranslate();

const chartConfig = $derived.by(() => {
	if (!stats) return null;
	const theme = getChartTheme();
	const base = getBaseChartOptions(theme);
	const isB = $designVariant === "b";

	const labels = [
		$t("stats_dashboard.radar_possession"),
		$t("stats_dashboard.radar_pass_accuracy"),
		$t("stats_dashboard.radar_shot_accuracy"),
		$t("stats_dashboard.radar_duels"),
		$t("stats_dashboard.radar_xg_efficiency"),
	].map((label) => (isB ? label : label.toUpperCase()));

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
					backgroundColor: isB ? `${theme.chart4}29` : "transparent",
					borderColor: theme.chart4,
					borderWidth: 2.5,
					pointBackgroundColor: isB ? theme.surface : theme.chart4,
					pointBorderColor: theme.chart4,
					pointBorderWidth: isB ? 2.5 : 0,
					pointRadius: 4,
				},
			],
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			plugins: {
				legend: { display: false },
				tooltip: base.plugins.tooltip,
			},
			scales: {
				r: {
					beginAtZero: true,
					max: 100,
					ticks: {
						stepSize: 25,
						color: theme.muted,
						font: { family: theme.fontCond, size: 10, weight: 700 },
						backdropColor: theme.surface,
					},
					grid: { color: theme.line },
					angleLines: { color: theme.line },
					pointLabels: {
						color: theme.ink,
						font: isB
							? { family: theme.fontSans, size: 12, weight: 700 }
							: { family: theme.fontCond, size: 12, weight: 700 },
					},
				},
			},
		},
	};
});
</script>

{#if stats && chartConfig}
	<ChartCard title={$t("stats_dashboard.player_radar")}>
		<ChartCanvas
			config={chartConfig}
			height="h-64"
			label={$t("stats_dashboard.player_radar")}
		/>
	</ChartCard>
{/if}
