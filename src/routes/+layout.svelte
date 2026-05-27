<script>
import "../app.css";
import { TolgeeProvider } from "@tolgee/svelte";
import { onAuthStateChanged } from "firebase/auth";
import { browser } from "$app/environment";
import { goto } from "$app/navigation";
import { page } from "$app/state";
import { auth } from "$lib/config/firebase.config.js";
import { tolgee } from "$lib/config/i18n.config.js";
import { ROUTES } from "$lib/constants/routes.constants.js";
import { get as apiGet } from "$lib/services/api.services.js";
import { isLoading, user } from "$lib/stores/auth.stores.js";
import { theme } from "$lib/stores/theme.stores.js";

let { children } = $props();

// Register service worker for PWA
$effect(() => {
	if (browser && "serviceWorker" in navigator) {
		navigator.serviceWorker.register("/service-worker.js").catch((err) => {
			console.error("SW registration failed:", err);
		});
	}
});

// Theme: initialize from localStorage
$effect(() => {
	if (!browser) return;
	const stored = localStorage.getItem("theme");
	if (stored === "light" || stored === "dark" || stored === "system") {
		theme.set(stored);
	}
});

// Theme: apply .dark class and update meta theme-color
$effect(() => {
	if (!browser) return;

	const unsubscribe = theme.subscribe((value) => {
		localStorage.setItem("theme", value);

		const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
		const shouldBeDark =
			value === "dark" || (value === "system" && prefersDark.matches);

		document.documentElement.classList.toggle("dark", shouldBeDark);

		const meta = document.querySelector('meta[name="theme-color"]');
		if (meta)
			meta.setAttribute("content", shouldBeDark ? "#0f1219" : "#f5f7fa");
	});

	// Listen for OS theme changes when in "system" mode
	const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
	const handleChange = () => {
		let current;
		theme.subscribe((v) => (current = v))();
		if (current === "system") {
			const shouldBeDark = mediaQuery.matches;
			document.documentElement.classList.toggle("dark", shouldBeDark);
			const meta = document.querySelector('meta[name="theme-color"]');
			if (meta)
				meta.setAttribute("content", shouldBeDark ? "#0f1219" : "#f5f7fa");
		}
	};
	mediaQuery.addEventListener("change", handleChange);

	return () => {
		unsubscribe();
		mediaQuery.removeEventListener("change", handleChange);
	};
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
