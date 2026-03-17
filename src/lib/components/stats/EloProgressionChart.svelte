<script>
import { getTranslate } from "@tolgee/svelte";
import { getBaseChartOptions, getChartTheme } from "$lib/utils/chart.utils.js";
import ChartCanvas from "./ChartCanvas.svelte";

/** @type {{ data?: Array<{elo_after: number, elo_change: number, result: string, played_at: string}> }} */
let { data = [] } = $props();

const { t } = getTranslate();

const chartConfig = $derived.by(() => {
	if (!data || data.length === 0) return null;
	const theme = getChartTheme();
	const base = getBaseChartOptions(theme);

	const resultColors = { W: theme.success, D: theme.warning, L: theme.error };
	const pointColors = data.map(
		(g) => resultColors[g.result] || theme.textSecondary,
	);

	// Show month label for first game of each month
	const labels = data.map((g, i) => {
		const date = new Date(g.played_at);
		if (i === 0) return date.toLocaleDateString("de-DE", { month: "short" });
		const prev = new Date(data[i - 1].played_at);
		if (date.getMonth() !== prev.getMonth()) {
			return date.toLocaleDateString("de-DE", { month: "short" });
		}
		return "";
	});

	return {
		type: "line",
		data: {
			labels,
			datasets: [
				{
					data: data.map((g) => g.elo_after),
					borderColor: theme.accentRed,
					borderWidth: 2,
					pointBackgroundColor: pointColors,
					pointBorderColor: pointColors,
					pointRadius: data.length > 40 ? 2 : 4,
					pointHoverRadius: 6,
					tension: 0.3,
					fill: false,
				},
			],
		},
		options: {
			...base,
			scales: {
				...base.scales,
				y: {
					...base.scales.y,
					ticks: { ...base.scales.y.ticks, stepSize: 20 },
				},
			},
			plugins: {
				...base.plugins,
				tooltip: {
					...base.plugins.tooltip,
					callbacks: {
						title: (ctx) => {
							const g = data[ctx[0].dataIndex];
							return new Date(g.played_at).toLocaleDateString("de-DE", {
								day: "2-digit",
								month: "2-digit",
								year: "numeric",
							});
						},
						label: (ctx) => {
							const g = data[ctx.dataIndex];
							const prefix = g.elo_change >= 0 ? "+" : "";
							return `Elo: ${g.elo_after} (${prefix}${g.elo_change})`;
						},
					},
				},
			},
		},
	};
});
</script>

{#if data.length > 0 && chartConfig}
	<div class="bg-bg-secondary border border-border rounded-lg p-4">
		<h3 class="text-sm font-medium text-text-secondary mb-3">{$t("stats_dashboard.elo_progression")}</h3>
		<ChartCanvas config={chartConfig} height="h-52" />
	</div>
{/if}
