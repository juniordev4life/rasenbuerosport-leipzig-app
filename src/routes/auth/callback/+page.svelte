<script>
import { goto } from "$app/navigation";
import { auth } from "$lib/config/firebase.config.js";
import { getRedirectResult } from "firebase/auth";
import { ROUTES } from "$lib/constants/routes.constants.js";
import { browser } from "$app/environment";

let error = $state("");

$effect(() => {
	if (!browser) return;
	handleCallback();
});

async function handleCallback() {
	try {
		// Handle redirect result (if signInWithRedirect was used)
		const result = await getRedirectResult(auth);

		if (result?.user) {
			goto(ROUTES.DASHBOARD);
			return;
		}

		// If no redirect result, check if user is already signed in
		if (auth.currentUser) {
			goto(ROUTES.DASHBOARD);
		} else {
			goto(ROUTES.LOGIN);
		}
	} catch (err) {
		console.error("Auth callback failed:", err);
		error = err.message;
		setTimeout(() => goto(ROUTES.LOGIN), 3000);
	}
}
</script>

<div class="min-h-screen bg-bg-primary flex items-center justify-center">
	{#if error}
		<p class="text-error text-sm text-center px-6">{error}</p>
	{:else}
		<div
			class="animate-spin h-8 w-8 border-2 border-accent-red border-t-transparent rounded-full"
		></div>
	{/if}
</div>
