<script>
	import { getTranslate } from "@tolgee/svelte";
	import { goto } from "$app/navigation";
	import Button from "$lib/components/ui/Button.svelte";
	import Input from "$lib/components/ui/Input.svelte";
	import { login } from "$lib/services/auth.services.js";
	import { ROUTES } from "$lib/constants/routes.constants.js";

	const { t } = getTranslate();

	let email = $state("");
	let password = $state("");
	let loading = $state(false);
	let error = $state("");

	async function handleSubmit(e) {
		e.preventDefault();
		error = "";
		loading = true;

		try {
			await login({ email, password });
			goto(ROUTES.DASHBOARD);
		} catch (err) {
			error = err.message || $t("auth.errors.generic");
		} finally {
			loading = false;
		}
	}
</script>

<form onsubmit={handleSubmit} class="flex flex-col gap-4 w-full">
	<Input
		id="email"
		type="email"
		placeholder={$t("auth.login.email_placeholder")}
		label={$t("auth.login.email_label")}
		bind:value={email}
		required
		autocomplete="email"
	/>

	<Input
		id="password"
		type="password"
		placeholder={$t("auth.login.password_placeholder")}
		label={$t("auth.login.password_label")}
		bind:value={password}
		required
		autocomplete="current-password"
	/>

	{#if error}
		<p class="text-error text-sm text-center">{error}</p>
	{/if}

	<Button type="submit" {loading}>
		{$t("auth.login.submit")}
	</Button>

	<p class="text-text-secondary text-[11px] text-center">
		{$t("auth.invite.ask_admin")}
	</p>
</form>
