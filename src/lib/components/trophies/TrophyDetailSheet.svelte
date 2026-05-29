<script>
import { getTranslate } from "@tolgee/svelte";
import { cubicOut } from "svelte/easing";
import { fade, fly } from "svelte/transition";
import {
	CATEGORY_META,
	RARITY_META,
} from "$lib/constants/trophies.constants.js";
import { portal } from "$lib/utils/portal.utils.js";
import TrophyCategoryIcon from "./TrophyCategoryIcon.svelte";

/**
 * Detail sheet that opens when the user taps a trophy card. Shows
 * the same data the card displays but with more room — full name,
 * full description, unlock date (if earned), or the current progress
 * (if locked and progressable). Masked trophies render an
 * "Unbekannt — entdecke es selbst" hint instead of leaking the name.
 *
 * @type {{ trophy: object, locale?: string, onClose: () => void }}
 */
let { trophy, locale = "de-DE", onClose } = $props();

const { t } = getTranslate();

const rarityMeta = $derived(RARITY_META[trophy.rarity]);
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

function handleKey(event) {
	if (event.key === "Escape") onClose();
}
</script>

<svelte:window onkeydown={handleKey} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	use:portal
	in:fade={{ duration: 150 }}
	out:fade={{ duration: 150 }}
	class="overlay fixed inset-0 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4"
	role="dialog"
	aria-modal="true"
	aria-labelledby="trophy-sheet-title"
	onclick={onClose}
>
	<div
		in:fly={{ y: 280, duration: 260, easing: cubicOut }}
		out:fly={{ y: 280, duration: 200, easing: cubicOut }}
		class="sheet w-full sm:max-w-md max-h-[80vh] overflow-y-auto"
		style:--rarity-color={rarityMeta?.colorHex}
		onclick={(event) => event.stopPropagation()}
	>
		<div class="handle" aria-hidden="true"></div>

		<div class="medallion">
			{#if masked}
				<svg
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					width="46"
					height="46"
					aria-hidden="true"
				>
					<rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
					<path d="M7 11V7a5 5 0 0110 0v4" />
				</svg>
			{:else}
				<TrophyCategoryIcon
					category={trophy.category}
					size={46}
					strokeWidth={1.5}
				/>
			{/if}
		</div>

		<div class="meta-row">
			<span
				class="pill rarity-pill"
				style:color={rarityMeta?.colorHex}
				style:border-color="color-mix(in srgb, {rarityMeta?.colorHex} 40%, transparent)"
				style:background="color-mix(in srgb, {rarityMeta?.colorHex} 15%, transparent)"
			>
				{$t(rarityMeta?.i18nKey)}
			</span>
			{#if !masked && categoryMeta}
				<span
					class="pill category-pill"
					style:color={categoryMeta.colorHex}
					style:border-color={categoryMeta.borderRgba}
					style:background={categoryMeta.bgRgba}
				>
					{$t(categoryMeta.i18nKey)}
				</span>
			{/if}
		</div>

		<h2 id="trophy-sheet-title" class="title">{titleText}</h2>
		<p class="description">{descText}</p>

		{#if unlocked && dateText}
			<div class="status earned">
				<svg
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					width="14"
					height="14"
					aria-hidden="true"
				>
					<polyline points="20 6 9 17 4 12" />
				</svg>
				{$t("trophies.detail.earned_on")}
				{dateText}
			</div>
		{:else if trophy.progress}
			<div class="status progress-block">
				<div class="progress-label">
					{$t("trophies.detail.progress")}
				</div>
				<div class="progress-bar">
					<div
						class="progress-fill"
						style:width="{trophy.progress.percent}%"
					></div>
				</div>
				<div class="progress-text">
					{trophy.progress.current} / {trophy.progress.target}
					({trophy.progress.percent}%)
				</div>
			</div>
		{:else if !unlocked}
			<div class="status locked-hint">
				{$t("trophies.detail.locked_hint")}
			</div>
		{/if}

		<button type="button" class="close-btn" onclick={onClose}>
			{$t("trophies.detail.close")}
		</button>
	</div>
</div>

<style>
	.overlay {
		z-index: 100;
	}
	.sheet {
		background: #131822;
		border: 1px solid #1f2937;
		border-radius: 22px 22px 0 0;
		padding: 8px 22px 22px;
		box-shadow: 0 -20px 60px rgba(0, 0, 0, 0.55);
		padding-bottom: max(env(safe-area-inset-bottom, 0px), 22px);
		color: #e5e7eb;
		text-align: center;
	}
	@media (min-width: 640px) {
		.sheet {
			border-radius: 18px;
			padding: 22px;
		}
	}
	.handle {
		display: block;
		width: 36px;
		height: 4px;
		border-radius: 2px;
		background: rgba(255, 255, 255, 0.18);
		margin: 6px auto 14px;
	}
	@media (min-width: 640px) {
		.handle {
			display: none;
		}
	}
	.medallion {
		width: 96px;
		height: 96px;
		border-radius: 50%;
		margin: 4px auto 16px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: radial-gradient(
			circle,
			color-mix(in srgb, var(--rarity-color) 30%, transparent) 0%,
			color-mix(in srgb, var(--rarity-color) 18%, transparent) 70%
		);
		border: 2px solid
			color-mix(in srgb, var(--rarity-color) 50%, transparent);
		color: var(--rarity-color);
		box-shadow: 0 4px 24px
			color-mix(in srgb, var(--rarity-color) 30%, transparent);
	}
	.meta-row {
		display: flex;
		gap: 8px;
		justify-content: center;
		margin-bottom: 12px;
	}
	.pill {
		display: inline-flex;
		align-items: center;
		font-size: 10px;
		font-weight: 800;
		padding: 4px 9px;
		border-radius: 999px;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		border: 1px solid transparent;
	}
	.title {
		font-size: 22px;
		font-weight: 800;
		letter-spacing: -0.01em;
		color: #f0f2f5;
		margin: 0 0 8px;
	}
	.description {
		font-size: 13px;
		color: #d1d5db;
		line-height: 1.4;
		margin: 0 0 16px;
	}
	.status {
		font-size: 12px;
		font-weight: 600;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		padding: 10px 12px;
		border-radius: 10px;
		margin-bottom: 14px;
	}
	.status.earned {
		background: rgba(34, 197, 94, 0.12);
		border: 1px solid rgba(34, 197, 94, 0.3);
		color: #4ade80;
	}
	.status.locked-hint {
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.08);
		color: #9ca3af;
	}
	.progress-block {
		flex-direction: column;
		align-items: stretch;
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.08);
		gap: 4px;
	}
	.progress-label {
		font-size: 10px;
		color: #9ca3af;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		font-weight: 700;
		text-align: left;
	}
	.progress-bar {
		height: 6px;
		background: rgba(255, 255, 255, 0.06);
		border-radius: 3px;
		overflow: hidden;
	}
	.progress-fill {
		height: 100%;
		background: linear-gradient(
			90deg,
			var(--color-warning, #ca8a04),
			var(--color-success, #16a34a)
		);
		transition: width 0.4s ease;
	}
	.progress-text {
		font-size: 11px;
		color: #d1d5db;
		font-variant-numeric: tabular-nums;
		font-weight: 700;
		text-align: left;
	}
	.close-btn {
		width: 100%;
		padding: 12px 16px;
		background: rgba(255, 255, 255, 0.06);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 12px;
		color: #f0f2f5;
		font-weight: 700;
		font-size: 13px;
		cursor: pointer;
		transition:
			background 0.15s,
			border-color 0.15s;
	}
	.close-btn:hover {
		background: rgba(255, 255, 255, 0.1);
	}
</style>
