<script>
import { getTranslate } from "@tolgee/svelte";
import { page } from "$app/state";
import AccountMenu from "$lib/components/layout/AccountMenu.svelte";
import FeedbackSheet from "$lib/components/ui/FeedbackSheet.svelte";
import PlayerAvatar from "$lib/components/ui/PlayerAvatar.svelte";
import { user } from "$lib/stores/auth.stores.js";
import { isoWeek } from "$lib/utils/isoWeek.utils.js";

/**
 * Mobile top bar (hidden from `lg`, where Sidebar + Topbar take over).
 * Design A: white bar with the app crest on the right. Design B: the
 * greeting straight on the pitch with a calendar-week pill.
 * The avatar opens the account menu; deeper pages get a back button.
 */

const { t } = getTranslate();

let menuOpen = $state(false);
let feedbackOpen = $state(false);

const username = $derived($user?.user_metadata?.username || "User");
const avatarUrl = $derived($user?.user_metadata?.avatar_url || null);
const week = isoWeek(new Date());

/**
 * Close the AccountMenu first, then open the FeedbackSheet on the next
 * tick, so the two overlays don't animate at the same time.
 */
function openFeedback() {
	menuOpen = false;
	setTimeout(() => {
		feedbackOpen = true;
	}, 80);
}

/** The four bottom-nav tabs: no back button there. */
const ROOT_ROUTES = new Set([
	"/app/dashboard",
	"/app/leaderboard",
	"/app/history",
	"/app/profile",
]);

const showBack = $derived.by(() => {
	const path = page.url?.pathname ?? "";
	if (!path.startsWith("/app/")) return false;
	return !ROOT_ROUTES.has(path);
});

function goBack() {
	// history.back keeps deep links from other apps working; the fallback
	// covers a page opened directly.
	if (typeof history !== "undefined" && history.length > 1) {
		history.back();
		return;
	}
	window.location.assign("/app/dashboard");
}
</script>

<header class="app-header">
	<div class="flex items-center gap-3 min-w-0">
		{#if showBack}
			<button
				type="button"
				onclick={goBack}
				class="back"
				aria-label={$t("common.back")}
			>
				<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
					<path d="M15 19l-7-7 7-7" />
				</svg>
			</button>
		{/if}
		<button
			type="button"
			onclick={() => (menuOpen = true)}
			class="shrink-0 rounded-[var(--radius-avatar)]"
			aria-label={$t("nav.settings")}
		>
			<PlayerAvatar
				player={{ name: username, avatarUrl }}
				size={42}
				self
				ring
			/>
		</button>
		<div class="flex flex-col min-w-0">
			<span class="eyebrow">RasenBürosport</span>
			<span class="greeting truncate">
				{$t("dashboard.greeting", { username })}
			</span>
		</div>
	</div>

	<img src="/logo.png" alt="RasenBürosport Leipzig" class="crest" width="56" height="56" />
	<span class="week">KW {week}</span>
</header>

{#if menuOpen}
	<AccountMenu onClose={() => (menuOpen = false)} onOpenFeedback={openFeedback} />
{/if}

{#if feedbackOpen}
	<FeedbackSheet onClose={() => (feedbackOpen = false)} />
{/if}

<style>
.app-header {
	position: relative;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	min-height: 72px;
	padding: calc(env(safe-area-inset-top) + 8px) 16px 8px;
	background: var(--header-bg);
	color: var(--color-ink);
}

.back {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 36px;
	height: 36px;
	margin-left: -8px;
	border-radius: var(--radius-control);
	color: inherit;
}

.eyebrow {
	font-family: var(--font-cond);
	font-weight: 700;
	font-size: 12px;
	letter-spacing: 0.03em;
	text-transform: uppercase;
	color: var(--color-brand);
}

.greeting {
	font-weight: 700;
	font-size: 17px;
	line-height: 1.2;
}

.crest {
	width: 56px;
	height: 56px;
	margin: -6px 0;
	object-fit: contain;
	flex-shrink: 0;
}

.week {
	display: none;
}

/* Design B: the greeting stands on the pitch. */
:global([data-variant="b"]) .app-header {
	color: var(--color-on-page);
}

:global([data-variant="b"]) .eyebrow,
:global([data-variant="b"]) .crest {
	display: none;
}

:global([data-variant="b"]) .greeting {
	font-family: var(--font-cond);
	font-weight: 800;
	font-size: 24px;
	text-shadow: var(--on-page-shadow);
}

:global([data-variant="b"]) .week {
	display: inline-flex;
	flex-shrink: 0;
	padding: 6px 12px;
	border-radius: 999px;
	background: var(--color-surface);
	color: var(--color-ink);
	font-family: var(--font-cond);
	font-weight: 700;
	font-size: 14px;
	box-shadow: var(--shadow-control);
}

/* Phone layout only; the desktop shell uses Sidebar + Topbar. Set here, not
 * with `lg:hidden`: this component's own display rule would win. */
@media (min-width: 1024px) {
	.app-header {
		display: none;
	}
}
</style>
