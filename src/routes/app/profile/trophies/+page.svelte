<script>
import { getTranslate } from "@tolgee/svelte";
import TrophyRoom from "$lib/components/trophies/TrophyRoom.svelte";
import { user } from "$lib/stores/auth.stores.js";

const { t } = getTranslate();

const playerId = $derived($user?.uid ?? null);
</script>

<svelte:head>
	<title>RasenBürosport - {$t("trophies.hero.title")}</title>
</svelte:head>

<div class="mx-auto max-w-3xl">
	{#if playerId}
		<TrophyRoom {playerId} />
	{/if}
</div>
