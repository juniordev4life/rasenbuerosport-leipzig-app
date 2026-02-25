<script>
	import { getTranslate } from "@tolgee/svelte";
	import { goto } from "$app/navigation";
	import Button from "$lib/components/ui/Button.svelte";
	import RecentGames from "$lib/components/dashboard/RecentGames.svelte";
	import TopPlayers from "$lib/components/dashboard/TopPlayers.svelte";
	import { get } from "$lib/services/api.services.js";
	import { ROUTES } from "$lib/constants/routes.constants.js";

	const { t } = getTranslate();

	let games = $state([]);
	let leaderboard = $state([]);
	let loading = $state(true);

	$effect(() => {
		loadData();
	});

	async function loadData() {
		try {
			const [gamesRes, leaderboardRes] = await Promise.all([
				get("/v1/games?limit=5"),
				get("/v1/leaderboard?limit=3"),
			]);
			games = gamesRes.data || [];
			leaderboard = leaderboardRes.data || [];
		} catch (err) {
			console.error("Failed to load dashboard data:", err);
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>RasenBürosport - Dashboard</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<!-- New Game Button -->
	<Button variant="primary" onclick={() => goto(ROUTES.NEW_GAME)}>
		{$t("dashboard.new_game")} +
	</Button>

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
	{/if}
</div>
