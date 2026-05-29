<script>
import { getTranslate } from "@tolgee/svelte";
import { RARITY_META } from "$lib/constants/trophies.constants.js";
import TrophyCategoryIcon from "./TrophyCategoryIcon.svelte";

/**
 * One trophy tile inside a shelf row. The trophy can be in one of
 * three modes that the backend signals:
 *   - `trophy.unlocked === true`   → earned (colour + date + medal)
 *   - `trophy.unlocked === false`  → locked. Two subcases:
 *       - `trophy.masked`          → hidden, name suppressed
 *       - otherwise                → name visible, progress bar if
 *                                    backend supplied one
 *
 * The card is a button — tap opens the detail sheet via `onSelect`.
 *
 * @type {{ trophy: object, locale: string, onSelect?: (trophy: object) => void }}
 */
let { trophy, locale = "de-DE", onSelect } = $props();

const { t } = getTranslate();

const rarity = $derived(trophy.rarity);
const rarityMeta = $derived(RARITY_META[rarity]);

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

function handleClick() {
	onSelect?.(trophy);
}

function handleKey(event) {
	if (event.key === "Enter" || event.key === " ") {
		event.preventDefault();
		handleClick();
	}
}
</script>

<button
	type="button"
	class="trophy"
	class:earned={unlocked}
	class:locked={!unlocked}
	class:masked
	data-rarity={rarity}
	style:--rarity-color={rarityMeta?.colorHex}
	onclick={handleClick}
	onkeydown={handleKey}
	aria-label={titleText}
>
	<div class="trophy-icon-circle">
		{#if masked}
			<!-- Lock glyph for masked / hidden trophies -->
			<svg
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				width="26"
				height="26"
				aria-hidden="true"
			>
				<rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
				<path d="M7 11V7a5 5 0 0110 0v4" />
			</svg>
		{:else}
			<TrophyCategoryIcon category={trophy.category} size={26} />
		{/if}
	</div>

	<div class="trophy-name">{titleText}</div>
	<div class="trophy-desc">{descText}</div>
	<div class="trophy-rarity-pill">{$t(rarityMeta?.i18nKey)}</div>

	<!--
		Footer slot — same min-height regardless of which child renders.
		Keeps every card the same overall height so a row of mixed
		earned / locked / masked tiles doesn't look jagged.
	-->
	<div class="trophy-footer">
		{#if unlocked && dateText}
			<div class="trophy-date">{dateText}</div>
		{:else if progress}
			<div class="trophy-progress">
				<div class="trophy-progress-bar">
					<div
						class="trophy-progress-fill"
						style:width="{progress.percent}%"
					></div>
				</div>
				<div class="trophy-progress-text">
					{progress.current} / {progress.target}
				</div>
			</div>
		{/if}
	</div>
</button>

<style>
	.trophy {
		flex: 0 0 130px;
		/* Stretch to the row's tallest card so a mixed row of
		 * earned / locked / masked tiles stays uniform. The row sets
		 * `align-items: stretch` (the flex default) — this `height`
		 * just opts each card into the stretching instead of sizing
		 * to its own content. */
		height: 100%;
		min-height: 220px;
		background: var(--color-bg-card);
		border: 1px solid var(--color-border);
		border-radius: 14px;
		padding: 12px 10px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
		position: relative;
		cursor: pointer;
		transition:
			transform 0.2s ease,
			opacity 0.2s ease;
		text-align: center;
		font: inherit;
		color: inherit;
		appearance: none;
	}
	.trophy:active {
		transform: scale(0.97);
	}

	.trophy.earned {
		background:
			radial-gradient(
				ellipse at top,
				color-mix(in srgb, var(--rarity-color) 18%, transparent) 0%,
				transparent 70%
			),
			var(--color-bg-card);
		border-color: color-mix(in srgb, var(--rarity-color) 40%, transparent);
	}
	.trophy.locked {
		opacity: 0.6;
		border-style: dashed;
		border-color: color-mix(in srgb, var(--color-border) 60%, transparent);
	}
	.trophy.masked {
		opacity: 0.5;
	}

	.trophy-icon-circle {
		width: 64px;
		height: 64px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
	}
	.trophy.earned .trophy-icon-circle {
		background: radial-gradient(
			circle,
			color-mix(in srgb, var(--rarity-color) 30%, transparent) 0%,
			color-mix(in srgb, var(--rarity-color) 18%, transparent) 70%
		);
		border: 2px solid
			color-mix(in srgb, var(--rarity-color) 50%, transparent);
		color: var(--rarity-color);
		box-shadow: 0 4px 16px
			color-mix(in srgb, var(--rarity-color) 25%, transparent);
	}
	.trophy.locked .trophy-icon-circle {
		background: rgba(0, 0, 0, 0.18);
		border: 2px dashed
			color-mix(in srgb, var(--color-border) 70%, transparent);
		color: var(--color-text-muted);
	}

	.trophy.earned[data-rarity="diamond"] .trophy-icon-circle::after {
		content: "";
		position: absolute;
		inset: -3px;
		border-radius: 50%;
		border: 1px solid
			color-mix(in srgb, var(--rarity-color) 40%, transparent);
		animation: diamondPulse 2.5s ease-in-out infinite;
	}
	@keyframes diamondPulse {
		0%,
		100% {
			transform: scale(1);
			opacity: 0.4;
		}
		50% {
			transform: scale(1.08);
			opacity: 0;
		}
	}

	.trophy-name {
		font-size: 11px;
		font-weight: 800;
		color: var(--color-text-primary);
		line-height: 1.15;
		min-height: 26px;
		display: flex;
		align-items: center;
	}
	.trophy.locked .trophy-name {
		color: var(--color-text-muted);
	}
	.trophy-desc {
		font-size: 9px;
		color: var(--color-text-secondary);
		line-height: 1.3;
		min-height: 24px;
	}
	.trophy.locked .trophy-desc {
		color: var(--color-text-muted);
	}
	.trophy-rarity-pill {
		font-size: 7px;
		font-weight: 800;
		padding: 2px 6px;
		border-radius: 999px;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		margin-top: 2px;
		background: color-mix(in srgb, var(--rarity-color) 15%, transparent);
		color: var(--rarity-color);
		border: 1px solid
			color-mix(in srgb, var(--rarity-color) 35%, transparent);
	}
	.trophy.locked .trophy-rarity-pill {
		background: rgba(75, 85, 99, 0.15);
		color: var(--color-text-muted);
		border-color: color-mix(in srgb, var(--color-border) 50%, transparent);
	}
	/* Footer slot always claims the same vertical space — date OR
	 * progress OR nothing, every card ends at the same bottom line.
	 * `margin-top: auto` pins it to the bottom so the icon + name
	 * stack stays anchored at the top. */
	.trophy-footer {
		width: 100%;
		min-height: 22px;
		margin-top: auto;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-end;
	}
	.trophy-date {
		font-size: 8px;
		color: var(--color-text-muted);
		letter-spacing: 0.04em;
	}
	.trophy-progress {
		width: 100%;
	}
	.trophy-progress-bar {
		height: 3px;
		background: rgba(255, 255, 255, 0.06);
		border-radius: 2px;
		overflow: hidden;
	}
	.trophy-progress-fill {
		height: 100%;
		background: linear-gradient(90deg, #6b7280, #9ca3af);
		border-radius: 2px;
	}
	.trophy-progress-text {
		font-size: 8px;
		color: var(--color-text-secondary);
		font-weight: 700;
		margin-top: 3px;
		font-variant-numeric: tabular-nums;
	}
</style>
