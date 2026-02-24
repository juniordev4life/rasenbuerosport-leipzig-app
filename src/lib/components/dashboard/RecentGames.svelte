<script>
	import { getTranslate } from "@tolgee/svelte";
	import GameCard from "./GameCard.svelte";

	let { games = [] } = $props();

	const { t } = getTranslate();
</script>

<section>
	<h2 class="text-lg font-bold mb-3">{$t("dashboard.recent_games")}</h2>

	{#if games.length === 0}
		<p class="text-text-secondary text-sm text-center py-6">
			{$t("dashboard.no_games")}
		</p>
	{:else}
		<div class="flex flex-col gap-2">
			{#each games as game (game.id)}
				<GameCard {game} />
			{/each}
		</div>
	{/if}
</section>
