<script>
import { getTranslate } from "@tolgee/svelte";
import { goto } from "$app/navigation";
import { auth } from "$lib/config/firebase.config.js";
import { updateProfile } from "firebase/auth";
import { patch } from "$lib/services/api.services.js";
import { user } from "$lib/stores/auth.stores.js";
import { ROUTES } from "$lib/constants/routes.constants.js";
import Button from "$lib/components/ui/Button.svelte";
import Input from "$lib/components/ui/Input.svelte";
import { browser } from "$app/environment";

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

<img src="/logo.png" alt="RasenBürosport Logo" class="w-40 h-auto mb-6" />

<h1 class="text-2xl font-bold text-center mb-2 text-text-primary">
	{$t("auth.invite.setup_title")}
</h1>
<p class="text-text-secondary text-sm text-center mb-8">
	{$t("auth.invite.setup_subtitle")}
</p>

<form onsubmit={handleSubmit} class="flex flex-col gap-4 w-full">
	<Input
		id="username"
		type="text"
		placeholder={$t("auth.register.username_placeholder")}
		bind:value={username}
		required
		autocomplete="username"
	/>

	{#if error}
		<p class="text-error text-sm text-center">{error}</p>
	{/if}

	<Button type="submit" {loading}>
		{$t("auth.invite.setup_title")}
	</Button>
</form>
