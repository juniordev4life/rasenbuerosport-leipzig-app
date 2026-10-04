<script>
import { getTranslate } from "@tolgee/svelte";
import { CATEGORY_META } from "$lib/constants/trophies.constants.js";
import TrophyCard from "./TrophyCard.svelte";
import TrophyCategoryIcon from "./TrophyCategoryIcon.svelte";
import TrophySectionHead from "./TrophySectionHead.svelte";

/**
 * One category of trophies: a heading with the "X von Y erreicht"
 * counter and every trophy of the category (earned, locked, hidden),
 * earned first. Phones scroll the shelf sideways, edge to edge; from
 * `lg` it wraps into a grid that uses the full width.
 *
 * @type {{
 *   category: string,
 *   trophies: Array<object>,
 *   locale?: string,
 *   onSelect?: (trophy: object) => void,
 * }}
 */
let { category, trophies, locale = "de-DE", onSelect } = $props();

const { t } = getTranslate();

const uid = $props.id();
const headingId = `trophy-shelf-${uid}`;

const meta = $derived(CATEGORY_META[category]);
const unlockedCount = $derived(
	trophies.filter((trophy) => trophy.unlocked).length,
);

const sorted = $derived.by(() => {
	// Earned first (newest unlock first), then locked-with-progress
	// (closest to done first), then locked-no-progress, then masked.
	const earned = trophies
		.filter((trophy) => trophy.unlocked)
		.sort((a, b) => (b.unlockedAt ?? "").localeCompare(a.unlockedAt ?? ""));
	const locked = trophies.filter(
		(trophy) => !trophy.unlocked && !trophy.masked,
	);
	const lockedWithProgress = locked
		.filter((trophy) => trophy.progress)
		.sort((a, b) => (b.progress?.percent ?? 0) - (a.progress?.percent ?? 0));
	const lockedNoProgress = locked.filter((trophy) => !trophy.progress);
	const masked = trophies.filter((trophy) => trophy.masked);
	return [...earned, ...lockedWithProgress, ...lockedNoProgress, ...masked];
});
</script>

<section class="shelf" aria-labelledby={headingId}>
	<TrophySectionHead id={headingId} title={meta ? $t(meta.i18nKey) : category}>
		{#snippet icon()}<TrophyCategoryIcon {category} size={22} strokeWidth={2} />{/snippet}
		<strong>{unlockedCount} {$t("trophies.shelf.progress_separator")} {trophies.length}</strong>
		{$t("trophies.shelf.progress_suffix")}
	</TrophySectionHead>

	<ul class="row">
		{#each sorted as trophy (trophy.id)}
			<li class="item">
				<TrophyCard {trophy} {locale} {onSelect} />
			</li>
		{/each}
	</ul>
</section>

<style>
.shelf {
	display: flex;
	flex-direction: column;
	gap: 10px;
	min-width: 0;
}

/* Phones: a sideways strip from screen edge to screen edge. The scroller
 * clips, so it gets room for the cards' shadows, taken back by the
 * negative block margins. */
.row {
	display: flex;
	gap: 8px;
	margin: -8px calc(var(--page-gutter, 1rem) * -1) -6px;
	padding: 8px var(--page-gutter, 1rem) 16px;
	list-style: none;
	overflow-x: auto;
	scroll-snap-type: x proximity;
	scroll-padding-inline: var(--page-gutter, 1rem);
	scrollbar-width: none;
}

.row::-webkit-scrollbar {
	display: none;
}

.item {
	display: flex;
	flex: 0 0 112px;
	scroll-snap-align: start;
}

:global([data-variant="b"]) .row {
	gap: 10px;
}

:global([data-variant="b"]) .item {
	flex-basis: 116px;
}

/* Desktop: the whole category at a glance. */
@media (min-width: 1024px) {
	.row,
	:global([data-variant="b"]) .row {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		gap: 12px;
		margin: 0;
		padding: 0 0 4px;
		overflow: visible;
	}
}
</style>
