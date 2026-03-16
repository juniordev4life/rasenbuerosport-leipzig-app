<script>
import { getTranslate } from "@tolgee/svelte";
import ChartCanvas from "./ChartCanvas.svelte";
import { getChartTheme, getBaseChartOptions } from "$lib/utils/chart.utils.js";

/** @type {{ data?: Array<{username: string, elo: number}>, currentUsername?: string }} */
let { data = [], currentUsername = "" } = $props();

const { t } = getTranslate();

const chartConfig = $derived.by(() => {
	if (!data || data.length === 0) return null;
	const theme = getChartTheme();
	const base = getBaseChartOptions(theme);

	const colors = data.map((p) =>
		p.username === currentUsername
			? theme.accentRed
			: `${theme.textSecondary}60`,
	);

	return {
		type: "bar",
		data: {
			labels: data.map((p) => p.username),
			datasets: [
				{
					data: data.map((p) => p.elo),
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
					ticks: { ...base.scales.x.ticks },
				},
				y: { ...base.scales.y, grid: { display: false } },
			},
			plugins: {
				...base.plugins,
				tooltip: {
					...base.plugins.tooltip,
					callbacks: {
						label: (ctx) => `Elo: ${ctx.raw}`,
					},
				},
			},
		},
	};
});

const chartHeight = $derived(data.length > 8 ? "h-64" : "h-48");
</script>

{#if data.length > 0 && chartConfig}
	<div class="bg-bg-secondary border border-border rounded-lg p-4">
		<h3 class="text-sm font-medium text-text-secondary mb-3">{$t("stats_dashboard.elo_distribution")}</h3>
		<ChartCanvas config={chartConfig} height={chartHeight} />
	</div>
{/if}
