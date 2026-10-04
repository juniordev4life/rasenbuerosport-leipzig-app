<script>
import { getTranslate } from "@tolgee/svelte";
import TrophyMedal from "./TrophyMedal.svelte";
import TrophyRarityChip from "./TrophyRarityChip.svelte";
import TrophySectionHead from "./TrophySectionHead.svelte";

/**
 * "Zuletzt erhalten": the player's most recent unlock with its medal,
 * rarity, name, description and date. Shown only when `latest` is set.
 * Design A: square tier tile, display-type name. Design B: a large
 * metallic disc on a white sticker.
 *
 * @type {{
 *   latest: { id: string, name: string, rarity: string, unlockedAt: string },
 *   trophyDef?: object | undefined,
 *   locale?: string,
 * }}
 */
let { latest, trophyDef, locale = "de-DE" } = $props();

const { t } = getTranslate();

const uid = $props.id();
const headingId = `trophy-featured-${uid}`;

const dateText = $derived(
	new Date(latest.unlockedAt).toLocaleDateString(locale, {
		year: "numeric",
		month: "long",
		day: "numeric",
	}),
);
</script>

<section class="featured" aria-labelledby={headingId}>
	<TrophySectionHead id={headingId} title={$t("trophies.featured.tag")} />
	<div class="card body">
		<TrophyMedal
			rarity={latest.rarity}
			category={trophyDef?.category ?? "special"}
		/>
		<div class="info">
			<TrophyRarityChip rarity={latest.rarity} />
			<h3 class="page-title name">{latest.name}</h3>
			{#if trophyDef?.description}
				<p class="desc">{trophyDef.description}</p>
			{/if}
			<p class="date">{$t("trophies.featured.earned_on")} {dateText}</p>
		</div>
	</div>
</section>

<style>
.featured {
	display: flex;
	flex-direction: column;
	gap: 10px;
	min-width: 0;
}

/* ── Design A ───────────────────────────────────────────────────────── */
.body {
	--medal-size: 72px;
	display: flex;
	align-items: center;
	gap: 16px;
	padding: 16px;
}

.info {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 6px;
	min-width: 0;
}

.name {
	margin: 0;
	font-size: 26px;
	overflow-wrap: anywhere;
}

.desc {
	margin: 0;
	font-size: 14px;
	line-height: 1.35;
}

.date {
	margin: 0;
	font-size: 12px;
	color: var(--color-muted);
}

/* ── Design B ───────────────────────────────────────────────────────── */
:global([data-variant="b"]) .body {
	--medal-size: 76px;
}

:global([data-variant="b"]) .info {
	gap: 4px;
}

:global([data-variant="b"]) .name {
	font-size: 24px;
}
</style>
