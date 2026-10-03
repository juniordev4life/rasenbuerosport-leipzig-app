<script>
import { getTranslate } from "@tolgee/svelte";
import { browser } from "$app/environment";
import { goto } from "$app/navigation";
import { page } from "$app/state";
import BottomNav from "$lib/components/layout/BottomNav.svelte";
import Header from "$lib/components/layout/Header.svelte";
import Sidebar from "$lib/components/layout/Sidebar.svelte";
import Topbar from "$lib/components/layout/Topbar.svelte";
import PushSoftPrompt from "$lib/components/profile/PushSoftPrompt.svelte";
import SeasonRecapLauncher from "$lib/components/recap/SeasonRecapLauncher.svelte";
import { ROUTES } from "$lib/constants/routes.constants.js";
import { get } from "$lib/services/api.services.js";
import { logout } from "$lib/services/auth.services.js";

let { children } = $props();

const { t } = getTranslate();
let authorized = $state(false);
let checking = $state(true);

/** Hide the chrome (Header greeting, bottom nav) inside the new-game
 *  wizard and the full-screen season recap story so both get the full
 *  viewport to themselves. */
const isImmersive = $derived(
	page.url.pathname.startsWith("/app/games/new") ||
		page.url.pathname.startsWith("/app/recap"),
);

// Verify user is authorized (has a profile in the database)
$effect(() => {
	if (!browser) return;

	get("/v1/auth/me")
		.then(({ data }) => {
			if (data?.needsSetup) {
				goto(ROUTES.SETUP);
				return;
			}
			authorized = true;
			checking = false;
		})
		.catch(async (err) => {
			if (err.message === "User not authorized") {
				// Sign out only — never delete the Firebase account (see
				// LoginForm). Redirect even if signing out fails, so the
				// user is never left on the spinner.
				try {
					await logout();
				} catch (logoutError) {
					console.error("Sign-out failed:", logoutError);
				}
				goto(ROUTES.LOGIN);
			} else {
				// Other errors (network, etc.) — still show the app
				authorized = true;
				checking = false;
			}
		});
});
</script>

{#if checking}
	<div class="min-h-screen flex items-center justify-center">
		<div class="spinner" role="status" aria-label={$t("common.loading")}></div>
	</div>
{:else if authorized}
	<div class="app-shell min-h-screen flex flex-col lg:flex-row">
		<Sidebar />

		<div class="flex flex-col flex-1 min-w-0 {isImmersive ? '' : 'pb-28 lg:pb-0'}">
			{#if !isImmersive}
				<Header />
				<Topbar />
			{/if}
			<main class="app-main flex-1 py-2 lg:py-8 max-w-lg lg:max-w-none xl:max-w-[1400px] 2xl:max-w-[1600px] mx-auto w-full">
				{@render children()}
			</main>
		</div>

		{#if !isImmersive}
			<BottomNav />
		{/if}

		{#if !isImmersive}
			<PushSoftPrompt />
		{/if}
		<SeasonRecapLauncher />
	</div>
{/if}

<style>
/* Side gutter of the page content. Hero bands in design A use it to
 * bleed to the screen edge (`.bleed` in app.css). */
.app-shell {
	--page-gutter: 1rem;
}

.app-main {
	padding-inline: var(--page-gutter);
}

@media (min-width: 1024px) {
	.app-shell {
		--page-gutter: 2.5rem;
	}
}

@media (min-width: 1280px) {
	.app-shell {
		--page-gutter: 3rem;
	}
}
</style>
