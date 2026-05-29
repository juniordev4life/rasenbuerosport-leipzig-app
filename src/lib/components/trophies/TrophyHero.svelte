<script>
import { getTranslate } from "@tolgee/svelte";
import { RARITY_META } from "$lib/constants/trophies.constants.js";

/**
 * Trophy-room hero — the topmost block summarising the player's
 * collection: total / unlocked, per-rarity counts, and a
 * gradient progress bar.
 *
 * @type {{ summary: { total: number, unlocked: number, byRarity: Record<string, number> } }}
 */
let { summary } = $props();

const { t } = getTranslate();

const percent = $derived.by(() => {
	if (!summary?.total) return 0;
	return Math.round((summary.unlocked / summary.total) * 100);
});

const rarityOrder = ["bronze", "silver", "gold", "diamond"];
</script>

<div class="trophaeen-hero">
	<div class="hero-tag">
		<svg
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			width="11"
			height="11"
			aria-hidden="true"
		>
			<path
				d="M8 21h8M12 17v4M7 4h10v3a5 5 0 01-10 0V4zM7 4H4v2a3 3 0 003 3M17 4h3v2a3 3 0 01-3 3"
			/>
		</svg>
		{t("trophies.hero.tag")}
	</div>
	<div class="hero-title">{t("trophies.hero.title")}</div>
	<div class="hero-subtitle">
		<span class="count-current">{summary?.unlocked ?? 0}</span>
		<span class="count-total">
			{t("trophies.hero.of")}
			{summary?.total ?? 0}
			{t("trophies.hero.total_label")}
		</span>
		<span class="dot">·</span>
		<span class="percent">{percent}{t("trophies.hero.percent_complete")}</span>
	</div>
	<div class="hero-progress-section">
		<div class="hero-progress-row">
			{#each rarityOrder as rarity (rarity)}
				<div class="rarity-stat">
					<div
						class="rarity-stat-num"
						style:color={RARITY_META[rarity].colorHex}
					>
						{summary?.byRarity?.[rarity] ?? 0}
					</div>
					<div class="rarity-stat-label">
						{t(RARITY_META[rarity].i18nKey)}
					</div>
				</div>
			{/each}
		</div>
		<div class="hero-progress-bar">
			<div class="hero-progress-fill" style:width="{percent}%"></div>
		</div>
	</div>
</div>

<style>
	.trophaeen-hero {
		margin-bottom: 16px;
		background:
			radial-gradient(
				ellipse at top right,
				rgba(245, 158, 11, 0.22) 0%,
				transparent 60%
			),
			radial-gradient(
				ellipse at bottom left,
				rgba(245, 158, 11, 0.08) 0%,
				transparent 50%
			),
			linear-gradient(180deg, #1f1810 0%, #131822 100%);
		border: 1px solid rgba(245, 158, 11, 0.3);
		border-radius: 20px;
		padding: 18px;
		position: relative;
		overflow: hidden;
		color: #e5e7eb;
	}
	.trophaeen-hero::before {
		content: "";
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 2px;
		background: linear-gradient(
			90deg,
			transparent,
			#f59e0b 50%,
			transparent
		);
		opacity: 0.7;
	}
	.hero-tag {
		font-size: 10px;
		font-weight: 800;
		color: #fbbf24;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		display: flex;
		align-items: center;
		gap: 6px;
		margin-bottom: 8px;
	}
	.hero-title {
		font-size: 26px;
		font-weight: 800;
		letter-spacing: -0.02em;
		margin-bottom: 4px;
		color: white;
	}
	.hero-subtitle {
		font-size: 13px;
		color: #d1d5db;
		margin-bottom: 16px;
	}
	.hero-subtitle .count-current {
		color: #fbbf24;
		font-weight: 700;
	}
	.hero-subtitle .count-total,
	.hero-subtitle .dot {
		color: #9ca3af;
	}
	.hero-subtitle .percent {
		color: #d1d5db;
	}
	.hero-progress-section {
		background: rgba(0, 0, 0, 0.25);
		border: 1px solid rgba(255, 255, 255, 0.06);
		border-radius: 12px;
		padding: 12px;
	}
	.hero-progress-row {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr 1fr;
		gap: 8px;
		margin-bottom: 10px;
	}
	.rarity-stat {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 3px;
	}
	.rarity-stat-num {
		font-size: 16px;
		font-weight: 800;
		font-variant-numeric: tabular-nums;
		line-height: 1;
	}
	.rarity-stat-label {
		font-size: 8px;
		color: #6b7280;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		font-weight: 700;
	}
	.hero-progress-bar {
		height: 5px;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 3px;
		overflow: hidden;
	}
	.hero-progress-fill {
		height: 100%;
		background: linear-gradient(
			90deg,
			#cd7f32 0%,
			#c0c0c0 30%,
			#fbbf24 60%,
			#67e8f9 100%
		);
		border-radius: 3px;
		transition: width 0.4s ease;
	}
</style>
