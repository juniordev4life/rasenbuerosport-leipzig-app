<script>
import { getTranslate } from "@tolgee/svelte";
import { tolgee } from "$lib/config/i18n.config.js";
import { orderedCategories } from "$lib/constants/trophies.constants.js";
import { getPlayerTrophies } from "$lib/services/trophies.services.js";
import FeaturedTrophy from "./FeaturedTrophy.svelte";
import TrophyDetailSheet from "./TrophyDetailSheet.svelte";
import TrophyHero from "./TrophyHero.svelte";
import TrophyShelf from "./TrophyShelf.svelte";

/**
 * Top-level trophy-room container. Loads the player's trophy payload
 * from the Playmaker, slices it into the category shelves and renders
 * hero, "Zuletzt erhalten" and shelves. Tapping any trophy opens the
 * detail sheet. Phones stack the blocks; from `lg` the hero and the
 * latest unlock share the first row and the shelves become grids.
 *
 * Locale is read from the Tolgee instance reactively so the dates
 * inside cards re-render on language change.
 *
 * @type {{ playerId: string }}
 */
let { playerId } = $props();

const { t } = getTranslate();

let payload = $state(null);
let loading = $state(true);
let errorMessage = $state(null);
let selectedTrophy = $state(null);

let currentLanguage = $state(tolgee.getLanguage());

$effect(() => {
	const updateLanguage = () => {
		currentLanguage = tolgee.getLanguage();
	};
	tolgee.on("language", updateLanguage);
});

const locale = $derived(currentLanguage === "de" ? "de-DE" : "en-US");

$effect(() => {
	if (!playerId) return;
	loading = true;
	errorMessage = null;
	getPlayerTrophies(playerId)
		.then((data) => {
			payload = data;
		})
		.catch((error) => {
			errorMessage = error?.message ?? "Failed to load trophies";
		})
		.finally(() => {
			loading = false;
		});
});

const trophiesByCategory = $derived.by(() => {
	if (!payload?.trophies) return {};
	const groups = {};
	for (const trophy of payload.trophies) {
		if (!groups[trophy.category]) groups[trophy.category] = [];
		groups[trophy.category].push(trophy);
	}
	return groups;
});

const latestDef = $derived.by(() => {
	if (!payload?.latest) return null;
	return payload.trophies.find((trophy) => trophy.id === payload.latest.id);
});

function handleSelect(trophy) {
	selectedTrophy = trophy;
}

function handleClose() {
	selectedTrophy = null;
}
</script>

{#if loading}
	<div class="flex justify-center py-16">
		<span class="spinner" role="status" aria-label={$t("common.loading")}></span>
	</div>
{:else if errorMessage}
	<div class="card notice text-loss" role="alert">
		<p class="m-0 font-bold">{$t("trophies.error.load_failed")}</p>
		<p class="error-detail">{errorMessage}</p>
	</div>
{:else if payload}
	<div class="room">

		<div class="hero-slot" class:wide={!payload.latest}>
			<TrophyHero summary={payload.summary} />
		</div>

		{#if payload.latest}
			<div class="featured-slot">
				<FeaturedTrophy latest={payload.latest} trophyDef={latestDef} {locale} />
			</div>
		{/if}

		{#each orderedCategories() as category (category)}
			{#if trophiesByCategory[category]?.length}
				<div class="shelf-slot">
					<TrophyShelf
						{category}
						trophies={trophiesByCategory[category]}
						{locale}
						onSelect={handleSelect}
					/>
				</div>
			{/if}
		{/each}
	</div>

	{#if selectedTrophy}
		<TrophyDetailSheet
			trophy={selectedTrophy}
			{locale}
			onClose={handleClose}
		/>
	{/if}
{/if}

<style>
.room {
	display: flex;
	flex-direction: column;
	gap: var(--stack-gap);
	padding-bottom: 8px;
}

.error-detail {
	font-size: 12px;
	color: var(--color-muted);
}

@media (min-width: 1024px) {
	.room {
		display: grid;
		grid-template-columns: repeat(12, minmax(0, 1fr));
		align-items: start;
		padding-bottom: 32px;
	}

	.hero-slot {
		grid-column: span 7;
		align-self: stretch;
	}

	.hero-slot.wide,
	.shelf-slot {
		grid-column: 1 / -1;
	}

	.featured-slot {
		grid-column: span 5;
	}
}
</style>
