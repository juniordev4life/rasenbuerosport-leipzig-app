<script>
	import { getTranslate } from "@tolgee/svelte";

	let { totalGames = 0, wins = 0, losses = 0 } = $props();

	const { t } = getTranslate();
</script>

<div class="grid grid-cols-3 gap-3">
	<div class="bg-bg-secondary border border-border rounded-lg p-3 text-center">
		<p class="text-2xl font-bold text-text-primary">{totalGames}</p>
		<p class="text-xs text-text-secondary">{$t("profile.stats_games")}</p>
	</div>
	<div class="bg-bg-secondary border border-border rounded-lg p-3 text-center">
		<p class="text-2xl font-bold text-success">{wins}</p>
		<p class="text-xs text-text-secondary">{$t("profile.stats_wins")}</p>
	</div>
	<div class="bg-bg-secondary border border-border rounded-lg p-3 text-center">
		<p class="text-2xl font-bold text-error">{losses}</p>
		<p class="text-xs text-text-secondary">{$t("profile.stats_losses")}</p>
	</div>
</div>
