<script>
	import { getTranslate } from "@tolgee/svelte";
	import { goto } from "$app/navigation";
	import { user } from "$lib/stores/auth.stores.js";
	import { get } from "$lib/services/api.services.js";
	import { logout } from "$lib/services/auth.services.js";
	import { ROUTES } from "$lib/constants/routes.constants.js";
	import Button from "$lib/components/ui/Button.svelte";
	import ProfileHeader from "$lib/components/profile/ProfileHeader.svelte";
	import ProfileEditor from "$lib/components/profile/ProfileEditor.svelte";
	import StatsOverview from "$lib/components/profile/StatsOverview.svelte";
	import WinRate from "$lib/components/profile/WinRate.svelte";
	import ModeBilanz from "$lib/components/profile/ModeBilanz.svelte";
	import FavoriteStats from "$lib/components/profile/FavoriteStats.svelte";
	import LeagueStats from "$lib/components/profile/LeagueStats.svelte";

	const { t } = getTranslate();

	let stats = $state(null);
	let userGames = $state([]);
	let loading = $state(true);
	let editing = $state(false);

	const username = $derived($user?.user_metadata?.username || "");
	const email = $derived($user?.email || "");
	const avatarUrl = $derived($user?.user_metadata?.avatar_url || null);

	$effect(() => {
		loadData();
	});

	async function loadData() {
		try {
			const [statsRes, gamesRes] = await Promise.all([
				get("/v1/stats/me"),
				get("/v1/games?limit=100"),
			]);
			stats = statsRes.data || null;
			userGames = gamesRes.data || [];
		} catch (err) {
			console.error("Failed to load profile data:", err);
		} finally {
			loading = false;
		}
	}

	async function handleLogout() {
		try {
			await logout();
			goto(ROUTES.LOGIN);
		} catch (err) {
			console.error("Logout failed:", err);
		}
	}

	function handleSaved() {
		editing = false;
	}
</script>

<svelte:head>
	<title>RasenBürosport - {$t("profile.title")}</title>
</svelte:head>

<div class="flex flex-col gap-5 pb-4">
	{#if loading}
		<div class="flex justify-center py-8">
			<div
				class="animate-spin h-8 w-8 border-2 border-accent-red border-t-transparent rounded-full"
			></div>
		</div>
	{:else}
		{#if editing}
			<ProfileEditor
				currentUsername={username}
				currentAvatarUrl={avatarUrl}
				onClose={() => (editing = false)}
				onSaved={handleSaved}
			/>
		{:else}
			<ProfileHeader
				{username}
				{email}
				{avatarUrl}
				onEdit={() => (editing = true)}
			/>
		{/if}

		{#if stats}
			<StatsOverview
				totalGames={stats.total_games}
				wins={stats.wins}
				losses={stats.losses}
			/>

			<WinRate winRate={stats.win_rate} />

			<ModeBilanz
				bilanz1v1={stats.bilanz_1v1}
				bilanz2v2={stats.bilanz_2v2}
			/>

			<FavoriteStats
				favoriteOpponent={stats.favorite_opponent}
				bestTeammate={stats.best_teammate}
				favoriteTeam={stats.favorite_team}
			/>
		{/if}

		<!-- League Stats -->
		<LeagueStats games={userGames} />

		<Button variant="ghost" onclick={handleLogout}>
			{$t("profile.logout")}
		</Button>
	{/if}
</div>
