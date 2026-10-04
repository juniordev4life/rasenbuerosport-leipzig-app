<script>
import { getTranslate } from "@tolgee/svelte";
import { getBaseChartOptions, getChartTheme } from "$lib/utils/chart.utils.js";
import ChartCanvas from "./ChartCanvas.svelte";
import ChartCard from "./ChartCard.svelte";

/**
 * Expected goals against goals actually scored. The xG bar is the faint
 * reference; the goals bar takes the win colour when the player
 * out-scores the xG and the loss colour when they fall short. The
 * difference is spelled out with its sign next to the title.
 *
 * @type {{ data?: {total_xg: number, total_goals: number, games_with_xg: number} }}
 */
let { data = null } = $props();

const { t } = getTranslate();

const diff = $derived(data ? data.total_goals - data.total_xg : 0);
const diffTone = $derived(diff > 0 ? "win" : diff < 0 ? "loss" : "muted");
const diffText = $derived(
	diff > 0
		? `+${diff.toFixed(1)}`
		: diff < 0
			? `−${Math.abs(diff).toFixed(1)}`
			: "±0.0",
);

const chartConfig = $derived.by(() => {
	if (!data || data.games_with_xg === 0) return null;
	const theme = getChartTheme();
	const base = getBaseChartOptions(theme);
	const goalsColor =
		diff > 0 ? theme.win : diff < 0 ? theme.loss : theme.chart1;

	return {
		type: "bar",
		data: {
			labels: [
				$t("stats_dashboard.xg_label"),
				$t("stats_dashboard.goals_label"),
			],
			datasets: [
				{
					data: [data.total_xg, data.total_goals],
					backgroundColor: [theme.chart3, goalsColor],
					borderColor: [theme.chart2, goalsColor],
					borderWidth: [1.5, 0],
					barThickness: 40,
				},
			],
		},
		options: {
			...base,
			scales: {
				...base.scales,
				y: { ...base.scales.y, beginAtZero: true },
			},
			plugins: {
				...base.plugins,
				tooltip: {
					...base.plugins.tooltip,
					callbacks: {
						label: (ctx) => `${ctx.raw}`,
					},
				},
			},
		},
	};
});
</script>

{#if data && data.games_with_xg > 0 && chartConfig}
	<ChartCard title={$t("stats_dashboard.xg_vs_goals")}>
		{#snippet aside()}
			<span class="chip chip-{diffTone} diff">{diffText}</span>
		{/snippet}
		<ChartCanvas
			config={chartConfig}
			height="h-48"
			label="{$t('stats_dashboard.xg_vs_goals')}: {diffText}"
		/>
	</ChartCard>
{/if}

<style>
.diff {
	font-size: 13px;
	font-variant-numeric: tabular-nums;
}
</style>
