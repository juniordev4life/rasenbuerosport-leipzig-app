<script>
import { getTranslate } from "@tolgee/svelte";
import { browser } from "$app/environment";
import { page } from "$app/state";
import PlusIcon from "$lib/components/icons/PlusIcon.svelte";
import AccountMenu from "$lib/components/layout/AccountMenu.svelte";
import FeedbackSheet from "$lib/components/ui/FeedbackSheet.svelte";
import { ROUTES } from "$lib/constants/routes.constants.js";
import { user } from "$lib/stores/auth.stores.js";
import { theme } from "$lib/stores/theme.stores.js";
import { getPageTitleKey } from "$lib/utils/pageTitle.utils.js";

/**
 * Desktop-only top bar (hidden below `lg`, where the mobile `Header`
 * takes over). Owns the current page title, a quick theme toggle, the
 * primary "new game" CTA and the avatar → account menu. Reuses the same
 * AccountMenu / FeedbackSheet overlays as the mobile Header.
 */

const { t } = getTranslate();

let menuOpen = $state(false);
let feedbackOpen = $state(false);

const isDashboard = $derived(page.url.pathname === ROUTES.DASHBOARD);
const titleKey = $derived(getPageTitleKey(page.url.pathname));
const username = $derived($user?.user_metadata?.username || "User");

// Resolve the currently-applied appearance so the toggle shows the
// opposite affordance (sun while dark, moon while light). `system`
// falls back to the OS preference.
const isDark = $derived.by(() => {
	if ($theme === "dark") return true;
	if ($theme === "light") return false;
	return browser && window.matchMedia("(prefers-color-scheme: dark)").matches;
});

/** Flip to an explicit light/dark theme (leaves `system` behind by design). */
function toggleTheme() {
	theme.set(isDark ? "light" : "dark");
}

/**
 * Close the AccountMenu first, then open the FeedbackSheet on the next
 * tick — same de-jank pause the mobile Header uses so the two overlays
 * don't animate simultaneously.
 */
function openFeedback() {
	menuOpen = false;
	setTimeout(() => {
		feedbackOpen = true;
	}, 80);
}
</script>

<header
	class="hidden lg:flex items-center justify-between gap-4 sticky top-0 z-30 h-16 px-10 xl:px-12 bg-bg-primary/85 backdrop-blur-md border-b border-border"
>
	{#if isDashboard}
		<h1 class="text-lg font-bold text-text-primary truncate">
			{$t("dashboard.greeting", { username })}
		</h1>
	{:else if titleKey}
		<h1 class="text-lg font-bold text-text-primary truncate">{$t(titleKey)}</h1>
	{:else}
		<span class="text-lg font-bold text-text-primary truncate">RasenBürosport</span>
	{/if}

	<div class="flex items-center gap-2 shrink-0">
		<button
			type="button"
			onclick={toggleTheme}
			class="w-9 h-9 rounded-lg flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-bg-input transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-red"
			aria-label={$t("common.toggle_theme")}
		>
			{#if isDark}
				<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
				</svg>
			{:else}
				<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
				</svg>
			{/if}
		</button>

		<a
			href={ROUTES.NEW_GAME}
			class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-red text-white font-medium text-sm hover:bg-accent-red-hover transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-red"
		>
			<PlusIcon size={18} strokeWidth={2.4} />
			{$t("nav.new_game")}
		</a>

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
