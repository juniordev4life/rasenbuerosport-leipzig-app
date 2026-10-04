<script>
import { getTranslate } from "@tolgee/svelte";
import { RARITY_META } from "$lib/constants/trophies.constants.js";
import TrophyMedal from "./TrophyMedal.svelte";
import TrophyRarityChip from "./TrophyRarityChip.svelte";

/**
 * One trophy tile on a shelf. The backend signals three modes:
 *   - `trophy.unlocked === true`  → earned: tier medal, rarity, date
 *   - `trophy.unlocked === false` → locked, shown with a padlock:
 *       - `trophy.masked`         → hidden, name and text suppressed
 *       - otherwise               → name visible, a progress bar when
 *                                   the backend supplies one, else a
 *                                   "not earned yet" note
 * Design A: a white card, content left-aligned, square medal. Design B:
 * a white sticker, content centred, metallic disc.
 *
 * The card is a button: a tap opens the detail sheet via `onSelect`.
 *
 * @type {{ trophy: object, locale?: string, onSelect?: (trophy: object) => void }}
 */
let { trophy, locale = "de-DE", onSelect } = $props();

const { t } = getTranslate();

const rarity = $derived(trophy.rarity);
const unlocked = $derived(trophy.unlocked === true);
const masked = $derived(trophy.masked === true);
const progress = $derived(trophy.progress ?? null);

const titleText = $derived(masked ? $t("trophies.masked.name") : trophy.name);
const descText = $derived(
	masked ? $t("trophies.masked.description") : trophy.description,
);

const dateText = $derived(
	unlocked && trophy.unlockedAt
		? new Date(trophy.unlockedAt).toLocaleDateString(locale, {
				year: "numeric",
				month: "2-digit",
				day: "2-digit",
			})
		: null,
);

/** Name, rarity and state in one line for screen readers. */
const ariaLabel = $derived.by(() => {
	const parts = [titleText];
	const rarityKey = RARITY_META[rarity]?.i18nKey;
	if (rarityKey) parts.push($t(rarityKey));
	if (unlocked) {
		if (dateText)
			parts.push(`${$t("trophies.featured.earned_on")} ${dateText}`);
	} else if (progress) {
		parts.push(
			`${$t("trophies.detail.progress")} ${progress.current} / ${progress.target}`,
		);
	} else {
		parts.push($t("trophies.card.locked"));
	}
	return parts.join(", ");
});
</script>

<button
	type="button"
	class="trophy"
	class:locked={!unlocked}
	data-rarity={rarity}
	onclick={() => onSelect?.(trophy)}
	aria-label={ariaLabel}
>
	<TrophyMedal {rarity} category={trophy.category} locked={!unlocked} />
	<span class="name">{titleText}</span>
	<span class="desc">{descText}</span>

	<!-- Pinned to the bottom so a row of mixed cards ends on one line. -->
	<span class="foot">
		<TrophyRarityChip {rarity} />
		{#if unlocked && dateText}
			<span class="meta">{dateText}</span>
		{:else if progress}
			<span class="progress-row">
				<span class="progress bar"><span style:width="{progress.percent}%"></span></span>
				<span class="count">{progress.current} / {progress.target}</span>
			</span>
		{:else if !unlocked}
			<span class="meta">{$t("trophies.card.locked")}</span>
		{/if}
	</span>
</button>

<style>
/* ── Design A: white card, left-aligned ─────────────────────────────── */
.trophy {
	--medal-size: 44px;
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 6px;
	box-sizing: border-box;
	width: 100%;
	min-height: 212px;
	padding: 12px 10px;
	border: 0;
	border-radius: var(--radius-card);
	background: var(--color-surface);
	box-shadow: var(--shadow-card);
	color: var(--color-ink);
	font: inherit;
	text-align: left;
	cursor: pointer;
	transition:
		transform 120ms,
		box-shadow 120ms;
}

.trophy:hover {
	box-shadow: var(--shadow-raised);
}

.trophy:active {
	transform: scale(0.98);
}

.name {
	margin-top: 4px;
	font-weight: 700;
	font-size: 14px;
	line-height: 1.2;
	overflow-wrap: anywhere;
}

.locked .name {
	color: var(--color-muted);
}

.desc {
	font-size: 12px;
	line-height: 1.3;
	color: var(--color-muted);
}

.foot {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 6px;
	width: 100%;
	margin-top: auto;
}

.meta {
	font-size: 12px;
	color: var(--color-muted);
}

.progress-row {
	display: flex;
	align-items: center;
	gap: 6px;
	width: 100%;
}

.bar {
	flex: 1;
	height: 4px;
}

/* A fills the trophy bar in navy, the red stays for the brand. */
.bar > span {
	background: var(--color-navy);
}

.count {
	flex-shrink: 0;
	font-family: var(--font-cond);
	font-weight: 700;
	font-size: 12px;
	font-variant-numeric: tabular-nums;
}

/* ── Design B: white sticker, centred ───────────────────────────────── */
:global([data-variant="b"]) .trophy {
	--medal-size: 52px;
	align-items: center;
	min-height: 214px;
	box-shadow: var(--shadow-control);
	text-align: center;
}

:global([data-variant="b"]) .trophy:hover {
	box-shadow: var(--shadow-raised);
}

:global([data-variant="b"]) .name {
	margin-top: 2px;
	font-size: 13px;
}

:global([data-variant="b"]) .desc {
	font-size: 11.5px;
}

:global([data-variant="b"]) .foot {
	align-items: center;
}

:global([data-variant="b"]) .meta,
:global([data-variant="b"]) .count {
	font-size: 11px;
}

:global([data-variant="b"]) .count {
	font-family: var(--font-sans);
}

:global([data-variant="b"]) .bar {
	height: 6px;
}

:global([data-variant="b"]) .bar > span {
	background: var(--color-progress);
}
</style>
