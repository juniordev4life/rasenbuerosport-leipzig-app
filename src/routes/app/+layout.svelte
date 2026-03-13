<script>
import Header from "$lib/components/layout/Header.svelte";
import BottomNav from "$lib/components/layout/BottomNav.svelte";
import Sidebar from "$lib/components/layout/Sidebar.svelte";
import { get } from "$lib/services/api.services.js";
import { logout } from "$lib/services/auth.services.js";
import { auth } from "$lib/config/firebase.config.js";
import { goto } from "$app/navigation";
import { ROUTES } from "$lib/constants/routes.constants.js";
import { browser } from "$app/environment";

let { children } = $props();
let authorized = $state(false);
let checking = $state(true);

// Verify user is authorized (has a profile in the database)
$effect(() => {
	if (!browser) return;

	get("/v1/auth/me")
		.then(() => {
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

		<div class="flex flex-col flex-1 pb-16 lg:pb-0">
			<Header />
			<main class="flex-1 px-4 lg:px-8 py-2 lg:py-6 max-w-lg lg:max-w-4xl mx-auto w-full">
				{@render children()}
			</main>
		</div>

		<BottomNav />
	</div>
{/if}
