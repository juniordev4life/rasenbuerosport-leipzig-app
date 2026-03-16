<script>
import { getTranslate } from "@tolgee/svelte";
import ChartCanvas from "./ChartCanvas.svelte";
import { getChartTheme, getBaseChartOptions } from "$lib/utils/chart.utils.js";

/** @type {{ data?: Array<{game_number: number, win_rate_10: number|null, win_rate_20: number|null}> }} */
let { data = [] } = $props();

const { t } = getTranslate();

const chartConfig = $derived.by(() => {
	if (!data || data.length === 0) return null;
	const theme = getChartTheme();
	const base = getBaseChartOptions(theme);

	const datasets = [
		{
			label: $t("stats_dashboard.window_10"),
			data: data.map((d) => d.win_rate_10),
			borderColor: theme.accentRed,
			borderWidth: 2,
			pointRadius: data.length > 30 ? 1 : 3,
			tension: 0.3,
			fill: false,
		},
	];

	const has20 = data.some((d) => d.win_rate_20 !== null);
	if (has20) {
		datasets.push({
			label: $t("stats_dashboard.window_20"),
			data: data.map((d) => d.win_rate_20),
			borderColor: `${theme.textSecondary}80`,
			borderWidth: 1.5,
			borderDash: [4, 4],
			pointRadius: 0,
			tension: 0.3,
			fill: false,
		});
	}

	return {
		type: "line",
		data: {
			labels: data.map((d) => d.game_number),
			datasets,
		},
		options: {
			...base,
			scales: {
				...base.scales,
				y: {
					...base.scales.y,
					min: 0,
					max: 100,
					ticks: { ...base.scales.y.ticks, callback: (v) => `${v}%` },
				},
				x: {
					...base.scales.x,
					ticks: {
						...base.scales.x.ticks,
						maxTicksLimit: 8,
					},
				},
			},
			plugins: {
				...base.plugins,
				legend: {
					display: has20,
					position: "top",
					labels: {
						color: theme.textSecondary,
						font: { size: 10 },
						boxWidth: 12,
					},
				},
				tooltip: {
					...base.plugins.tooltip,
					callbacks: {
						title: (ctx) => `Spiel ${ctx[0].label}`,
						label: (ctx) => `${ctx.dataset.label}: ${ctx.raw}%`,
					},
				},
			},
		},
	};
});
</script>

{#if data.length > 0 && chartConfig}
	<div class="bg-bg-secondary border border-border rounded-lg p-4">
		<h3 class="text-sm font-medium text-text-secondary mb-3">{$t("stats_dashboard.rolling_win_rate")}</h3>
		<ChartCanvas config={chartConfig} height="h-48" />
	</div>
{/if}
