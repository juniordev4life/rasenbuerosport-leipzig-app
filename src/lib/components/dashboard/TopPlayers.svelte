<script>
	import { getTranslate } from "@tolgee/svelte";

	let { players = [] } = $props();

	const { t } = getTranslate();
</script>

<section>
	<h2 class="text-lg font-bold mb-3">{$t("dashboard.top_players")}</h2>

	<div class="flex flex-col gap-2">
		{#each players as player, index (player.player_id)}
			<div
				class="flex items-center justify-between bg-bg-secondary border border-border rounded-lg px-4 py-3"
			>
				<div class="flex items-center gap-3">
					<span class="text-text-secondary font-medium w-6">{index + 1}.</span>
					<span class="text-text-primary font-medium">{player.username}</span>
				</div>
				<span class="text-text-primary font-bold">
					{player.points} {$t("dashboard.points_short")}
				</span>
			</div>
		{/each}
	</div>
</section>
