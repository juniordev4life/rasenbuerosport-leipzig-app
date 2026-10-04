<script>
import { getTranslate } from "@tolgee/svelte";
import { getBaseChartOptions, getChartTheme } from "$lib/utils/chart.utils.js";
import ChartCanvas from "./ChartCanvas.svelte";
import ChartCard from "./ChartCard.svelte";

/**
 * How many games ended with a given number of total goals; the most
 * frequent total is drawn in the emphasis colour.
 *
 * @type {{ data?: Array<{total_goals: number, count: number}> }}
 */
let { data = [] } = $props();

const { t } = getTranslate();

const chartConfig = $derived.by(() => {
	if (!data || data.length === 0) return null;
	const theme = getChartTheme();
	const base = getBaseChartOptions(theme);

	const maxVal = Math.max(...data.map((d) => d.count));
	const colors = data.map((d) =>
		d.count === maxVal && maxVal > 0 ? theme.chart4 : theme.chart1,
	);

	return {
		type: "bar",
		data: {
			labels: data.map((d) => `${d.total_goals}`),
			datasets: [
				{
					data: data.map((d) => d.count),
					backgroundColor: colors,
					maxBarThickness: 32,
				},
			],
		},
		options: {
			...base,
			scales: {
				...base.scales,
				x: {
					...base.scales.x,
					title: {
						display: true,
						text: $t("stats_dashboard.total_goals_axis"),
						color: theme.muted,
						font: { family: theme.fontCond, size: 12, weight: 700 },
					},
				},
				y: {
					...base.scales.y,
					beginAtZero: true,
					ticks: { ...base.scales.y.ticks, stepSize: 1 },
				},
			},
			plugins: {
				...base.plugins,
				tooltip: {
					...base.plugins.tooltip,
					callbacks: {
						title: (ctx) =>
							`${ctx[0].label} ${$t("stats_dashboard.goals_label")}`,
						label: (ctx) =>
							`${ctx.raw} ${$t("stats_dashboard.games_count", { count: ctx.raw })}`,
					},
				},
			},
		},
	};
});
</script>

{#if data.length > 0 && chartConfig}
	<ChartCard title={$t("stats_dashboard.goals_distribution")}>
		<ChartCanvas
			config={chartConfig}
			height="h-48"
			label={$t("stats_dashboard.goals_distribution")}
		/>
	</ChartCard>
{/if}
