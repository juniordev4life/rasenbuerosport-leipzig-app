<script>
	import { goto } from "$app/navigation";
	import { page } from "$app/state";
	import { supabase } from "$lib/config/supabase.config.js";
	import { ROUTES } from "$lib/constants/routes.constants.js";
	import { browser } from "$app/environment";

	let error = $state("");

	$effect(() => {
		if (!browser) return;
		handleCallback();
	});

	async function handleCallback() {
		const code = page.url.searchParams.get("code");

		if (code) {
			// PKCE flow — exchange code for session
			const { error: exchangeError } =
				await supabase.auth.exchangeCodeForSession(code);

			if (exchangeError) {
				console.error("Token exchange failed:", exchangeError.message);
				error = exchangeError.message;
				setTimeout(() => goto(ROUTES.LOGIN), 3000);
				return;
			}
		}

		// Implicit flow — hash fragment tokens (#access_token=...)
		// Supabase client processes these automatically during init,
		// but we may need to wait for onAuthStateChange to fire
		const hasHashTokens = window.location.hash.includes("access_token");

		if (hasHashTokens) {
			// Wait for Supabase to process the hash fragment
			const session = await new Promise((resolve) => {
				const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
					subscription.unsubscribe();
					resolve(s);
				});
				// Timeout fallback in case the event already fired
				setTimeout(() => resolve(null), 3000);
			});

			if (session?.user) {
				redirectByUsername(session.user);
				return;
			}
		}

		// Check if user has a session now
		const {
			data: { session },
		} = await supabase.auth.getSession();

		if (session?.user) {
			redirectByUsername(session.user);
		} else {
			// No session — redirect to login
			goto(ROUTES.LOGIN);
		}
	}

	function redirectByUsername(authUser) {
		if (authUser.user_metadata?.username) {
			goto(ROUTES.DASHBOARD);
		} else {
			goto("/auth/setup");
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
