<script>
import { getTranslate } from "@tolgee/svelte";
import ChartCanvas from "./ChartCanvas.svelte";
import { getChartTheme, getBaseChartOptions } from "$lib/utils/chart.utils.js";

/** @type {{ data?: Array<{month: string, count: number}> }} */
let { data = [] } = $props();

const { t } = getTranslate();

const MONTHS_DE = [
	"Jan",
	"Feb",
	"Mär",
	"Apr",
	"Mai",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Okt",
	"Nov",
	"Dez",
];

const chartConfig = $derived.by(() => {
	if (!data || data.length === 0) return null;
	const theme = getChartTheme();
	const base = getBaseChartOptions(theme);

	const labels = data.map((d) => {
		const [, month] = d.month.split("-");
		return MONTHS_DE[Number.parseInt(month, 10) - 1] || d.month;
	});

	return {
		type: "bar",
		data: {
			labels,
			datasets: [
				{
					data: data.map((d) => d.count),
					backgroundColor: `${theme.accentRed}cc`,
					borderRadius: 4,
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
	<div class="bg-bg-secondary border border-border rounded-lg p-4">
		<h3 class="text-sm font-medium text-text-secondary mb-3">{$t("stats_dashboard.games_per_month")}</h3>
		<ChartCanvas config={chartConfig} height="h-48" />
	</div>
{/if}
