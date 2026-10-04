<script>
import { getTranslate } from "@tolgee/svelte";
import { getBaseChartOptions, getChartTheme } from "$lib/utils/chart.utils.js";
import ChartCanvas from "./ChartCanvas.svelte";
import ChartCard from "./ChartCard.svelte";

/**
 * Two charts for the teams played: how often each team was picked, and
 * its win rate (50 % and more in the win colour). Renders two sibling
 * cards, so a surrounding grid can lay them out side by side.
 *
 * @type {{ data?: Array<{team_name: string, games: number, wins: number, win_rate: number}> }}
 */
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
					backgroundColor: theme.chart1,
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
					grid: { color: theme.line },
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
		d.win_rate >= 50 ? theme.win : theme.chart2,
	);

	return {
		type: "bar",
		data: {
			labels: sorted.map((d) => d.team_name),
			datasets: [
				{
					data: sorted.map((d) => d.win_rate),
					backgroundColor: colors,
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
					grid: { color: theme.line },
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
		<ChartCard title={$t("stats_dashboard.popular_teams")}>
			<ChartCanvas
				config={gamesConfig}
				height={chartHeight}
				label={$t("stats_dashboard.popular_teams")}
			/>
		</ChartCard>
	{/if}
	{#if winRateConfig}
		<ChartCard title={$t("stats_dashboard.team_win_rate")}>
			<ChartCanvas
				config={winRateConfig}
				height={chartHeight}
				label={$t("stats_dashboard.team_win_rate")}
			/>
		</ChartCard>
	{/if}
{/if}
