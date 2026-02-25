<script>
	import { getTranslate } from "@tolgee/svelte";

	let { players = [], selectedId = $bindable(""), excludeIds = [] } = $props();

	const { t } = getTranslate();

	const availablePlayers = $derived(
		players.filter((p) => !excludeIds.includes(p.id) || p.id === selectedId),
	);
</script>

<select
	bind:value={selectedId}
	class="w-full bg-bg-input border border-border rounded-lg px-3 py-2.5 text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-red appearance-none"
>
	<option value="">{$t("new_game.select_player")}</option>
	{#each availablePlayers as player (player.id)}
		<option value={player.id}>{player.username}</option>
	{/each}
</select>
