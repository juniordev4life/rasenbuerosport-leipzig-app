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

<img src="/logo.png" alt="RasenBürosport Logo" class="w-70 h-auto mb-6" />

<LoginForm />
