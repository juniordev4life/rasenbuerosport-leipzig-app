<script>
	import "../app.css";
	import { TolgeeProvider } from "@tolgee/svelte";
	import { tolgee } from "$lib/config/i18n.config.js";
	import { supabase } from "$lib/config/supabase.config.js";
	import { user, session, isLoading } from "$lib/stores/auth.stores.js";
	import { goto } from "$app/navigation";
	import { page } from "$app/state";
	import { ROUTES } from "$lib/constants/routes.constants.js";

	let { children } = $props();

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
