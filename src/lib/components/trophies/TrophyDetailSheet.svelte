<script>
import { getTranslate } from "@tolgee/svelte";
import CheckIcon from "$lib/components/icons/CheckIcon.svelte";
import PadlockIcon from "$lib/components/icons/PadlockIcon.svelte";
import Button from "$lib/components/ui/Button.svelte";
import Sheet from "$lib/components/ui/Sheet.svelte";
import { CATEGORY_META } from "$lib/constants/trophies.constants.js";
import TrophyMedal from "./TrophyMedal.svelte";
import TrophyRarityChip from "./TrophyRarityChip.svelte";

/**
 * Detail sheet for a tapped trophy card: the same data with more room —
 * full name and description, the unlock date when earned, the progress
 * when locked and progressable. Masked trophies show an "Unbekannt —
 * entdecke es selbst" hint instead of leaking the name.
 *
 * @type {{ trophy: object, locale?: string, onClose: () => void }}
 */
let { trophy, locale = "de-DE", onClose } = $props();

const { t } = getTranslate();

const categoryMeta = $derived(CATEGORY_META[trophy.category]);

const masked = $derived(trophy.masked === true);
const unlocked = $derived(trophy.unlocked === true);

const titleText = $derived(masked ? $t("trophies.masked.name") : trophy.name);
const descText = $derived(
	masked ? $t("trophies.masked.description_long") : (trophy.description ?? ""),
);

const dateText = $derived(
	unlocked && trophy.unlockedAt
		? new Date(trophy.unlockedAt).toLocaleDateString(locale, {
				year: "numeric",
				month: "long",
				day: "numeric",
			})
		: null,
);
</script>

<Sheet title={titleText} {onClose} size="sm">
	<div class="detail">
		<TrophyMedal
			rarity={trophy.rarity}
			category={trophy.category}
			locked={!unlocked}
		/>

		<div class="chips">
			<TrophyRarityChip rarity={trophy.rarity} />
			{#if !masked && categoryMeta}
				<span class="chip chip-outline">{$t(categoryMeta.i18nKey)}</span>
			{/if}
		</div>

		<p class="desc">{descText}</p>

		{#if unlocked && dateText}
			<p class="status earned">
				<CheckIcon size={16} strokeWidth={2.5} />
				{$t("trophies.detail.earned_on")}
				{dateText}
			</p>
		{:else if trophy.progress}
			<div class="status progress-block">
				<span class="label">{$t("trophies.detail.progress")}</span>
				<div class="progress">
					<span style:width="{trophy.progress.percent}%"></span>
				</div>
				<span class="progress-text">
					{trophy.progress.current} / {trophy.progress.target}
					({trophy.progress.percent}%)
				</span>
			</div>
		{:else if !unlocked}
			<p class="status locked">
				<PadlockIcon size={16} strokeWidth={2} />
				{$t("trophies.detail.locked_hint")}
			</p>
		{/if}

		<Button variant="secondary" onclick={onClose}>
			{$t("trophies.detail.close")}
		</Button>
	</div>
</Sheet>

<style>
.detail {
	--medal-size: 88px;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 14px;
	text-align: center;
}

.detail > :global(.medal) {
	margin-top: 4px;
}

.chips {
	display: flex;
	flex-wrap: wrap;
	justify-content: center;
	gap: 8px;
}

.desc {
	margin: 0;
	font-size: 15px;
	line-height: 1.45;
}

.status {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	box-sizing: border-box;
	width: 100%;
	margin: 0;
	padding: 12px 14px;
	border-radius: var(--radius-tile);
	font-weight: 700;
	font-size: 14px;
}

.earned {
	background: var(--color-win-soft);
	color: var(--color-win);
}

.locked {
	background: var(--color-sunken);
	color: var(--color-ink);
	font-weight: 500;
}

.locked > :global(svg) {
	flex-shrink: 0;
	color: var(--color-muted);
}

.progress-block {
	flex-direction: column;
	align-items: stretch;
	gap: 8px;
	background: var(--color-sunken);
	text-align: left;
}

.progress-text {
	font-family: var(--font-cond);
	font-weight: 700;
	font-size: 15px;
	font-variant-numeric: tabular-nums;
}

:global([data-variant="b"]) .detail {
	--medal-size: 96px;
}

:global([data-variant="b"]) .progress-text {
	font-family: var(--font-sans);
	font-size: 14px;
}
</style>
