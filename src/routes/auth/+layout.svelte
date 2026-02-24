<script>
	import { getTranslate } from "@tolgee/svelte";

	let { children } = $props();

	const { t } = getTranslate();
</script>

<div
	class="min-h-screen bg-bg-primary flex flex-col items-center justify-center px-6"
>
	<div class="w-full max-w-sm flex flex-col items-center">
		{@render children()}
	</div>

	<footer class="mt-12 text-text-muted text-xs">
		{$t("footer.copyright", { year: new Date().getFullYear() })}
	</footer>
</div>
