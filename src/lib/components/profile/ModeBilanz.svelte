<script>
	import { getTranslate } from "@tolgee/svelte";

	let { bilanz1v1 = { wins: 0, losses: 0 }, bilanz2v2 = { wins: 0, losses: 0 } } = $props();

	const { t } = getTranslate();
</script>

<div class="grid grid-cols-2 gap-3">
	<div class="bg-bg-secondary border border-border rounded-lg p-4">
		<h3 class="text-sm font-medium text-text-secondary mb-3">
			{$t("profile.bilanz_1v1")}
		</h3>
		<div class="flex items-center justify-between">
			<div class="text-center">
				<p class="text-xl font-bold text-success">{bilanz1v1.wins}</p>
				<p class="text-xs text-text-secondary">{$t("profile.wins")}</p>
			</div>
			<span class="text-text-secondary text-lg">/</span>
			<div class="text-center">
				<p class="text-xl font-bold text-error">{bilanz1v1.losses}</p>
				<p class="text-xs text-text-secondary">{$t("profile.losses")}</p>
			</div>
		</div>
	</div>

	<div class="bg-bg-secondary border border-border rounded-lg p-4">
		<h3 class="text-sm font-medium text-text-secondary mb-3">
			{$t("profile.bilanz_2v2")}
		</h3>
		<div class="flex items-center justify-between">
			<div class="text-center">
				<p class="text-xl font-bold text-success">{bilanz2v2.wins}</p>
				<p class="text-xs text-text-secondary">{$t("profile.wins")}</p>
			</div>
			<span class="text-text-secondary text-lg">/</span>
			<div class="text-center">
				<p class="text-xl font-bold text-error">{bilanz2v2.losses}</p>
				<p class="text-xs text-text-secondary">{$t("profile.losses")}</p>
			</div>
		</div>
	</div>
</div>
