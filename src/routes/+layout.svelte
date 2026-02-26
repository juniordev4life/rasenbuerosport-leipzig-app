<script>
	import "../app.css";
	import { TolgeeProvider } from "@tolgee/svelte";
	import { tolgee } from "$lib/config/i18n.config.js";
	import { supabase } from "$lib/config/supabase.config.js";
	import { user, session, isLoading } from "$lib/stores/auth.stores.js";
	import { goto } from "$app/navigation";
	import { page } from "$app/state";
	import { ROUTES } from "$lib/constants/routes.constants.js";
	import { browser } from "$app/environment";

	let { children } = $props();

	// Register service worker for PWA
	$effect(() => {
		if (browser && "serviceWorker" in navigator) {
			navigator.serviceWorker.register("/service-worker.js").catch((err) => {
				console.error("SW registration failed:", err);
			});
		}
	});

	$effect(() => {
		supabase.auth
			.getSession()
			.then(({ data: { session: s } }) => {
				session.set(s);
				user.set(s?.user ?? null);
			})
			.catch(() => {
				session.set(null);
				user.set(null);
			})
			.finally(() => {
				isLoading.set(false);
			});

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, s) => {
			session.set(s);
			user.set(s?.user ?? null);

			if (!s && page.url.pathname.startsWith("/app")) {
				goto(ROUTES.LOGIN);
			}

			// Redirect to setup if user has no username yet (invited but not set up)
			if (
				s?.user &&
				!s.user.user_metadata?.username &&
				!page.url.pathname.startsWith("/auth/setup")
			) {
				goto("/auth/setup");
			}
		});

		return () => subscription.unsubscribe();
	});
</script>

<TolgeeProvider {tolgee}>
	{#if $isLoading}
		<div
			class="min-h-screen bg-bg-primary flex items-center justify-center"
		>
			<div
				class="animate-spin h-8 w-8 border-2 border-accent-red border-t-transparent rounded-full"
			></div>
		</div>
	{:else}
		{@render children()}
	{/if}
</TolgeeProvider>
