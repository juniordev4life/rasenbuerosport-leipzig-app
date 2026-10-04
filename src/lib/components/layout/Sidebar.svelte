<script>
import { getTranslate } from "@tolgee/svelte";
import { page } from "$app/state";
import BarChartIcon from "$lib/components/icons/BarChartIcon.svelte";
import FootballIcon from "$lib/components/icons/FootballIcon.svelte";
import GiftIcon from "$lib/components/icons/GiftIcon.svelte";
import HistoryIcon from "$lib/components/icons/HistoryIcon.svelte";
import HomeIcon from "$lib/components/icons/HomeIcon.svelte";
import TrophyIcon from "$lib/components/icons/TrophyIcon.svelte";
import UsersIcon from "$lib/components/icons/UsersIcon.svelte";
import PlayerAvatar from "$lib/components/ui/PlayerAvatar.svelte";
import { ROUTES } from "$lib/constants/routes.constants.js";
import { user } from "$lib/stores/auth.stores.js";

const { t } = getTranslate();

/**
 * Desktop navigation (from `lg`). Mirrors the mobile BottomNav: same
 * destinations, "new match" as the accent action, profile behind the
 * avatar at the bottom, plus the secondary pages desktop has room for.
 * Design A: white rail with a red marker. Design B: a white card on the
 * pitch with navy pills.
 */
const primaryNav = [
	{ href: ROUTES.DASHBOARD, labelKey: "nav.home", Icon: HomeIcon },
	{ href: ROUTES.LEADERBOARD, labelKey: "nav.leaderboard", Icon: TrophyIcon },
	{ href: ROUTES.GAMES, labelKey: "nav.history", Icon: HistoryIcon },
];

const secondaryNav = [
	{ href: ROUTES.STATS, labelKey: "nav.stats", Icon: BarChartIcon },
	{ href: ROUTES.TEAMS, labelKey: "nav.teams", Icon: UsersIcon },
	{ href: ROUTES.WRAPPED, labelKey: "nav.wrapped", Icon: GiftIcon },
];

// Same active rule as the BottomNav: exact for home, prefix for the rest
// so detail pages keep their entry highlighted.
function isActive(href) {
	if (href === ROUTES.DASHBOARD) return page.url.pathname === href;
	return page.url.pathname.startsWith(href);
}

const username = $derived($user?.user_metadata?.username || "User");
const avatarUrl = $derived($user?.user_metadata?.avatar_url || null);
</script>

{#snippet navLink(item)}
	<a
		href={item.href}
		class="nav-link"
		aria-current={isActive(item.href) ? "page" : undefined}
	>
		<item.Icon size={20} strokeWidth={2} />
		<span>{$t(item.labelKey)}</span>
	</a>
{/snippet}

<aside class="sidebar hidden lg:flex">
	<a href={ROUTES.DASHBOARD} class="brand">
		<img src="/logo.png" alt="" width="44" height="44" />
		<span class="flex flex-col leading-none">
			<span class="brand-name">RasenBürosport</span>
			<span class="brand-sub">Leipzig Edition</span>
		</span>
	</a>

	<nav class="flex-1 flex flex-col gap-1 px-3 py-4" aria-label={$t("nav.main")}>
		{#each primaryNav as item (item.href)}
			{@render navLink(item)}
		{/each}

		<a href={ROUTES.NEW_GAME} class="btn btn-primary new-game">
			<FootballIcon size={22} />
			{$t("nav.new_game")}
		</a>

		<div class="divider" aria-hidden="true"></div>

		{#each secondaryNav as item (item.href)}
			{@render navLink(item)}
		{/each}
	</nav>

	<a
		href={ROUTES.PROFILE}
		class="profile-link"
		aria-current={isActive(ROUTES.PROFILE) ? "page" : undefined}
	>
		<PlayerAvatar player={{ name: username, avatarUrl }} size={36} self />
		<span class="min-w-0 flex flex-col">
			<span class="font-bold text-sm truncate">{username}</span>
			<span class="text-xs text-muted">{$t("nav.profile")}</span>
		</span>
	</a>
</aside>

<style>
.sidebar {
	position: sticky;
	top: 0;
	flex-direction: column;
	width: 15rem;
	flex-shrink: 0;
	height: 100vh;
	background: var(--color-surface);
	border-right: 1px solid var(--color-line);
	color: var(--color-ink);
}

.brand {
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 20px 18px;
	border-bottom: 1px solid var(--color-line);
	text-decoration: none;
	color: inherit;
}

.brand img {
	width: 44px;
	height: 44px;
	object-fit: contain;
}

.brand-name {
	font-family: var(--font-title);
	font-weight: var(--title-weight);
	text-transform: var(--title-case);
	font-size: 19px;
	color: var(--color-brand);
}

.brand-sub {
	margin-top: 4px;
	font-family: var(--font-cond);
	font-weight: 700;
	font-size: 12px;
	letter-spacing: 0.03em;
	text-transform: uppercase;
	color: var(--color-muted);
}

.nav-link {
	position: relative;
	display: flex;
	align-items: center;
	gap: 12px;
	min-height: 44px;
	padding: 0 12px;
	text-decoration: none;
	color: var(--color-ink);
	font-family: var(--font-cond);
	font-weight: 700;
	font-size: 15px;
	letter-spacing: 0.03em;
	text-transform: uppercase;
}

.nav-link:hover {
	background: var(--color-sunken);
}

.nav-link[aria-current="page"] {
	color: var(--color-brand);
	background: var(--color-sunken);
}

.nav-link[aria-current="page"]::before {
	content: "";
	position: absolute;
	left: -12px;
	top: 8px;
	bottom: 8px;
	width: 3px;
	background: var(--color-brand);
}

.new-game {
	margin-top: 12px;
	justify-content: flex-start;
	padding: 0 14px;
}

.divider {
	margin: 12px 0;
	border-top: 1px solid var(--color-line);
}

.profile-link {
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 14px 16px;
	border-top: 1px solid var(--color-line);
	text-decoration: none;
	color: inherit;
}

.profile-link:hover,
.profile-link[aria-current="page"] {
	background: var(--color-sunken);
}

/* Design B: a floating sticker card on the pitch. */
:global([data-variant="b"]) .sidebar {
	top: 16px;
	height: calc(100vh - 32px);
	margin: 16px 0 16px 16px;
	border-right: 0;
	border-radius: var(--radius-card);
	box-shadow: var(--shadow-card);
	overflow: hidden;
}

:global([data-variant="b"]) .brand-name {
	color: var(--color-ink);
	font-size: 22px;
}

:global([data-variant="b"]) .brand-sub {
	text-transform: none;
	letter-spacing: 0;
	font-family: var(--font-sans);
}

:global([data-variant="b"]) .nav-link {
	border-radius: 999px;
	font-family: var(--font-sans);
	font-size: 15px;
	letter-spacing: 0;
	text-transform: none;
}

:global([data-variant="b"]) .nav-link[aria-current="page"] {
	background: var(--color-navy);
	color: var(--color-on-navy);
}

:global([data-variant="b"]) .nav-link[aria-current="page"]::before {
	display: none;
}
</style>
