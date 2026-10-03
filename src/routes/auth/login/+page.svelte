<script>
import { getTranslate } from "@tolgee/svelte";
import LoginForm from "$lib/components/auth/LoginForm.svelte";

const { t } = getTranslate();
</script>

<svelte:head>
	<title>RasenBürosport - {$t("auth.login.submit")}</title>
</svelte:head>

<h1 class="welcome">
	<span class="label kicker">{$t("auth.login.title")}</span>
	<span class="page-title brand-name">{$t("auth.login.brand")}</span>
</h1>

<LoginForm />

<p class="hint">{$t("auth.register.email_hint")}</p>

<style>
.welcome {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8px;
	margin: 0;
}

.kicker {
	font-size: 14px;
	color: var(--color-muted);
}

.brand-name {
	font-size: clamp(30px, 10vw, 38px);
	color: var(--color-ink);
}

.hint {
	margin: 0;
	font-size: 13px;
	color: var(--color-muted);
}

:global([data-variant="b"]) .brand-name {
	font-size: 36px;
}
</style>
