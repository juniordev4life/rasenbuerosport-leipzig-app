<script>
import { getTranslate } from "@tolgee/svelte";
import { getBaseChartOptions, getChartTheme } from "$lib/utils/chart.utils.js";
import ChartCanvas from "./ChartCanvas.svelte";
import ChartCard from "./ChartCard.svelte";

/**
 * Win rate over the last 10 games (main line) and, once there are enough
 * games, over the last 20 (dashed second line), game by game.
 *
 * @type {{ data?: Array<{game_number: number, win_rate_10: number|null, win_rate_20: number|null}> }}
 */
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
			borderColor: theme.chart1,
			backgroundColor: theme.chart1,
			borderWidth: 2.5,
			pointRadius: data.length > 30 ? 0 : 3,
			pointHoverRadius: 4,
			pointBackgroundColor: theme.surface,
			pointBorderColor: theme.chart1,
			pointBorderWidth: 2,
			tension: 0.3,
			fill: false,
		},
	];

	const has20 = data.some((d) => d.win_rate_20 !== null);
	if (has20) {
		datasets.push({
			label: $t("stats_dashboard.window_20"),
			data: data.map((d) => d.win_rate_20),
			borderColor: theme.chart2,
			backgroundColor: theme.chart2,
			borderWidth: 2,
			borderDash: [5, 4],
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
					align: "start",
					labels: {
						color: theme.ink,
						font: { family: theme.fontSans, size: 12, weight: 700 },
						boxWidth: 16,
						boxHeight: 3,
					},
				},
				tooltip: {
					...base.plugins.tooltip,
					callbacks: {
						title: (ctx) => $t("stats_dashboard.game_n", { n: ctx[0].label }),
						label: (ctx) => `${ctx.dataset.label}: ${ctx.raw}%`,
					},
				},
			},
		},
	};
});
</script>

{#if data.length > 0 && chartConfig}
	<ChartCard title={$t("stats_dashboard.rolling_win_rate")}>
		<ChartCanvas
			config={chartConfig}
			height="h-52 lg:h-64"
			label={$t("stats_dashboard.rolling_win_rate")}
		/>
	</ChartCard>
{/if}
