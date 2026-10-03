<script>
import { getTranslate } from "@tolgee/svelte";
import { updateProfile } from "firebase/auth";
import { browser } from "$app/environment";
import { goto } from "$app/navigation";
import Button from "$lib/components/ui/Button.svelte";
import Input from "$lib/components/ui/Input.svelte";
import { auth } from "$lib/config/firebase.config.js";
import { ROUTES } from "$lib/constants/routes.constants.js";
import { patch } from "$lib/services/api.services.js";
import { user } from "$lib/stores/auth.stores.js";

const { t } = getTranslate();

let username = $state("");
let loading = $state(false);
let error = $state("");

// Pre-fill username from Google displayName
$effect(() => {
	if (!browser) return;
	if (!$user) {
		goto(ROUTES.LOGIN);
	} else if ($user.displayName && !username) {
		username = $user.displayName;
	}
});

async function handleSubmit(e) {
	e.preventDefault();
	error = "";

	if (!username.trim()) {
		error = $t("auth.errors.generic");
		return;
	}

	loading = true;

	try {
		// Update Firebase Auth displayName
		await updateProfile(auth.currentUser, {
			displayName: username.trim(),
		});

		// Create/update profile in backend
		await patch("/v1/auth/profile", { username: username.trim() });

		goto(ROUTES.DASHBOARD);
	} catch (err) {
		error = err.message || $t("auth.errors.generic");
	} finally {
		loading = false;
	}
}
</script>

<svelte:head>
	<title>RasenBürosport - {$t("auth.invite.setup_title")}</title>
</svelte:head>

<div class="intro">
	<h1 class="page-title title">{$t("auth.invite.setup_title")}</h1>
	<p class="subtitle">{$t("auth.invite.setup_subtitle")}</p>
</div>

<form onsubmit={handleSubmit} class="setup-form">
	<div class="w-full">
		<Input
			id="username"
			type="text"
			label={$t("auth.register.username_placeholder")}
			placeholder={$t("auth.register.username_placeholder")}
			bind:value={username}
			required
			autocomplete="username"
		/>
	</div>

	{#if error}
		<p class="error" role="alert">{error}</p>
	{/if}

	<Button type="submit" {loading}>
		{$t("auth.invite.setup_title")}
	</Button>
</form>

<style>
.intro {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.title {
	margin: 0;
	font-size: 32px;
	color: var(--color-ink);
}

.subtitle {
	margin: 0;
	font-size: 14px;
	line-height: 1.4;
	color: var(--color-muted);
}

.setup-form {
	display: flex;
	flex-direction: column;
	gap: 16px;
	width: 100%;
	text-align: left;
}

.error {
	margin: 0;
	font-size: 14px;
	font-weight: 500;
	line-height: 1.4;
	text-align: center;
	color: var(--color-loss);
}
</style>
