<script>
import { getTranslate } from "@tolgee/svelte";
import { getBaseChartOptions, getChartTheme } from "$lib/utils/chart.utils.js";
import ChartCanvas from "./ChartCanvas.svelte";
import ChartCard from "./ChartCard.svelte";

/**
 * Most frequent final scores as horizontal bars; the most common one is
 * drawn in the emphasis colour.
 *
 * @type {{ data?: Array<{score: string, count: number}> }}
 */
let { data = [] } = $props();

const { t } = getTranslate();

const chartConfig = $derived.by(() => {
	if (!data || data.length === 0) return null;
	const theme = getChartTheme();
	const base = getBaseChartOptions(theme);

	const maxVal = Math.max(...data.map((d) => d.count));
	const colors = data.map((d) =>
		d.count === maxVal ? theme.chart4 : theme.chart1,
	);

	return {
		type: "bar",
		data: {
			labels: data.map((d) => d.score),
			datasets: [
				{
					data: data.map((d) => d.count),
					backgroundColor: colors,
					barThickness: 18,
				},
			],
		},
		options: {
			...base,
			indexAxis: "y",
			scales: {
				x: {
					...base.scales.x,
					grid: { color: theme.line },
					ticks: { ...base.scales.x.ticks, stepSize: 1 },
				},
				y: { ...base.scales.y, grid: { display: false } },
			},
			plugins: {
				...base.plugins,
				tooltip: {
					...base.plugins.tooltip,
					callbacks: {
						label: (ctx) =>
							`${ctx.raw} ${$t("stats_dashboard.games_count", { count: ctx.raw })}`,
					},
				},
			},
		},
	};
});

const chartHeight = $derived(data.length > 6 ? "h-64" : "h-52");
</script>

{#if data.length > 0 && chartConfig}
	<ChartCard title={$t("stats_dashboard.common_scores")}>
		<ChartCanvas
			config={chartConfig}
			height={chartHeight}
			label={$t("stats_dashboard.common_scores")}
		/>
	</ChartCard>
{/if}
