<script>
import { getTranslate } from "@tolgee/svelte";
import { CATEGORY_META } from "$lib/constants/trophies.constants.js";
import TrophyCard from "./TrophyCard.svelte";
import TrophyCategoryIcon from "./TrophyCategoryIcon.svelte";

/**
 * One category-bucket of trophies, rendered as a header + horizontally
 * scrolling shelf. The header shows the category icon, label, and
 * "X von Y erreicht" counter; the shelf hosts every trophy in that
 * category (earned + locked + masked) sorted by rarity, then by
 * unlocked-date.
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

<section class="regal-section">
	<header class="regal-header">
		<div class="regal-title-block">
			<div
				class="regal-icon-wrap"
				style:--cat-color={meta?.colorHex}
				style:background={meta?.bgRgba}
				style:border-color={meta?.borderRgba}
			>
				<TrophyCategoryIcon {category} size={16} />
			</div>
			<div class="regal-title-text">
				<div class="regal-name">{$t(meta?.i18nKey)}</div>
				<div class="regal-progress">
					<strong>{unlockedCount}</strong>
					{$t("trophies.shelf.progress_separator")}
					{trophies.length}
					{$t("trophies.shelf.progress_suffix")}
				</div>
			</div>
		</div>
	</header>
	<div class="regal-shelf" role="list">
		<div class="regal-row">
			{#each sorted as trophy (trophy.id)}
				<div role="listitem">
					<TrophyCard {trophy} {locale} {onSelect} />
				</div>
			{/each}
		</div>
	</div>
</section>

<style>
	.regal-section {
		margin-bottom: 24px;
	}
	.regal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 4px;
		margin-bottom: 12px;
	}
	.regal-title-block {
		display: flex;
		align-items: center;
		gap: 10px;
	}
	.regal-icon-wrap {
		width: 28px;
		height: 28px;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 1px solid transparent;
		color: var(--cat-color);
	}
	.regal-title-text {
		display: flex;
		flex-direction: column;
	}
	.regal-name {
		font-size: 14px;
		font-weight: 800;
		color: var(--color-text-primary);
		line-height: 1.1;
	}
	.regal-progress {
		font-size: 10px;
		color: var(--color-text-secondary);
		margin-top: 2px;
	}
	.regal-progress strong {
		color: var(--color-warning);
	}
	.regal-shelf {
		position: relative;
		overflow-x: auto;
		overflow-y: visible;
		padding: 8px 0 24px;
		scroll-behavior: smooth;
		scrollbar-width: none;
		margin-left: -4px;
		margin-right: -4px;
	}
	.regal-shelf::-webkit-scrollbar {
		display: none;
	}
	.regal-row {
		display: flex;
		gap: 12px;
		padding: 0 4px 4px;
	}
</style>
