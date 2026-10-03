<script>
import "../app.css";
import { TolgeeProvider } from "@tolgee/svelte";
import { onAuthStateChanged } from "firebase/auth";
import { browser } from "$app/environment";
import { goto } from "$app/navigation";
import { page } from "$app/state";
import PitchBackground from "$lib/components/layout/PitchBackground.svelte";
import { auth } from "$lib/config/firebase.config.js";
import { tolgee } from "$lib/config/i18n.config.js";
import { ROUTES } from "$lib/constants/routes.constants.js";
import { get as apiGet } from "$lib/services/api.services.js";
import { isLoading, user } from "$lib/stores/auth.stores.js";
import {
	applyDesignVariant,
	designVariant,
} from "$lib/stores/designVariant.stores.js";

let { children } = $props();

// Design variant: keep <html data-variant>, the theme colour and the
// stored choice in sync with the store (Settings → Design).
$effect(() => {
	if (!browser) return;
	return designVariant.subscribe(applyDesignVariant);
});

// Firebase Auth state listener
$effect(() => {
	if (!browser) return;

	const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
		if (!firebaseUser) {
			user.set(null);
			isLoading.set(false);
			if (page.url.pathname.startsWith("/app")) {
				goto(ROUTES.LOGIN);
			}
			return;
		}

		// Merge Firebase user with backend profile data
		try {
			const res = await apiGet("/v1/auth/me");
			const profile = res.data;
			user.set({
				...firebaseUser,
				email: firebaseUser.email,
				role: profile.role || "user",
				user_metadata: {
					username: profile.username || firebaseUser.displayName,
					avatar_url: profile.avatar_url || firebaseUser.photoURL,
				},
			});
		} catch {
			// Fallback to Firebase-only data if backend unavailable
			user.set({
				...firebaseUser,
				email: firebaseUser.email,
				user_metadata: {
					username: firebaseUser.displayName,
					avatar_url: firebaseUser.photoURL,
				},
			});
		}
		isLoading.set(false);
	});

	return () => unsubscribe();
});
</script>

<PitchBackground />

<TolgeeProvider {tolgee}>
	{#if $isLoading}
		<div class="min-h-screen flex items-center justify-center">
			<div class="spinner" role="status" aria-label="Loading"></div>
		</div>
	{:else}
		{@render children()}
	{/if}
</TolgeeProvider>
