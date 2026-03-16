<script>
import { getTranslate } from "@tolgee/svelte";
import ChartCanvas from "./ChartCanvas.svelte";
import { getChartTheme, getBaseChartOptions } from "$lib/utils/chart.utils.js";

/** @type {{ data?: Array<{score: string, count: number}> }} */
let { data = [] } = $props();

const { t } = getTranslate();

const chartConfig = $derived.by(() => {
	if (!data || data.length === 0) return null;
	const theme = getChartTheme();
	const base = getBaseChartOptions(theme);

	const maxVal = Math.max(...data.map((d) => d.count));
	const colors = data.map((d) =>
		d.count === maxVal ? theme.accentRed : `${theme.textSecondary}60`,
	);

	return {
		type: "bar",
		data: {
			labels: data.map((d) => d.score),
			datasets: [
				{
					data: data.map((d) => d.count),
					backgroundColor: colors,
					borderRadius: 4,
					barThickness: 20,
				},
			],
		},
		options: {
			...base,
			indexAxis: "y",
			scales: {
				x: {
					...base.scales.x,
					grid: { color: `${theme.border}30` },
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
	<div class="bg-bg-secondary border border-border rounded-lg p-4">
		<h3 class="text-sm font-medium text-text-secondary mb-3">{$t("stats_dashboard.common_scores")}</h3>
		<ChartCanvas config={chartConfig} height={chartHeight} />
	</div>
{/if}
