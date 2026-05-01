<script>
import { getTranslate } from "@tolgee/svelte";
import { goto } from "$app/navigation";
import CareerMatchStats from "$lib/components/profile/CareerMatchStats.svelte";
import FavoriteStats from "$lib/components/profile/FavoriteStats.svelte";
import LeagueStats from "$lib/components/profile/LeagueStats.svelte";
import ModeBilanz from "$lib/components/profile/ModeBilanz.svelte";
import ProfileBadges from "$lib/components/profile/ProfileBadges.svelte";
import ProfileEditor from "$lib/components/profile/ProfileEditor.svelte";
import ProfileHeader from "$lib/components/profile/ProfileHeader.svelte";
import StatsOverview from "$lib/components/profile/StatsOverview.svelte";
import ThemeSelector from "$lib/components/profile/ThemeSelector.svelte";
import WinRate from "$lib/components/profile/WinRate.svelte";
import SeasonSelector from "$lib/components/season/SeasonSelector.svelte";
import Button from "$lib/components/ui/Button.svelte";
import { ROUTES } from "$lib/constants/routes.constants.js";
import { get } from "$lib/services/api.services.js";
import { logout } from "$lib/services/auth.services.js";
import { user } from "$lib/stores/auth.stores.js";
import { selectedSeason } from "$lib/stores/season.stores.js";

const { t } = getTranslate();

let stats = $state(null);
let userGames = $state([]);
let loading = $state(true);
let editing = $state(false);

const username = $derived($user?.user_metadata?.username || "");
const email = $derived($user?.email || "");
const avatarUrl = $derived($user?.user_metadata?.avatar_url || null);

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

			const [statsRes, gamesRes] = await Promise.all([
				get(`/v1/stats/me${seasonFirst}`),
				get(`/v1/games?limit=100${seasonParam}`),
			]);
			if (aborted) return;
			stats = statsRes.data || null;
			userGames = gamesRes.data || [];
		} catch (err) {
			if (aborted) return;
			console.error("Failed to load profile data:", err);
		} finally {
			if (!aborted) loading = false;
		}
	}
});

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
				goalTier={stats?.goal_tier || null}
				onEdit={() => (editing = true)}
			/>
		{/if}

		<!-- Stats Dashboard Link (mobile entry point) -->
		<a
			href={ROUTES.STATS}
			class="flex items-center justify-between bg-bg-secondary border border-border rounded-lg px-4 py-3 hover:bg-bg-input transition-colors"
		>
			<div class="flex items-center gap-3">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-accent-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
				</svg>
				<span class="text-sm font-medium text-text-primary">{$t("stats_dashboard.page_title")}</span>
			</div>
			<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
			</svg>
		</a>

		<!-- Season Selector -->
		<div class="flex justify-end">
			<SeasonSelector />
		</div>

		{#if stats}
			<div class="flex flex-col gap-5 lg:grid lg:grid-cols-2 lg:gap-4">
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
					topTeammates={stats.top_teammates || []}
					favoriteTeam={stats.favorite_team}
				/>

				<CareerMatchStats careerStats={stats.career_match_stats} />

				<ProfileBadges badges={stats.badges || []} />
			</div>
		{/if}

		<!-- League Stats -->
		<LeagueStats games={userGames} />

		<ThemeSelector />

		<Button variant="ghost" onclick={handleLogout}>
			{$t("profile.logout")}
		</Button>
	{/if}
</div>
