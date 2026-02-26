<script>
	import { getTranslate } from "@tolgee/svelte";
	import { goto } from "$app/navigation";
	import { supabase } from "$lib/config/supabase.config.js";
	import { user } from "$lib/stores/auth.stores.js";
	import { ROUTES } from "$lib/constants/routes.constants.js";
	import Button from "$lib/components/ui/Button.svelte";
	import Input from "$lib/components/ui/Input.svelte";
	import { browser } from "$app/environment";

	const { t } = getTranslate();

	let username = $state("");
	let password = $state("");
	let passwordConfirm = $state("");
	let loading = $state(false);
	let error = $state("");

	// Guard: redirect if not logged in or already set up
	$effect(() => {
		if (!browser) return;
		if (!$user) {
			goto(ROUTES.LOGIN);
		} else if ($user.user_metadata?.username) {
			goto(ROUTES.DASHBOARD);
		}
	});

	async function handleSubmit(e) {
		e.preventDefault();
		error = "";

		if (password !== passwordConfirm) {
			error = $t("auth.errors.passwords_mismatch");
			return;
		}

		loading = true;

		try {
			const { error: updateError } = await supabase.auth.updateUser({
				password,
				data: { username },
			});

			if (updateError) throw updateError;

			// Ensure profile exists with correct username
			const {
				data: { user: currentUser },
			} = await supabase.auth.getUser();

			if (currentUser) {
				await supabase.from("profiles").upsert(
					{
						id: currentUser.id,
						username,
					},
					{ onConflict: "id" },
				);
			}

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

	<Input
		id="password"
		type="password"
		placeholder={$t("auth.invite.set_password")}
		bind:value={password}
		required
		autocomplete="new-password"
	/>

	<Input
		id="password-confirm"
		type="password"
		placeholder={$t("auth.register.password_confirm_placeholder")}
		bind:value={passwordConfirm}
		required
		autocomplete="new-password"
	/>

	{#if error}
		<p class="text-error text-sm text-center">{error}</p>
	{/if}

	<Button type="submit" {loading}>
		{$t("auth.invite.setup_title")}
	</Button>
</form>
