<script>
import { getTranslate } from "@tolgee/svelte";
import { goto } from "$app/navigation";
import { ROUTES } from "$lib/constants/routes.constants.js";
import { get } from "$lib/services/api.services.js";
import { loginWithGoogle, logout } from "$lib/services/auth.services.js";

/**
 * Google sign-in button plus its error line. A user without a profile
 * goes to the setup page, everyone else to the dashboard; an account the
 * API rejects (403 "User not authorized") is signed out — never deleted.
 */

const { t } = getTranslate();

let loading = $state(false);
let error = $state("");

async function handleGoogleLogin() {
	error = "";
	loading = true;

	try {
		await loginWithGoogle();

		const { data } = await get("/v1/auth/me");

		goto(data?.needsSetup ? ROUTES.SETUP : ROUTES.DASHBOARD);
	} catch (err) {
		if (err.code === "auth/popup-closed-by-user") return;

		// The backend rejected the account: sign out only. Never delete the
		// Firebase account — after a wrong rejection the next sign-in would
		// get a new uid and lose the link to the profile and match history.
		if (err.message === "User not authorized") {
			error = $t("auth.errors.not_authorized");
			await logout();
		} else {
			error = err.message || $t("auth.errors.generic");
		}
	} finally {
		loading = false;
	}
}
</script>

<div class="login">
	<button
		type="button"
		onclick={handleGoogleLogin}
		disabled={loading}
		class="btn btn-lg google"
	>
		{#if loading}
			<span class="spinner spinner-sm busy" aria-hidden="true"></span>
		{:else}
			<img src="/images/google-g.svg" alt="" width="20" height="20" class="g-logo" />
		{/if}
		{$t("auth.login.google_button")}
	</button>

	{#if error}
		<p class="error" role="alert">{error}</p>
	{/if}
</div>

<style>
.login {
	display: flex;
	flex-direction: column;
	gap: 12px;
	width: 100%;
}

/* Google's light button: white, outlined, the coloured G. */
.google {
	width: 100%;
	background: var(--color-surface);
	color: var(--color-ink);
	box-shadow: inset 0 0 0 1px var(--color-navy);
}

.google:hover:not(:disabled) {
	background: var(--color-sunken);
}

/* Signing in: keep the look, dim it, show the ring. */
.google:disabled {
	opacity: 0.7;
	cursor: progress;
}

.g-logo {
	width: 20px;
	height: 20px;
	flex-shrink: 0;
}

/* The ring takes the button's text colour. */
.busy {
	--spinner-color: currentColor;
}

.error {
	margin: 0;
	font-size: 14px;
	font-weight: 500;
	line-height: 1.4;
	color: var(--color-loss);
}

:global([data-variant="b"]) .google {
	box-shadow:
		inset 0 0 0 1px var(--color-line),
		var(--shadow-control);
}
</style>
