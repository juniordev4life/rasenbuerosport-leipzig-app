<script>
import { getTranslate } from "@tolgee/svelte";
import SeasonSelector from "$lib/components/season/SeasonSelector.svelte";
import EloProgressionChart from "$lib/components/stats/EloProgressionChart.svelte";
import EloDistributionChart from "$lib/components/stats/EloDistributionChart.svelte";
import RollingWinRateChart from "$lib/components/stats/RollingWinRateChart.svelte";
import PlayerRadarChart from "$lib/components/stats/PlayerRadarChart.svelte";
import XgVsGoalsChart from "$lib/components/stats/XgVsGoalsChart.svelte";
import GamesPerMonthChart from "$lib/components/stats/GamesPerMonthChart.svelte";
import WeekdayDistributionChart from "$lib/components/stats/WeekdayDistributionChart.svelte";
import CommonScoresChart from "$lib/components/stats/CommonScoresChart.svelte";
import GoalsDistributionChart from "$lib/components/stats/GoalsDistributionChart.svelte";
import TeamStatsChart from "$lib/components/stats/TeamStatsChart.svelte";
import { get } from "$lib/services/api.services.js";
import { user } from "$lib/stores/auth.stores.js";
import { selectedSeason } from "$lib/stores/season.stores.js";

const { t } = getTranslate();

let dashboard = $state(null);
let community = $state(null);
let statsMe = $state(null);
let loading = $state(true);
let error = $state(null);

const currentUsername = $derived($user?.user_metadata?.username || "");

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
</script>

<svelte:head>
	<title>RasenBürosport - {$t("stats_dashboard.page_title")}</title>
</svelte:head>

<div class="flex flex-col gap-5 pb-4">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<h1 class="text-xl font-bold text-text-primary">{$t("stats_dashboard.page_title")}</h1>
		<SeasonSelector />
	</div>

	{#if loading}
		<div class="flex justify-center py-12">
			<div class="animate-spin h-8 w-8 border-2 border-accent-red border-t-transparent rounded-full"></div>
		</div>
	{:else if error}
		<div class="bg-bg-secondary border border-border rounded-lg p-6 text-center">
			<p class="text-text-secondary">{$t("stats_dashboard.error_loading")}</p>
		</div>
	{:else}
		<!-- Section A: Elo & Performance -->
		<section class="flex flex-col gap-4">
			<h2 class="text-sm font-bold text-text-primary uppercase tracking-wide">{$t("stats_dashboard.section_elo")}</h2>
			<EloProgressionChart data={dashboard?.elo_history} />
			<EloDistributionChart data={community?.elo_distribution} currentUsername={currentUsername} />
			<RollingWinRateChart data={dashboard?.rolling_win_rate} />
		</section>

		<!-- Section B: Match Stats -->
		{#if statsMe?.career_match_stats || (dashboard?.xg_vs_goals?.games_with_xg > 0)}
			<section class="flex flex-col gap-4">
				<h2 class="text-sm font-bold text-text-primary uppercase tracking-wide">{$t("stats_dashboard.section_match_stats")}</h2>
				<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
					<PlayerRadarChart stats={statsMe?.career_match_stats} />
					<XgVsGoalsChart data={dashboard?.xg_vs_goals} />
				</div>
			</section>
		{/if}

		<!-- Section C: Activity -->
		{#if dashboard?.games_per_month?.length > 0 || dashboard?.games_per_weekday?.length > 0}
			<section class="flex flex-col gap-4">
				<h2 class="text-sm font-bold text-text-primary uppercase tracking-wide">{$t("stats_dashboard.section_activity")}</h2>
				<GamesPerMonthChart data={dashboard?.games_per_month} />
				<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
					<WeekdayDistributionChart data={dashboard?.games_per_weekday} />
				</div>
			</section>
		{/if}

		<!-- Section D: Goal Analysis -->
		{#if community?.common_scores?.length > 0 || community?.goals_distribution?.length > 0}
			<section class="flex flex-col gap-4">
				<h2 class="text-sm font-bold text-text-primary uppercase tracking-wide">{$t("stats_dashboard.section_goals")}</h2>
				<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
					<CommonScoresChart data={community?.common_scores} />
					<GoalsDistributionChart data={community?.goals_distribution} />
				</div>
			</section>
		{/if}

		<!-- Section E: Team Analysis -->
		{#if dashboard?.team_stats?.length > 0}
			<section class="flex flex-col gap-4">
				<h2 class="text-sm font-bold text-text-primary uppercase tracking-wide">{$t("stats_dashboard.section_teams")}</h2>
				<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
					<TeamStatsChart data={dashboard?.team_stats} />
				</div>
			</section>
		{/if}

		<!-- Empty state -->
		{#if !dashboard?.elo_history?.length && !community?.elo_distribution?.length}
			<div class="bg-bg-secondary border border-border rounded-lg p-8 text-center">
				<p class="text-text-secondary">{$t("stats_dashboard.no_data")}</p>
			</div>
		{/if}
	{/if}
</div>
