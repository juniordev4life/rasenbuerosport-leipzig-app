<script>
	import { getTranslate } from "@tolgee/svelte";

	const { t } = getTranslate();
</script>

<svelte:head>
	<title>RasenBürosport - {$t("pages.profile.title")}</title>
</svelte:head>

<div class="flex flex-col items-center justify-center py-20">
	<h1 class="text-2xl font-bold mb-2">{$t("pages.profile.title")}</h1>
	<p class="text-text-secondary">{$t("pages.profile.coming_soon")}</p>
</div>
