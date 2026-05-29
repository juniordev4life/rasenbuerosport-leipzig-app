<script>
import { getTranslate } from "@tolgee/svelte";
import { page } from "$app/state";
import TrophyRoom from "$lib/components/trophies/TrophyRoom.svelte";

const { t } = getTranslate();

const playerId = $derived(page.params.id);
</script>

<svelte:head>
	<title>RasenBürosport - {$t("trophies.hero.title")}</title>
</svelte:head>

<div class="mx-auto max-w-3xl">
	{#if playerId}
		<TrophyRoom {playerId} />
	{/if}
</div>
