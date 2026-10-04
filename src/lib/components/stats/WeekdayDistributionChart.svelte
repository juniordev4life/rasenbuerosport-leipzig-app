<script>
import { getTranslate } from "@tolgee/svelte";
import { getBaseChartOptions, getChartTheme } from "$lib/utils/chart.utils.js";
import { weekdayShortLabels } from "$lib/utils/dateLabels.utils.js";
import ChartCanvas from "./ChartCanvas.svelte";
import ChartCard from "./ChartCard.svelte";

/**
 * Games per weekday (Sunday first, as the API counts them); the busiest
 * day is drawn in the emphasis colour. Weekday names follow `locale`.
 *
 * @type {{ data?: Array<{weekday: number, count: number}>, locale?: string }}
 */
let { data = [], locale = "de-DE" } = $props();

const { t } = getTranslate();

const chartConfig = $derived.by(() => {
	if (!data || data.length === 0) return null;
	const theme = getChartTheme();
	const base = getBaseChartOptions(theme);

	// Fill missing weekdays with 0
	const weekdayMap = new Map(data.map((d) => [d.weekday, d.count]));
	const labels = weekdayShortLabels(locale);
	const values = labels.map((_, i) => weekdayMap.get(i) || 0);

	const maxVal = Math.max(...values);
	const colors = values.map((v) =>
		v === maxVal && maxVal > 0 ? theme.chart4 : theme.chart1,
	);

	return {
		type: "bar",
		data: {
			labels,
			datasets: [
				{
					data: values,
					backgroundColor: colors,
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
	<ChartCard title={$t("stats_dashboard.weekday_distribution")}>
		<ChartCanvas
			config={chartConfig}
			height="h-48 lg:h-56"
			label={$t("stats_dashboard.weekday_distribution")}
		/>
	</ChartCard>
{/if}
