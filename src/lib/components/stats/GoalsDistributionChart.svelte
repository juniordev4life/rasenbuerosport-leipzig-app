<script>
import { getTranslate } from "@tolgee/svelte";
import { getBaseChartOptions, getChartTheme } from "$lib/utils/chart.utils.js";
import ChartCanvas from "./ChartCanvas.svelte";

/** @type {{ data?: Array<{total_goals: number, count: number}> }} */
let { data = [] } = $props();

const { t } = getTranslate();

const chartConfig = $derived.by(() => {
	if (!data || data.length === 0) return null;
	const theme = getChartTheme();
	const base = getBaseChartOptions(theme);

	const maxVal = Math.max(...data.map((d) => d.count));
	const colors = data.map((d) =>
		d.count === maxVal && maxVal > 0 ? theme.brand : `${theme.muted}50`,
	);

	return {
		type: "bar",
		data: {
			labels: data.map((d) => `${d.total_goals}`),
			datasets: [
				{
					data: data.map((d) => d.count),
					backgroundColor: colors,
					borderRadius: 4,
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
						font: { size: 10 },
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
	<div class="bg-surface border border-line rounded-lg p-4">
		<h3 class="text-sm font-medium text-muted mb-3">{$t("stats_dashboard.goals_distribution")}</h3>
		<ChartCanvas config={chartConfig} height="h-40" />
	</div>
{/if}
