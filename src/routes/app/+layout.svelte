<script>
import { browser } from "$app/environment";
import { goto } from "$app/navigation";
import { page } from "$app/state";
import BottomNav from "$lib/components/layout/BottomNav.svelte";
import Header from "$lib/components/layout/Header.svelte";
import Sidebar from "$lib/components/layout/Sidebar.svelte";
import { auth } from "$lib/config/firebase.config.js";
import { ROUTES } from "$lib/constants/routes.constants.js";
import { get } from "$lib/services/api.services.js";
import { logout } from "$lib/services/auth.services.js";

let { children } = $props();
let authorized = $state(false);
let checking = $state(true);

/** Hide the chrome (Header greeting) inside the new-game wizard so the
 *  event-entry screen has the full vertical room. */
const isImmersive = $derived(page.url.pathname.startsWith("/app/games/new"));

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
				if (auth.currentUser) {
					await auth.currentUser.delete();
				}
				await logout();
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
	<div class="min-h-screen bg-bg-primary flex items-center justify-center">
		<div
			class="animate-spin h-8 w-8 border-2 border-accent-red border-t-transparent rounded-full"
		></div>
	</div>
{:else if authorized}
	<div class="min-h-screen bg-bg-primary flex flex-col lg:flex-row">
		<Sidebar />

		<div class="flex flex-col flex-1 {isImmersive ? '' : 'pb-16 lg:pb-0'}">
			{#if !isImmersive}
				<Header />
			{/if}
			<main class="flex-1 px-4 lg:px-8 py-2 lg:py-6 max-w-lg lg:max-w-4xl mx-auto w-full">
				{@render children()}
			</main>
		</div>

		{#if !isImmersive}
			<BottomNav />
		{/if}
	</div>
{/if}
