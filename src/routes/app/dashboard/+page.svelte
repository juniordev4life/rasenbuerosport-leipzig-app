<script>
	import { getTranslate } from "@tolgee/svelte";
	import RecentGames from "$lib/components/dashboard/RecentGames.svelte";
	import TopPlayers from "$lib/components/dashboard/TopPlayers.svelte";
	import StreakBadge from "$lib/components/dashboard/StreakBadge.svelte";
	import StreakFeed from "$lib/components/dashboard/StreakFeed.svelte";
	import ActivityFeed from "$lib/components/dashboard/ActivityFeed.svelte";
	import { get } from "$lib/services/api.services.js";

	const { t } = getTranslate();

	let games = $state([]);
	let leaderboard = $state([]);
	let allPlayers = $state([]);
	let stats = $state(null);
	let recentActivity = $state([]);
	let loading = $state(true);

	$effect(() => {
		loadData();
	});

	async function loadData() {
		try {
			const [gamesRes, leaderboardRes, allPlayersRes, statsRes, activityRes] = await Promise.all([
				get("/v1/games?limit=5"),
				get("/v1/leaderboard?limit=3"),
				get("/v1/leaderboard?limit=50"),
				get("/v1/stats/me"),
				get("/v1/games/recent?limit=10"),
			]);
			games = gamesRes.data || [];
			leaderboard = leaderboardRes.data || [];
			allPlayers = allPlayersRes.data || [];
			stats = statsRes.data || null;
			recentActivity = activityRes.data || [];
		} catch (err) {
			console.error("Failed to load dashboard data:", err);
		} finally {
			loading = false;
		}
	}

	/** Players with active streaks or badges */
	const activeStreaks = $derived.by(() => {
		return allPlayers.filter((p) => p.current_streak || p.badges?.length > 0);
	});
</script>

<svelte:head>
	<title>RasenBürosport - Dashboard</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<!-- Streak Badge -->
	{#if stats}
		<StreakBadge streak={stats.current_streak} lastPlayedAt={stats.last_played_at} />
	{/if}

	{#if loading}
		<div class="flex justify-center py-8">
			<div
				class="animate-spin h-8 w-8 border-2 border-accent-red border-t-transparent rounded-full"
			></div>
		</div>
	{:else}
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
