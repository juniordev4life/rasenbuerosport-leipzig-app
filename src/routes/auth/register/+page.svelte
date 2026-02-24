<script>
	import { getTranslate } from "@tolgee/svelte";
	import { page } from "$app/state";
	import RegisterForm from "$lib/components/auth/RegisterForm.svelte";
	import { ROUTES } from "$lib/constants/routes.constants.js";

	const { t } = getTranslate();

	const isRegister = $derived(page.url.pathname === ROUTES.REGISTER);
</script>

<svelte:head>
	<title>RasenBürosport - {$t("auth.register.submit")}</title>
</svelte:head>

<img src="/logo.png" alt="RasenBürosport Logo" class="w-40 h-auto mb-6" />

<!-- Tab Navigation -->
<div class="flex w-full mb-6">
	<a
		href={ROUTES.LOGIN}
		class="flex-1 text-center pb-3 text-text-secondary border-b border-border hover:text-text-primary transition-colors"
	>
		{$t("auth.register.tab_login")}
	</a>
	<a
		href={ROUTES.REGISTER}
		class="flex-1 text-center pb-3 font-semibold text-text-primary border-b-2 border-accent-red"
	>
		{$t("auth.register.tab_register")}
	</a>
</div>

<RegisterForm />
