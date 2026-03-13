<script>
import { getTranslate } from "@tolgee/svelte";
import { goto } from "$app/navigation";
import { auth } from "$lib/config/firebase.config.js";
import { ROUTES } from "$lib/constants/routes.constants.js";
import { get } from "$lib/services/api.services.js";
import { loginWithGoogle, logout } from "$lib/services/auth.services.js";

const { t } = getTranslate();

let loading = $state(false);
let error = $state("");

async function handleGoogleLogin() {
	error = "";
	loading = true;

	try {
		await loginWithGoogle();

		// Verify user is authorized (exists in profiles table)
		await get("/v1/auth/me");

		goto(ROUTES.DASHBOARD);
	} catch (err) {
		if (err.code === "auth/popup-closed-by-user") return;

		// If backend rejects the user, delete Firebase Auth entry and sign out
		if (err.message === "User not authorized") {
			if (auth.currentUser) {
				await auth.currentUser.delete();
			}
			await logout();
			error = $t("auth.errors.not_authorized");
		} else {
			error = err.message || $t("auth.errors.generic");
		}
	} finally {
		loading = false;
	}
}
</script>

<div class="flex flex-col gap-4 w-full">
	<button
		onclick={handleGoogleLogin}
		disabled={loading}
		class="w-full py-3.5 px-6 rounded-lg font-semibold text-base transition-all duration-200 cursor-pointer
			bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:shadow-md active:scale-[0.98]
			disabled:opacity-50 disabled:cursor-not-allowed
			flex items-center justify-center gap-3"
	>
		{#if loading}
			<svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
				<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
			</svg>
		{:else}
			<svg viewBox="0 0 24 24" class="w-5 h-5 shrink-0" aria-hidden="true">
				<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
				<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
				<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
				<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
			</svg>
		{/if}
		{$t("auth.login.google_button")}
	</button>

	{#if error}
		<p class="text-error text-sm text-center">{error}</p>
	{/if}
</div>
