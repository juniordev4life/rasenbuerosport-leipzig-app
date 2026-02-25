<script>
	import { getTranslate } from "@tolgee/svelte";

	let { winRate = 0 } = $props();

	const { t } = getTranslate();
</script>

<div class="bg-bg-secondary border border-border rounded-lg p-4">
	<h3 class="text-sm font-medium text-text-secondary mb-2">
		{$t("profile.win_rate")}
	</h3>
	<div class="flex items-center gap-3">
		<span class="text-3xl font-bold text-text-primary">{winRate}%</span>
		<div class="flex-1">
			<div class="w-full bg-bg-input rounded-full h-3">
				<div
					class="bg-accent-red h-3 rounded-full transition-all duration-500"
					style="width: {winRate}%"
				></div>
			</div>
		</div>
	</div>
</div>
