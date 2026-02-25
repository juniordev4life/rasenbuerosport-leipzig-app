<script>
	import { getTranslate } from "@tolgee/svelte";

	let { teams = [], selectedId = $bindable("") } = $props();

	const { t } = getTranslate();
</script>

<select
	bind:value={selectedId}
	class="w-full bg-bg-input border border-border rounded-lg px-3 py-2.5 text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-red appearance-none"
>
	<option value="">{$t("new_game.select_team")}</option>
	{#each teams as team (team.id)}
		<option value={team.id}>{team.name}</option>
	{/each}
</select>
