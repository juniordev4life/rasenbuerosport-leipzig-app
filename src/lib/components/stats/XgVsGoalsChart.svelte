<script>
import { getTranslate } from "@tolgee/svelte";
import ChartCanvas from "./ChartCanvas.svelte";
import { getChartTheme, getBaseChartOptions } from "$lib/utils/chart.utils.js";

/** @type {{ data?: {total_xg: number, total_goals: number, games_with_xg: number} }} */
let { data = null } = $props();

const { t } = getTranslate();

const diff = $derived(data ? data.total_goals - data.total_xg : 0);
const isOver = $derived(diff > 0);

const chartConfig = $derived.by(() => {
	if (!data || data.games_with_xg === 0) return null;
	const theme = getChartTheme();
	const base = getBaseChartOptions(theme);

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
					backgroundColor: [
						`${theme.textSecondary}50`,
						isOver ? theme.success : theme.error,
					],
					borderRadius: 6,
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
	<div class="bg-bg-secondary border border-border rounded-lg p-4">
		<div class="flex items-center justify-between mb-3">
			<h3 class="text-sm font-medium text-text-secondary">{$t("stats_dashboard.xg_vs_goals")}</h3>
			<span class="text-xs font-bold {isOver ? 'text-success' : 'text-error'}">
				{isOver ? "+" : ""}{diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1)}
			</span>
		</div>
		<ChartCanvas config={chartConfig} height="h-40" />
	</div>
{/if}
