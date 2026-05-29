<script>
import { getTranslate } from "@tolgee/svelte";
import { RARITY_META } from "$lib/constants/trophies.constants.js";
import TrophyCategoryIcon from "./TrophyCategoryIcon.svelte";

/**
 * "Zuletzt erhalten" hero card. Highlights the player's most recent
 * unlock with a glowing rarity-coloured medallion + name + description
 * + earned date. Shown only when `latest` is non-null (otherwise the
 * trophy room renders an empty-state hint elsewhere).
 *
 * @type {{
 *   latest: { id: string, name: string, rarity: string, unlockedAt: string },
 *   trophyDef?: object | undefined,
 *   locale?: string,
 * }}
 */
let { latest, trophyDef, locale = "de-DE" } = $props();

const { t } = getTranslate();

const rarityMeta = $derived(RARITY_META[latest.rarity]);

const dateText = $derived(
	new Date(latest.unlockedAt).toLocaleDateString(locale, {
		year: "numeric",
		month: "long",
		day: "numeric",
	}),
);
</script>

<section class="featured-section">
	<header class="section-meta-header">
		<div class="section-meta-tag">
			<svg
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				width="10"
				height="10"
				aria-hidden="true"
			>
				<polygon
					points="12 2 15 8.5 22 9.3 17 14 18.2 21 12 17.8 5.8 21 7 14 2 9.3 9 8.5 12 2"
				/>
			</svg>
			{$t("trophies.featured.tag")}
		</div>
	</header>
	<div
		class="featured-card"
		style:--rarity-color={rarityMeta?.colorHex}
	>
		<div class="featured-trophy-icon">
			<TrophyCategoryIcon
				category={trophyDef?.category ?? "special"}
				size={40}
				strokeWidth={1.5}
			/>
		</div>
		<div class="featured-info">
			<div class="featured-rarity-pill">
				<svg
					viewBox="0 0 24 24"
					fill="currentColor"
					width="8"
					height="8"
					aria-hidden="true"
				>
					<polygon points="12 2 15 8 22 9 17 14 18 21 12 18 6 21 7 14 2 9 9 8" />
				</svg>
				{$t(rarityMeta?.i18nKey)}
			</div>
			<div class="featured-name">{latest.name}</div>
			{#if trophyDef?.description}
				<div class="featured-desc">{trophyDef.description}</div>
			{/if}
			<div class="featured-date">
				<svg
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					width="9"
					height="9"
					aria-hidden="true"
				>
					<rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
					<line x1="16" y1="2" x2="16" y2="6" />
					<line x1="8" y1="2" x2="8" y2="6" />
					<line x1="3" y1="10" x2="21" y2="10" />
				</svg>
				{$t("trophies.featured.earned_on")}
				{dateText}
			</div>
		</div>
	</div>
</section>

<style>
	.featured-section {
		margin-bottom: 20px;
	}
	.section-meta-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 10px;
	}
	.section-meta-tag {
		font-size: 9px;
		font-weight: 800;
		color: var(--color-warning);
		text-transform: uppercase;
		letter-spacing: 0.12em;
		display: flex;
		align-items: center;
		gap: 5px;
	}
	.featured-card {
		background:
			radial-gradient(
				ellipse at center,
				color-mix(in srgb, var(--rarity-color) 18%, transparent) 0%,
				transparent 70%
			),
			linear-gradient(180deg, #1a1f2a 0%, #131822 100%);
		border: 1px solid
			color-mix(in srgb, var(--rarity-color) 35%, transparent);
		border-radius: 18px;
		padding: 20px 16px;
		position: relative;
		overflow: hidden;
		display: grid;
		grid-template-columns: 88px 1fr;
		gap: 16px;
		align-items: center;
		color: #e5e7eb;
	}
	.featured-card::before {
		content: "";
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 2px;
		background: linear-gradient(
			90deg,
			transparent,
			var(--rarity-color) 50%,
			transparent
		);
		opacity: 0.6;
	}
	.featured-trophy-icon {
		width: 88px;
		height: 88px;
		border-radius: 50%;
		background: radial-gradient(
			circle,
			color-mix(in srgb, var(--rarity-color) 30%, transparent) 0%,
			color-mix(in srgb, var(--rarity-color) 18%, transparent) 70%
		);
		border: 2px solid
			color-mix(in srgb, var(--rarity-color) 50%, transparent);
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--rarity-color);
		box-shadow:
			0 0 0 4px color-mix(in srgb, var(--rarity-color) 10%, transparent),
			0 4px 24px color-mix(in srgb, var(--rarity-color) 30%, transparent);
		position: relative;
		z-index: 1;
	}
	.featured-info {
		position: relative;
		z-index: 1;
	}
	.featured-rarity-pill {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		background: color-mix(in srgb, var(--rarity-color) 15%, transparent);
		border: 1px solid
			color-mix(in srgb, var(--rarity-color) 40%, transparent);
		color: var(--rarity-color);
		font-size: 9px;
		font-weight: 800;
		padding: 3px 8px;
		border-radius: 999px;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		margin-bottom: 6px;
	}
	.featured-name {
		font-size: 16px;
		font-weight: 800;
		color: white;
		line-height: 1.15;
		margin-bottom: 3px;
	}
	.featured-desc {
		font-size: 11px;
		color: #9ca3af;
		line-height: 1.4;
		margin-bottom: 8px;
	}
	.featured-date {
		font-size: 10px;
		color: #6b7280;
		font-weight: 600;
		display: flex;
		align-items: center;
		gap: 4px;
	}
</style>
