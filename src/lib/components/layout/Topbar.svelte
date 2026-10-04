<script>
import { getTranslate } from "@tolgee/svelte";
import { page } from "$app/state";
import FootballIcon from "$lib/components/icons/FootballIcon.svelte";
import AccountMenu from "$lib/components/layout/AccountMenu.svelte";
import FeedbackSheet from "$lib/components/ui/FeedbackSheet.svelte";
import PlayerAvatar from "$lib/components/ui/PlayerAvatar.svelte";
import { ROUTES } from "$lib/constants/routes.constants.js";
import { user } from "$lib/stores/auth.stores.js";
import { goBack, hasBackButton } from "$lib/utils/backNavigation.utils.js";
import { isoWeek } from "$lib/utils/isoWeek.utils.js";
import { getPageTitleKey } from "$lib/utils/pageTitle.utils.js";

/**
 * Desktop top bar (from `lg`; the mobile Header covers smaller screens).
 * Holds a back button on pages the sidebar doesn't list, the page title,
 * the calendar week, the "new match" action and the avatar → account
 * menu, the same overlays the mobile Header opens.
 * Design A: white bar; design B: straight on the pitch.
 */

const { t } = getTranslate();

let menuOpen = $state(false);
let feedbackOpen = $state(false);

const isDashboard = $derived(page.url.pathname === ROUTES.DASHBOARD);
const showBack = $derived(hasBackButton(page.url.pathname, "desktop"));
const titleKey = $derived(getPageTitleKey(page.url.pathname));
const username = $derived($user?.user_metadata?.username || "User");
const avatarUrl = $derived($user?.user_metadata?.avatar_url || null);
const week = isoWeek(new Date());

/**
 * Close the AccountMenu first, then open the FeedbackSheet on the next
 * tick, the same pause the mobile Header uses.
 */
function openFeedback() {
	menuOpen = false;
	setTimeout(() => {
		feedbackOpen = true;
	}, 80);
}
</script>

<header class="topbar hidden lg:flex">
	<div class="flex items-center gap-2 min-w-0">
		{#if showBack}
			<button
				type="button"
				onclick={goBack}
				class="btn btn-ghost btn-icon back"
				aria-label={$t("common.back")}
			>
				<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
					<path d="M15 19l-7-7 7-7" />
				</svg>
			</button>
		{/if}
		{#if isDashboard}
			<h1 class="title truncate">{$t("dashboard.greeting", { username })}</h1>
		{:else if titleKey}
			<h1 class="title truncate">{$t(titleKey)}</h1>
		{:else}
			<span class="title truncate">RasenBürosport</span>
		{/if}
	</div>

	<div class="flex items-center gap-3 shrink-0">
		<span class="week">KW {week}</span>
		<a href={ROUTES.NEW_GAME} class="btn btn-primary btn-sm">
			<FootballIcon size={20} />
			{$t("nav.new_game")}
		</a>
		<button
			type="button"
			onclick={() => (menuOpen = true)}
			class="rounded-[var(--radius-avatar)]"
			aria-label={$t("nav.settings")}
		>
			<PlayerAvatar player={{ name: username, avatarUrl }} size={38} self ring />
		</button>
	</div>
</header>

{#if menuOpen}
	<AccountMenu onClose={() => (menuOpen = false)} onOpenFeedback={openFeedback} />
{/if}

{#if feedbackOpen}
	<FeedbackSheet onClose={() => (feedbackOpen = false)} />
{/if}

<style>
.topbar {
	position: sticky;
	top: 0;
	z-index: 30;
	align-items: center;
	justify-content: space-between;
	gap: 16px;
	height: 68px;
	padding: 0 var(--page-gutter, 2.5rem);
	background: var(--header-bg);
	border-bottom: 1px solid var(--color-line);
	color: var(--color-ink);
}

.title {
	font-family: var(--font-title);
	font-weight: var(--title-weight);
	text-transform: var(--title-case);
	letter-spacing: var(--title-tracking);
	font-size: 26px;
	line-height: 1;
}

.week {
	font-family: var(--font-cond);
	font-weight: 700;
	font-size: 14px;
	letter-spacing: 0.03em;
	text-transform: uppercase;
	color: var(--color-muted);
}

.back {
	margin-left: -10px;
	color: inherit;
}

/* Design B: the bar dissolves into the pitch. */
:global([data-variant="b"]) .topbar {
	position: relative;
	border-bottom: 0;
	color: var(--color-on-page);
}

:global([data-variant="b"]) .title {
	font-size: 30px;
	text-shadow: var(--on-page-shadow);
}

/* On the pitch the back arrow gets a white sticker, like the KW pill. */
:global([data-variant="b"]) .back {
	margin-left: 0;
	background: var(--color-surface);
	color: var(--color-ink);
	box-shadow: var(--shadow-control);
}

:global([data-variant="b"]) .week {
	padding: 6px 12px;
	border-radius: 999px;
	background: var(--color-surface);
	color: var(--color-ink);
	letter-spacing: 0;
	text-transform: none;
	box-shadow: var(--shadow-control);
}
</style>
