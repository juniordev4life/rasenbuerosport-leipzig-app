<script>
import { getTranslate } from "@tolgee/svelte";
import { page } from "$app/state";
import { ROUTES } from "$lib/constants/routes.constants.js";
import { user } from "$lib/stores/auth.stores.js";

const { t } = getTranslate();

const navItems = [
	{
		href: ROUTES.DASHBOARD,
		labelKey: "nav.dashboard",
		icon: "dashboard",
	},
	{
		href: ROUTES.LEADERBOARD,
		labelKey: "nav.leaderboard",
		icon: "leaderboard",
	},
	{
		href: ROUTES.GAMES,
		labelKey: "nav.games",
		icon: "games",
	},
	{
		href: ROUTES.TEAMS,
		labelKey: "nav.teams",
		icon: "teams",
	},
	{
		href: ROUTES.STATS,
		labelKey: "nav.stats",
		icon: "stats",
	},
	{
		href: ROUTES.NEW_GAME,
		labelKey: "nav.new_game",
		icon: "new_game",
		isAction: true,
	},
];

const isActive = (href) => page.url.pathname === href;
</script>

<aside class="hidden lg:flex flex-col w-56 shrink-0 h-screen sticky top-0 bg-bg-secondary border-r border-border">
	<!-- App Title -->
	<div class="px-5 py-6 border-b border-border">
		<h1 class="text-lg font-bold text-text-primary">RasenBürosport</h1>
		<p class="text-xs text-text-secondary mt-0.5">Leipzig Edition</p>
	</div>

	<!-- Navigation -->
	<nav class="flex-1 flex flex-col gap-1 px-3 py-4">
		{#each navItems as item (item.href)}
			{#if item.isAction}
				<a
					href={item.href}
					class="flex items-center gap-3 px-3 py-2.5 mt-3 rounded-lg bg-accent-red text-white font-medium text-sm hover:bg-accent-red-hover transition-colors"
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
						<line x1="12" y1="5" x2="12" y2="19"></line>
						<line x1="5" y1="12" x2="19" y2="12"></line>
					</svg>
					{$t(item.labelKey)}
				</a>
			{:else}
				<a
					href={item.href}
					class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors
						{isActive(item.href)
							? 'bg-accent-red/10 text-accent-red font-semibold'
							: 'text-text-secondary hover:bg-bg-input hover:text-text-primary'}"
				>
					{#if item.icon === "dashboard"}
						<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
						</svg>
					{:else if item.icon === "leaderboard"}
						<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
						</svg>
					{:else if item.icon === "games"}
						<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
							<path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
					{:else if item.icon === "teams"}
						<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
						</svg>
					{:else if item.icon === "stats"}
						<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
						</svg>
					{/if}
					{$t(item.labelKey)}
				</a>
			{/if}
		{/each}
	</nav>

	<!-- User / Profile Link -->
	<a
		href={ROUTES.PROFILE}
		class="flex items-center gap-3 px-4 py-4 border-t border-border transition-colors
			{isActive(ROUTES.PROFILE)
				? 'bg-accent-red/10'
				: 'hover:bg-bg-input'}"
	>
		{#if $user?.user_metadata?.avatar_url}
			<img
				src={$user.user_metadata.avatar_url}
				alt={$user.user_metadata.username || "Avatar"}
				class="w-8 h-8 rounded-full object-cover ring-1 {isActive(ROUTES.PROFILE) ? 'ring-accent-red' : 'ring-border'}"
			/>
		{:else}
			<div class="w-8 h-8 rounded-full bg-bg-input border border-border flex items-center justify-center text-xs font-bold text-text-secondary">
				{($user?.user_metadata?.username || "U").charAt(0).toUpperCase()}
			</div>
		{/if}
		<div class="min-w-0">
			<p class="text-sm font-medium truncate {isActive(ROUTES.PROFILE) ? 'text-accent-red' : 'text-text-primary'}">
				{$user?.user_metadata?.username || "User"}
			</p>
			<p class="text-[10px] text-text-secondary truncate">
				{$t("nav.profile")}
			</p>
		</div>
	</a>
</aside>
