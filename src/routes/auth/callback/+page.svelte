<script>
import { getTranslate } from "@tolgee/svelte";
import { getRedirectResult } from "firebase/auth";
import { browser } from "$app/environment";
import { goto } from "$app/navigation";
import { auth } from "$lib/config/firebase.config.js";
import { ROUTES } from "$lib/constants/routes.constants.js";

const { t } = getTranslate();

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

<div class="callback">
	{#if error}
		<p class="error" role="alert">{error}</p>
	{:else}
		<span class="spinner" role="status" aria-label={$t("common.loading")}></span>
	{/if}
</div>

<style>
.callback {
	display: flex;
	align-items: center;
	justify-content: center;
	min-height: 96px;
}

.error {
	margin: 0;
	font-size: 14px;
	font-weight: 500;
	line-height: 1.4;
	color: var(--color-loss);
}
</style>
