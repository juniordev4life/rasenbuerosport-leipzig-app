<script>
import { getTranslate } from "@tolgee/svelte";
import { getBaseChartOptions, getChartTheme } from "$lib/utils/chart.utils.js";
import { monthShortLabel } from "$lib/utils/dateLabels.utils.js";
import ChartCanvas from "./ChartCanvas.svelte";
import ChartCard from "./ChartCard.svelte";

/**
 * Games per calendar month as vertical bars in the main series colour,
 * with month names in the given locale.
 *
 * @type {{ data?: Array<{month: string, count: number}>, locale?: string }}
 */
let { data = [], locale = "de-DE" } = $props();

const { t } = getTranslate();

const chartConfig = $derived.by(() => {
	if (!data || data.length === 0) return null;
	const theme = getChartTheme();
	const base = getBaseChartOptions(theme);

	const labels = data.map((d) => monthShortLabel(d.month, locale));

	return {
		type: "bar",
		data: {
			labels,
			datasets: [
				{
					data: data.map((d) => d.count),
					backgroundColor: theme.chart1,
					maxBarThickness: 32,
				},
			],
		},
		options: {
			...base,
			scales: {
				...base.scales,
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
						title: (ctx) => data[ctx[0].dataIndex]?.month || "",
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
	<ChartCard title={$t("stats_dashboard.games_per_month")}>
		<ChartCanvas
			config={chartConfig}
			height="h-48 lg:h-56"
			label={$t("stats_dashboard.games_per_month")}
		/>
	</ChartCard>
{/if}
