<script>
import { getTranslate } from "@tolgee/svelte";
import ActiveChallengesCard from "$lib/components/challenges/ActiveChallengesCard.svelte";
import PersonalRecapCard from "$lib/components/wrapped/PersonalRecapCard.svelte";
import ActivityFeed from "$lib/components/dashboard/ActivityFeed.svelte";
import RecentGames from "$lib/components/dashboard/RecentGames.svelte";
import StreakBadge from "$lib/components/dashboard/StreakBadge.svelte";
import StreakFeed from "$lib/components/dashboard/StreakFeed.svelte";
import TopPlayers from "$lib/components/dashboard/TopPlayers.svelte";
import SeasonSelector from "$lib/components/season/SeasonSelector.svelte";
import { get } from "$lib/services/api.services.js";
import { selectedSeason } from "$lib/stores/season.stores.js";
import { buildRematchUrl } from "$lib/utils/rematch.utils.js";

const { t } = getTranslate();

let games = $state([]);
let leaderboard = $state([]);
let allPlayers = $state([]);
let stats = $state(null);
let recentActivity = $state([]);
let loading = $state(true);

$effect(() => {
	const season = $selectedSeason;
	let aborted = false;

	loadData(season).catch(() => {});

	return () => {
		aborted = true;
	};

	async function loadData(s) {
		loading = true;
		try {
			const seasonParam = s !== "all" ? `&season=${s}` : "";
			const seasonFirst = s !== "all" ? `?season=${s}` : "";

			const [gamesRes, leaderboardRes, allPlayersRes, statsRes, activityRes] =
				await Promise.all([
					get(`/v1/games?limit=5${seasonParam}`),
					get(`/v1/leaderboard?limit=3${seasonParam}`),
					get(`/v1/leaderboard?limit=50${seasonParam}`),
					get(`/v1/stats/me${seasonFirst}`),
					get(`/v1/games/recent?limit=10${seasonParam}`),
				]);
			if (aborted) return;
			games = gamesRes.data || [];
			leaderboard = leaderboardRes.data || [];
			allPlayers = allPlayersRes.data || [];
			stats = statsRes.data || null;
			recentActivity = activityRes.data || [];
		} catch (err) {
			if (aborted) return;
			console.error("Failed to load dashboard data:", err);
		} finally {
			if (!aborted) loading = false;
		}
	}
});

/** Players with active streaks or badges */
const activeStreaks = $derived.by(() => {
	return allPlayers.filter((p) => p.current_streak || p.badges?.length > 0);
});

/** Quick Rematch: build URLs from last game */
const lastGame = $derived(games.length > 0 ? games[0] : null);

const lastGameRematchUrl = $derived.by(() => {
	if (!lastGame?.game_players) return null;
	const hp = lastGame.game_players
		.filter((p) => p.team === "home")
		.map((p) => p.player_id);
	const ap = lastGame.game_players
		.filter((p) => p.team === "away")
		.map((p) => p.player_id);
	const ht =
		lastGame.game_players.find((p) => p.team === "home" && p.team_name)
			?.team_name || "";
	const at =
		lastGame.game_players.find((p) => p.team === "away" && p.team_name)
			?.team_name || "";
	if (hp.length === 0 || ap.length === 0) return null;
	return buildRematchUrl({
		homePlayers: hp,
		awayPlayers: ap,
		homeTeam: ht,
		awayTeam: at,
	});
});

const lastGameSwapUrl = $derived.by(() => {
	if (!lastGame?.game_players) return null;
	const hp = lastGame.game_players
		.filter((p) => p.team === "home")
		.map((p) => p.player_id);
	const ap = lastGame.game_players
		.filter((p) => p.team === "away")
		.map((p) => p.player_id);
	const ht =
		lastGame.game_players.find((p) => p.team === "home" && p.team_name)
			?.team_name || "";
	const at =
		lastGame.game_players.find((p) => p.team === "away" && p.team_name)
			?.team_name || "";
	if (hp.length === 0 || ap.length === 0) return null;
	return buildRematchUrl({
		homePlayers: hp,
		awayPlayers: ap,
		homeTeam: ht,
		awayTeam: at,
		swap: true,
	});
});
</script>

<svelte:head>
	<title>RasenBürosport - Dashboard</title>
</svelte:head>

<div class="flex flex-col gap-6 lg:grid lg:grid-cols-2">
	<!-- Header with Season Selector -->
	<div class="flex items-center justify-between lg:col-span-2">
		<h1 class="text-xl font-bold text-text-primary">{$t("nav.dashboard")}</h1>
		<SeasonSelector />
	</div>

	<!-- Streak Badge -->
	{#if stats}
		<div class="lg:col-span-2">
			<StreakBadge streak={stats.current_streak} lastPlayedAt={stats.last_played_at} />
		</div>
	{/if}

	<!-- Active Challenges (week teaser) -->
	<div class="lg:col-span-2">
		<ActiveChallengesCard />
	</div>

	<!-- Personal weekly recap (live AI narrative) -->
	<div class="lg:col-span-2">
		<PersonalRecapCard />
	</div>


	{#if loading}
		<div class="flex justify-center py-8 lg:col-span-2">
			<div
				class="animate-spin h-8 w-8 border-2 border-accent-red border-t-transparent rounded-full"
			></div>
		</div>
	{:else}
		<!-- Quick Rematch -->
		{#if lastGameRematchUrl}
			<div class="lg:col-span-2 bg-bg-secondary border border-border rounded-xl p-4">
				<div class="flex items-center justify-between">
					<div class="flex-1 min-w-0">
						<p class="text-sm font-semibold text-text-primary">
							{$t("rematch.quick_title")}
						</p>
						<p class="text-xs text-text-secondary mt-0.5 truncate">
							{lastGame.game_players?.find((p) => p.team === "home" && p.team_name)?.team_name || ""}
							{$t("common.vs")}
							{lastGame.game_players?.find((p) => p.team === "away" && p.team_name)?.team_name || ""}
							&middot; {lastGame.mode}
						</p>
					</div>
					<div class="flex gap-2 shrink-0 ml-3">
						<a
							href={lastGameSwapUrl}
							class="flex items-center justify-center w-10 h-10 rounded-lg bg-bg-input border border-border text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-all"
							aria-label={$t("rematch.swap_button")}
							title={$t("rematch.swap_button")}
						>
							<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
							</svg>
						</a>
						<a
							href={lastGameRematchUrl}
							class="flex items-center justify-center gap-2 py-2.5 px-5 rounded-lg bg-accent-red text-white font-semibold text-sm hover:bg-accent-red/90 active:scale-[0.98] transition-all"
						>
							<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
							</svg>
							{$t("rematch.button")}
						</a>
					</div>
				</div>
			</div>
		{/if}

		<!-- Recent Games -->
		<RecentGames {games} />

		<!-- Leaderboard -->
		<TopPlayers players={leaderboard} />

		<!-- Current Streaks -->
		<StreakFeed streaks={activeStreaks} />

		<!-- Recent Games (all players) -->
		<ActivityFeed games={recentActivity} />
	{/if}
</div>
