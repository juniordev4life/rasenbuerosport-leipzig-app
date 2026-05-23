<script>
import { getTranslate } from "@tolgee/svelte";
import { goto } from "$app/navigation";
import { page } from "$app/state";
import HistoryIcon from "$lib/components/icons/HistoryIcon.svelte";
import HomeIcon from "$lib/components/icons/HomeIcon.svelte";
import PlusIcon from "$lib/components/icons/PlusIcon.svelte";
import TrophyIcon from "$lib/components/icons/TrophyIcon.svelte";
import UserIcon from "$lib/components/icons/UserIcon.svelte";
import { ROUTES } from "$lib/constants/routes.constants.js";

/**
 * V2 bottom navigation: four tabs with a centred FAB. The FAB is not
 * a tab — it is a primary action (start a new match). The Home tab is
 * the new-style `/app/dashboard` landing screen; the Profile tab is
 * back as a dedicated slot.
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

<nav
	class="fixed bottom-0 left-0 right-0 z-50 grid grid-cols-[1fr_1fr_auto_1fr_1fr] gap-1 items-center bg-bg-primary/95 backdrop-blur-md border-t border-bg-secondary px-3 lg:hidden"
	style="padding-top: 8px; padding-bottom: max(14px, env(safe-area-inset-bottom));"
>
	{#each TABS.slice(0, 2) as tab (tab.href)}
		<a
			href={tab.href}
			class="flex flex-col items-center gap-0.5 py-1.5 rounded-lg transition-colors {isActive(tab.href)
				? 'text-accent-red'
				: 'text-text-muted hover:text-text-secondary'}"
		>
			<tab.Icon size={22} />
			<span class="text-[9px] font-semibold tracking-wide">{$t(tab.labelKey)}</span>
		</a>
	{/each}

	<!-- FAB: primary action, not a tab. Pulse animation draws a faint
	     outer ring every 2.5s so the button reads as a CTA. -->
	<button
		type="button"
		onclick={() => goto(ROUTES.NEW_GAME)}
		aria-label={$t("nav.new_game")}
		class="fab"
	>
		<PlusIcon size={22} strokeWidth={2.4} />
	</button>

	{#each TABS.slice(2) as tab (tab.href)}
		<a
			href={tab.href}
			class="flex flex-col items-center gap-0.5 py-1.5 rounded-lg transition-colors {isActive(tab.href)
				? 'text-accent-red'
				: 'text-text-muted hover:text-text-secondary'}"
		>
			<tab.Icon size={22} />
			<span class="text-[9px] font-semibold tracking-wide">{$t(tab.labelKey)}</span>
		</a>
	{/each}
</nav>

<style>
.fab {
	position: relative;
	margin: -16px 8px 0;
	width: 56px;
	height: 56px;
	border-radius: 50%;
	background: linear-gradient(135deg, var(--color-accent-red), var(--color-accent-red-hover));
	color: #fff;
	border: none;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	box-shadow: 0 8px 24px rgba(226, 75, 74, 0.45);
}
.fab::before {
	content: "";
	position: absolute;
	inset: -4px;
	border-radius: 50%;
	background: linear-gradient(135deg, var(--color-accent-red), var(--color-accent-red-hover));
	opacity: 0.2;
	z-index: -1;
	animation: fab-pulse 2.5s ease-in-out infinite;
}
@keyframes fab-pulse {
	0%, 100% { transform: scale(1); opacity: 0.2; }
	50% { transform: scale(1.1); opacity: 0; }
}
</style>
