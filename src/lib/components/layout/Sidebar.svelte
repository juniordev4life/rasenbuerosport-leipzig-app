<script>
import { getTranslate } from "@tolgee/svelte";
import { page } from "$app/state";
import BarChartIcon from "$lib/components/icons/BarChartIcon.svelte";
import GiftIcon from "$lib/components/icons/GiftIcon.svelte";
import HistoryIcon from "$lib/components/icons/HistoryIcon.svelte";
import HomeIcon from "$lib/components/icons/HomeIcon.svelte";
import PlusIcon from "$lib/components/icons/PlusIcon.svelte";
import TrophyIcon from "$lib/components/icons/TrophyIcon.svelte";
import UsersIcon from "$lib/components/icons/UsersIcon.svelte";
import { ROUTES } from "$lib/constants/routes.constants.js";
import { user } from "$lib/stores/auth.stores.js";

const { t } = getTranslate();

/**
 * Primary destinations mirror the mobile BottomNav (same icon components).
 * Profile lives in the avatar link at the bottom (like the mobile Profile
 * tab); "new game" is the accent action (the mobile FAB).
 */
const primaryNav = [
	{ href: ROUTES.DASHBOARD, labelKey: "nav.home", Icon: HomeIcon },
	{ href: ROUTES.LEADERBOARD, labelKey: "nav.leaderboard", Icon: TrophyIcon },
	{ href: ROUTES.GAMES, labelKey: "nav.history", Icon: HistoryIcon },
];

/**
 * Secondary destinations — desktop has the room to surface these, where
 * the mobile bottom bar cannot. Reached on mobile via in-page links.
 */
const secondaryNav = [
	{ href: ROUTES.STATS, labelKey: "nav.stats", Icon: BarChartIcon },
	{ href: ROUTES.TEAMS, labelKey: "nav.teams", Icon: UsersIcon },
	{ href: ROUTES.WRAPPED, labelKey: "nav.wrapped", Icon: GiftIcon },
];

// Same active rule as the BottomNav: exact for the home tab, prefix for
// the rest so detail pages keep their entry highlighted.
function isActive(href) {
	if (href === ROUTES.DASHBOARD) return page.url.pathname === href;
	return page.url.pathname.startsWith(href);
}
</script>

{#snippet navLink(item)}
	<a
		href={item.href}
		class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors
			{isActive(item.href)
				? 'bg-accent-red/10 text-accent-red font-semibold'
				: 'text-text-secondary hover:bg-bg-input hover:text-text-primary'}"
	>
		<item.Icon size={20} />
		{$t(item.labelKey)}
	</a>
{/snippet}

<aside class="hidden lg:flex flex-col w-56 shrink-0 h-screen sticky top-0 bg-bg-secondary border-r border-border">
	<!-- App Title -->
	<div class="px-5 py-6 border-b border-border">
		<h1 class="text-lg font-bold text-text-primary">RasenBürosport</h1>
		<p class="text-xs text-text-secondary mt-0.5">Leipzig Edition</p>
	</div>

	<!-- Navigation -->
	<nav class="flex-1 flex flex-col gap-1 px-3 py-4">
		{#each primaryNav as item (item.href)}
			{@render navLink(item)}
		{/each}

		<!-- New game — primary action (the mobile FAB) -->
		<a
			href={ROUTES.NEW_GAME}
			class="flex items-center gap-3 px-3 py-2.5 mt-3 rounded-lg bg-accent-red text-white font-medium text-sm hover:bg-accent-red-hover transition-colors"
		>
			<PlusIcon size={20} strokeWidth={2.5} />
			{$t("nav.new_game")}
		</a>

		<div class="my-3 border-t border-border" aria-hidden="true"></div>

		{#each secondaryNav as item (item.href)}
			{@render navLink(item)}
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
