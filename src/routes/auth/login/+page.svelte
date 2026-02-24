<script>
	import { getTranslate } from "@tolgee/svelte";
	import { page } from "$app/state";
	import LoginForm from "$lib/components/auth/LoginForm.svelte";
	import { ROUTES } from "$lib/constants/routes.constants.js";

	const { t } = getTranslate();
</script>

<svelte:head>
	<title>RasenBürosport - {$t("auth.login.submit")}</title>
</svelte:head>

<img src="/logo.png" alt="RasenBürosport Logo" class="w-40 h-auto mb-6" />

<h1 class="text-2xl font-bold text-center mb-1">
	{$t("auth.login.title")}
</h1>
<p class="text-3xl font-extrabold text-center mb-8">
	<span class="text-accent-red">Rasen</span><span class="text-silver"
		>Bürosport</span
	>
</p>

<LoginForm />
