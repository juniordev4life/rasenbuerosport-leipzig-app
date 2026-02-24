<script>
	import { getTranslate } from "@tolgee/svelte";
	import { goto } from "$app/navigation";
	import Button from "$lib/components/ui/Button.svelte";
	import Input from "$lib/components/ui/Input.svelte";
	import { register } from "$lib/services/auth.services.js";
	import { ROUTES } from "$lib/constants/routes.constants.js";

	const { t } = getTranslate();

	let username = $state("");
	let email = $state("");
	let password = $state("");
	let passwordConfirm = $state("");
	let loading = $state(false);
	let error = $state("");

	async function handleSubmit(e) {
		e.preventDefault();
		error = "";

		if (password !== passwordConfirm) {
			error = $t("auth.errors.passwords_mismatch");
			return;
		}

		loading = true;

		try {
			await register({ email, password, username });
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
		id="username"
		type="text"
		placeholder={$t("auth.register.username_placeholder")}
		bind:value={username}
		required
		autocomplete="username"
	/>

	<Input
		id="email"
		type="email"
		placeholder={$t("auth.register.email_placeholder")}
		bind:value={email}
		required
		autocomplete="email"
	/>

	<Input
		id="password"
		type="password"
		placeholder={$t("auth.register.password_placeholder")}
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
		{$t("auth.register.submit")}
	</Button>

	<p class="text-text-secondary text-sm text-center">
		{$t("auth.register.has_account")}
		<a
			href={ROUTES.LOGIN}
			class="text-text-primary underline hover:text-accent-red-light transition-colors"
		>
			{$t("auth.register.login_link")}
		</a>
	</p>
</form>
