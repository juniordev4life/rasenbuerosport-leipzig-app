<script>
import { getTranslate } from "@tolgee/svelte";
import SeasonPodium from "$lib/components/season/SeasonPodium.svelte";
import { get } from "$lib/services/api.services.js";

const { t } = getTranslate();

let archive = $state([]);
let loading = $state(true);

$effect(() => {
	loadArchive();
});

async function loadArchive() {
	try {
		const res = await get("/v1/seasons/archive");
		archive = res.data || [];
	} catch (err) {
		console.error("Failed to load season archive:", err);
	} finally {
		loading = false;
	}
}
</script>

<svelte:head>
	<title>RasenBürosport - {$t("season.archive_title")}</title>
</svelte:head>

<div class="flex flex-col gap-4">
	<h1 class="text-xl font-bold text-text-primary">{$t("season.archive_title")}</h1>

	{#if loading}
		<div class="flex justify-center py-8">
			<div
				class="animate-spin h-8 w-8 border-2 border-accent-red border-t-transparent rounded-full"
			></div>
		</div>
	{:else if archive.length === 0}
		<p class="text-text-secondary text-center py-8">{$t("season.no_completed")}</p>
	{:else}
		{#each archive as season (season.season)}
			<SeasonPodium {season} />
		{/each}
	{/if}
</div>
