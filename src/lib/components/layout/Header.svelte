<script>
import { getTranslate } from "@tolgee/svelte";
import { page } from "$app/state";
import AccountMenu from "$lib/components/layout/AccountMenu.svelte";
import FeedbackSheet from "$lib/components/ui/FeedbackSheet.svelte";
import { user } from "$lib/stores/auth.stores.js";

const { t } = getTranslate();

let menuOpen = $state(false);
let feedbackOpen = $state(false);

/**
 * Close the AccountMenu first, then open the FeedbackSheet on the next
 * tick. The pause prevents the two overlays from animating in/out at
 * the same time, which looks janky on slow devices.
 */
function openFeedback() {
	menuOpen = false;
	setTimeout(() => {
		feedbackOpen = true;
	}, 80);
}

/**
 * Top-level routes from BottomNav — these are the four "home" tabs, so
 * showing a back button there doesn't make sense. Anything deeper
 * (detail pages, wizards, comparisons) gets the back arrow.
 */
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
	// Prefer history.back so deep links from other apps still get a
	// sensible fallback via the {/else} below.
	if (typeof history !== "undefined" && history.length > 1) {
		history.back();
		return;
	}
	window.location.assign("/app/dashboard");
}
</script>

<header
	class="flex items-center justify-between px-4 py-3 lg:hidden"
	style="padding-top: calc(env(safe-area-inset-top) + 0.75rem);"
>
	{#if showBack}
		<button
			type="button"
			onclick={goBack}
			class="-ml-2 inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm text-text-secondary hover:text-text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-red"
			aria-label={$t("common.back")}
		>
			<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
				<path d="M15 19l-7-7 7-7" />
			</svg>
			<span class="sr-only sm:not-sr-only">{$t("common.back")}</span>
		</button>
	{:else}
		<span></span>
	{/if}

	<div class="flex items-center gap-3">
		<span class="text-sm text-text-secondary">
			{$t("dashboard.greeting", { username: $user?.user_metadata?.username || "User" })}
		</span>
		<button
			type="button"
			onclick={() => (menuOpen = true)}
			class="w-9 h-9 rounded-full overflow-hidden ring-1 ring-border focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-red"
			aria-label={$t("nav.settings")}
		>
			{#if $user?.user_metadata?.avatar_url}
				<img
					src={$user.user_metadata.avatar_url}
					alt={$user.user_metadata.username || "Avatar"}
					class="w-full h-full object-cover"
				/>
			{:else}
				<div
					class="w-full h-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-sm font-bold text-white"
				>
					{($user?.user_metadata?.username || "U").charAt(0).toUpperCase()}
				</div>
			{/if}
		</button>
	</div>
</header>

{#if menuOpen}
	<AccountMenu onClose={() => (menuOpen = false)} onOpenFeedback={openFeedback} />
{/if}

{#if feedbackOpen}
	<FeedbackSheet onClose={() => (feedbackOpen = false)} />
{/if}
