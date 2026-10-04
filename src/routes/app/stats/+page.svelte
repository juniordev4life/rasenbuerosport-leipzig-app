<script>
import { getTranslate } from "@tolgee/svelte";
import BallIcon from "$lib/components/icons/BallIcon.svelte";
import ClockIcon from "$lib/components/icons/ClockIcon.svelte";
import LightningIcon from "$lib/components/icons/LightningIcon.svelte";
import ShieldIcon from "$lib/components/icons/ShieldIcon.svelte";
import TargetIcon from "$lib/components/icons/TargetIcon.svelte";
import SeasonSelector from "$lib/components/season/SeasonSelector.svelte";
import CommonScoresChart from "$lib/components/stats/CommonScoresChart.svelte";
import GamesPerMonthChart from "$lib/components/stats/GamesPerMonthChart.svelte";
import GoalsDistributionChart from "$lib/components/stats/GoalsDistributionChart.svelte";
import PlayerRadarChart from "$lib/components/stats/PlayerRadarChart.svelte";
import RollingWinRateChart from "$lib/components/stats/RollingWinRateChart.svelte";
import TeamStatsChart from "$lib/components/stats/TeamStatsChart.svelte";
import WeekdayDistributionChart from "$lib/components/stats/WeekdayDistributionChart.svelte";
import XgVsGoalsChart from "$lib/components/stats/XgVsGoalsChart.svelte";
import Section from "$lib/components/ui/Section.svelte";
import { get } from "$lib/services/api.services.js";
import { selectedSeason } from "$lib/stores/season.stores.js";

const { t } = getTranslate();

let dashboard = $state(null);
let community = $state(null);
let statsMe = $state(null);
let loading = $state(true);
let error = $state(null);

$effect(() => {
	const season = $selectedSeason;
	let aborted = false;

	loadAllData(season).catch(() => {});

	return () => {
		aborted = true;
	};

	async function loadAllData(s) {
		loading = true;
		error = null;
		try {
			const seasonParam = s !== "all" ? `?season=${s}` : "";

			const [dashRes, commRes, meRes] = await Promise.all([
				get(`/v1/stats/dashboard${seasonParam}`),
				get(`/v1/stats/community${seasonParam}`),
				get(`/v1/stats/me${seasonParam}`),
			]);

			if (aborted) return;
			dashboard = dashRes.data || null;
			community = commRes.data || null;
			statsMe = meRes.data || null;
		} catch (err) {
			if (aborted) return;
			console.error("Failed to load stats:", err);
			error = err;
		} finally {
			if (!aborted) loading = false;
		}
	}
});

const hasPerformance = $derived(dashboard?.rolling_win_rate?.length > 0);
const hasMatchStats = $derived(
	Boolean(statsMe?.career_match_stats) ||
		dashboard?.xg_vs_goals?.games_with_xg > 0,
);
const hasActivity = $derived(
	dashboard?.games_per_month?.length > 0 ||
		dashboard?.games_per_weekday?.length > 0,
);
const hasGoals = $derived(
	community?.common_scores?.length > 0 ||
		community?.goals_distribution?.length > 0,
);
const hasTeams = $derived(dashboard?.team_stats?.length > 0);
const isEmpty = $derived(
	!dashboard?.rolling_win_rate?.length && !community?.common_scores?.length,
);
</script>

<svelte:head>
	<title>RasenBürosport - {$t("stats_dashboard.page_title")}</title>
</svelte:head>

<div class="stack pb-4 lg:pb-8">
	<header class="hero bleed page-hero">
		<h1 class="page-title page-hero-title">{$t("stats_dashboard.page_title")}</h1>
		<SeasonSelector />
	</header>

	{#if loading}
		<div class="flex justify-center py-12">
			<span class="spinner" role="status" aria-label={$t("common.loading")}></span>
		</div>
	{:else if error}
		<p class="card notice" role="alert">{$t("stats_dashboard.error_loading")}</p>
	{:else}
		{#if hasPerformance}
			<Section title={$t("stats_dashboard.section_performance")}>
				{#snippet icon()}<LightningIcon size={22} strokeWidth={2} />{/snippet}
				<RollingWinRateChart data={dashboard?.rolling_win_rate} />
			</Section>
		{/if}

		{#if hasMatchStats}
			<Section title={$t("stats_dashboard.section_match_stats")}>
				{#snippet icon()}<TargetIcon size={22} strokeWidth={2} />{/snippet}
				<div class="chart-grid">
					<PlayerRadarChart stats={statsMe?.career_match_stats} />
					<XgVsGoalsChart data={dashboard?.xg_vs_goals} />
				</div>
			</Section>
		{/if}

		{#if hasActivity}
			<Section title={$t("stats_dashboard.section_activity")}>
				{#snippet icon()}<ClockIcon size={22} strokeWidth={2} />{/snippet}
				<div class="chart-grid">
					<GamesPerMonthChart data={dashboard?.games_per_month} />
					<WeekdayDistributionChart data={dashboard?.games_per_weekday} />
				</div>
			</Section>
		{/if}

		{#if hasGoals}
			<Section title={$t("stats_dashboard.section_goals")}>
				{#snippet icon()}<BallIcon size={22} strokeWidth={2} />{/snippet}
				<div class="chart-grid">
					<CommonScoresChart data={community?.common_scores} />
					<GoalsDistributionChart data={community?.goals_distribution} />
				</div>
			</Section>
		{/if}

		{#if hasTeams}
			<Section title={$t("stats_dashboard.section_teams")}>
				{#snippet icon()}<ShieldIcon size={22} strokeWidth={2} />{/snippet}
				<div class="chart-grid">
					<TeamStatsChart data={dashboard?.team_stats} />
				</div>
			</Section>
		{/if}

		{#if isEmpty}
			<p class="card notice">{$t("stats_dashboard.no_data")}</p>
		{/if}
	{/if}
</div>

<style>
/* ── Hero: the title above the season filter ─────────────────────────── */
.page-hero {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 16px;
}

:global([data-variant="b"]) .page-hero {
	gap: 12px;
}

/* Charts of one section: stacked on phones, side by side from about
 * 640 px of section width (a lone chart takes the full row). */
.chart-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr));
	gap: 12px;
}

:global([data-variant="b"]) .chart-grid {
	gap: 20px;
}

/* Desktop: the top bar carries the title, so the hero turns into a plain
 * toolbar holding the season filter. */
@media (min-width: 1024px) {
	.page-hero {
		flex-direction: row;
		justify-content: flex-end;
		margin: 0;
		padding: 0;
		background: transparent;
	}

	.page-hero-title {
		display: none;
	}

	.chart-grid {
		gap: var(--stack-gap);
	}
}
</style>
