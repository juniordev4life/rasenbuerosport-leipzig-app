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

<div class="stack pb-4 lg:pb-8">
	<header class="hero bleed page-hero">
		<h1 class="page-title page-hero-title">{$t("season.archive_title")}</h1>
	</header>

	{#if loading}
		<div class="flex justify-center py-12">
			<span class="spinner" role="status" aria-label={$t("common.loading")}></span>
		</div>
	{:else if archive.length === 0}
		<p class="card notice">{$t("season.no_completed")}</p>
	{:else}
		<div class="season-grid">
			{#each archive as season (season.season)}
				<SeasonPodium {season} />
			{/each}
		</div>
	{/if}
</div>

<style>
.season-grid {
	display: grid;
	gap: var(--stack-gap);
	align-items: start;
}

/* Desktop: the top bar carries the title; the podiums tile the width. */
@media (min-width: 1024px) {
	.page-hero {
		display: none;
	}

	.season-grid {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}
}

@media (min-width: 1280px) {
	.season-grid {
		grid-template-columns: repeat(3, minmax(0, 1fr));
	}
}
</style>
