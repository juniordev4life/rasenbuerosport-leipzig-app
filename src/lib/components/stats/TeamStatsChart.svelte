<script>
import { getTranslate } from "@tolgee/svelte";
import ChartCanvas from "./ChartCanvas.svelte";
import { getChartTheme, getBaseChartOptions } from "$lib/utils/chart.utils.js";

/** @type {{ data?: Array<{team_name: string, games: number, wins: number, win_rate: number}> }} */
let { data = [] } = $props();

const { t } = getTranslate();

/** Chart 1: Games per team (popularity) */
const gamesConfig = $derived.by(() => {
	if (!data || data.length === 0) return null;
	const theme = getChartTheme();
	const base = getBaseChartOptions(theme);

	return {
		type: "bar",
		data: {
			labels: data.map((d) => d.team_name),
			datasets: [
				{
					data: data.map((d) => d.games),
					backgroundColor: `${theme.accentRed}cc`,
					borderRadius: 4,
					barThickness: 18,
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

/** Chart 2: Win rate per team */
const winRateConfig = $derived.by(() => {
	if (!data || data.length === 0) return null;
	const theme = getChartTheme();
	const base = getBaseChartOptions(theme);

	const sorted = [...data].sort((a, b) => b.win_rate - a.win_rate);
	const colors = sorted.map((d) =>
		d.win_rate >= 50 ? theme.success : `${theme.textSecondary}60`,
	);

	return {
		type: "bar",
		data: {
			labels: sorted.map((d) => d.team_name),
			datasets: [
				{
					data: sorted.map((d) => d.win_rate),
					backgroundColor: colors,
					borderRadius: 4,
					barThickness: 18,
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
					min: 0,
					max: 100,
					ticks: { ...base.scales.x.ticks, callback: (v) => `${v}%` },
				},
				y: { ...base.scales.y, grid: { display: false } },
			},
			plugins: {
				...base.plugins,
				tooltip: {
					...base.plugins.tooltip,
					callbacks: {
						label: (ctx) => {
							const team = sorted[ctx.dataIndex];
							return `${ctx.raw}% (${team.wins}/${team.games})`;
						},
					},
				},
			},
		},
	};
});

const chartHeight = $derived(data.length > 8 ? "h-64" : "h-52");
</script>

{#if data.length > 0}
	{#if gamesConfig}
		<div class="bg-bg-secondary border border-border rounded-lg p-4">
			<h3 class="text-sm font-medium text-text-secondary mb-3">{$t("stats_dashboard.popular_teams")}</h3>
			<ChartCanvas config={gamesConfig} height={chartHeight} />
		</div>
	{/if}
	{#if winRateConfig}
		<div class="bg-bg-secondary border border-border rounded-lg p-4">
			<h3 class="text-sm font-medium text-text-secondary mb-3">{$t("stats_dashboard.team_win_rate")}</h3>
			<ChartCanvas config={winRateConfig} height={chartHeight} />
		</div>
	{/if}
{/if}
