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
 * from the Playmaker, slices it into 9 category-buckets, and renders
 * the hero / featured / shelf stack. Tapping any trophy opens the
 * detail sheet.
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
	<div class="loading">
		<div
			class="animate-spin h-8 w-8 border-2 border-accent-red border-t-transparent rounded-full"
		></div>
	</div>
{:else if errorMessage}
	<div class="error">
		<p>{t("trophies.error.load_failed")}</p>
		<p class="error-detail">{errorMessage}</p>
	</div>
{:else if payload}
	<TrophyHero summary={payload.summary} />

	{#if payload.latest}
		<FeaturedTrophy latest={payload.latest} trophyDef={latestDef} {locale} />
	{/if}

	{#each orderedCategories() as category (category)}
		{#if trophiesByCategory[category]?.length}
			<TrophyShelf
				{category}
				trophies={trophiesByCategory[category]}
				{locale}
				onSelect={handleSelect}
			/>
		{/if}
	{/each}

	{#if selectedTrophy}
		<TrophyDetailSheet
			trophy={selectedTrophy}
			{locale}
			onClose={handleClose}
		/>
	{/if}
{/if}

<style>
	.loading {
		display: flex;
		justify-content: center;
		padding: 60px 0;
	}
	.error {
		background: rgba(220, 38, 38, 0.08);
		border: 1px solid rgba(220, 38, 38, 0.3);
		border-radius: 12px;
		padding: 16px;
		color: #fca5a5;
		text-align: center;
		font-size: 13px;
	}
	.error-detail {
		font-size: 11px;
		color: #9ca3af;
		margin-top: 6px;
	}
</style>
