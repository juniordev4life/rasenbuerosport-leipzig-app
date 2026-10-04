<script>
import { getTranslate } from "@tolgee/svelte";
import { goto } from "$app/navigation";
import { page } from "$app/state";
import FootballIcon from "$lib/components/icons/FootballIcon.svelte";
import HistoryIcon from "$lib/components/icons/HistoryIcon.svelte";
import HomeIcon from "$lib/components/icons/HomeIcon.svelte";
import TrophyIcon from "$lib/components/icons/TrophyIcon.svelte";
import UserIcon from "$lib/components/icons/UserIcon.svelte";
import { ROUTES } from "$lib/constants/routes.constants.js";

/**
 * Mobile bottom navigation: four tabs around a raised "new match" button
 * (an action, not a tab). Design A: condensed caps with a red underline,
 * no icons. Design B: icons over labels on a rounded white bar, the ball
 * button wears a gold "+".
 */

const { t } = getTranslate();

const TABS = [
	{ href: ROUTES.DASHBOARD, labelKey: "nav.home", Icon: HomeIcon },
	{ href: ROUTES.LEADERBOARD, labelKey: "nav.leaderboard", Icon: TrophyIcon },
	{ href: ROUTES.GAMES, labelKey: "nav.history", Icon: HistoryIcon },
	{ href: ROUTES.PROFILE, labelKey: "nav.profile", Icon: UserIcon },
];

function isActive(href) {
	if (href === ROUTES.DASHBOARD) return page.url.pathname === href;
	return page.url.pathname.startsWith(href);
}
</script>

{#snippet tab(item)}
	<a
		href={item.href}
		class="tab"
		aria-current={isActive(item.href) ? "page" : undefined}
	>
		<span class="tab-icon"><item.Icon size={24} strokeWidth={2} /></span>
		<span class="tab-label">{$t(item.labelKey)}</span>
		<span class="tab-bar" aria-hidden="true"></span>
	</a>
{/snippet}

<nav class="bottom-nav" aria-label={$t("nav.main")}>
	{#each TABS.slice(0, 2) as item (item.href)}
		{@render tab(item)}
	{/each}

	<div class="fab-slot">
		<button
			type="button"
			onclick={() => goto(ROUTES.NEW_GAME)}
			aria-label={$t("nav.new_game")}
			class="fab"
		>
			<FootballIcon size={38} />
			<span class="fab-plus" aria-hidden="true">
				<svg viewBox="0 0 12 12" width="12" height="12"><path d="M6 1.5v9M1.5 6h9" /></svg>
			</span>
		</button>
	</div>

	{#each TABS.slice(2) as item (item.href)}
		{@render tab(item)}
	{/each}
</nav>

<style>
.bottom-nav {
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 50;
	display: grid;
	grid-template-columns: repeat(5, minmax(0, 1fr));
	align-items: stretch;
	min-height: 64px;
	padding: 0 6px max(10px, env(safe-area-inset-bottom));
	background: var(--color-surface);
	border-top: 1px solid var(--color-line);
}

.tab {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 6px;
	padding-top: 8px;
	text-decoration: none;
	color: var(--color-ink);
	font-family: var(--font-cond);
	font-weight: 700;
	font-size: 13px;
	letter-spacing: 0.03em;
	text-transform: uppercase;
}

.tab[aria-current="page"] {
	color: var(--color-brand);
}

.tab-icon {
	display: none;
}

.tab-bar {
	width: 24px;
	height: 3px;
	background: transparent;
}

.tab[aria-current="page"] .tab-bar {
	background: var(--color-brand);
}

.fab-slot {
	display: flex;
	justify-content: center;
}

.fab {
	position: relative;
	margin-top: -22px;
	width: 64px;
	height: 64px;
	border: 4px solid var(--color-surface);
	border-radius: 999px;
	background: var(--color-brand);
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	transition: transform 120ms;
}

.fab:active {
	transform: scale(0.96);
}

.fab-plus {
	display: none;
}

/* Design B */
:global([data-variant="b"]) .bottom-nav {
	border-top: 0;
	border-radius: 24px 24px 0 0;
	box-shadow: var(--shadow-nav);
	padding-top: 6px;
}

:global([data-variant="b"]) .tab {
	gap: 3px;
	padding-top: 4px;
	font-family: var(--font-sans);
	font-size: 11px;
	letter-spacing: 0;
	text-transform: none;
}

:global([data-variant="b"]) .tab-icon {
	display: inline-flex;
}

:global([data-variant="b"]) .tab-bar {
	display: none;
}

:global([data-variant="b"]) .fab {
	margin-top: -28px;
	width: 70px;
	height: 70px;
	box-shadow: var(--shadow-fab);
}

:global([data-variant="b"]) .fab-plus {
	position: absolute;
	right: -4px;
	top: -4px;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 26px;
	height: 26px;
	border: 2px solid var(--color-surface);
	border-radius: 999px;
	background: var(--color-gold);
}

.fab-plus path {
	stroke: var(--color-on-gold);
	stroke-width: 2.5;
	stroke-linecap: round;
}

/* Phone layout only; the desktop shell uses Sidebar + Topbar. Set here, not
 * with `lg:hidden`: this component's own display rule would win. */
@media (min-width: 1024px) {
	.bottom-nav {
		display: none;
	}
}
</style>
