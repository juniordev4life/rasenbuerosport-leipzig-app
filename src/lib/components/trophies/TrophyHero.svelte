<script>
import { getTranslate } from "@tolgee/svelte";
import TrophyIcon from "$lib/components/icons/TrophyIcon.svelte";
import { RARITY_META } from "$lib/constants/trophies.constants.js";
import TrophyMedal from "./TrophyMedal.svelte";

/**
 * Top block of the trophy room: unlocked of total, completion, the
 * count per rarity and a bar split by tier. Design A: the red hero band
 * with a white stats box. Design B: a white card under a gold "Deine
 * Sammlung" strip, a metallic disc above each count.
 *
 * @type {{ summary: { total: number, unlocked: number, byRarity?: Record<string, number> } }}
 */
let { summary } = $props();

const { t } = getTranslate();

const uid = $props.id();
const titleId = `trophy-hero-${uid}`;

const RARITY_ORDER = ["bronze", "silver", "gold", "diamond"];

const total = $derived(summary?.total ?? 0);
const unlocked = $derived(summary?.unlocked ?? 0);
const percent = $derived(total ? Math.round((unlocked / total) * 100) : 0);

const tiers = $derived(
	RARITY_ORDER.map((rarity) => {
		const count = summary?.byRarity?.[rarity] ?? 0;
		return {
			rarity,
			count,
			share: total ? (count / total) * 100 : 0,
			color: RARITY_META[rarity].color,
			labelKey: RARITY_META[rarity].i18nKey,
		};
	}),
);
</script>

<section class="th hero bleed" aria-labelledby={titleId}>
	<p class="tag">
		<span class="tag-icon" aria-hidden="true"><TrophyIcon size={20} strokeWidth={2} /></span>
		{$t("trophies.hero.tag")}
	</p>

	<div class="body">
		<h1 id={titleId} class="page-title title">{$t("trophies.hero.title")}</h1>
		<p class="sub">
			<strong><span>{unlocked}</span> {$t("trophies.hero.of")} {total} {$t("trophies.hero.total_label")}</strong>
			· {percent}{$t("trophies.hero.percent_complete")}
		</p>

		<div class="box">
			<div class="tiers">
				{#each tiers as tier (tier.rarity)}
					<div class="tier">
						<TrophyMedal rarity={tier.rarity} />
						<span class="num count">{tier.count}</span>
						<span class="tier-label">{$t(tier.labelKey)}</span>
					</div>
				{/each}
			</div>
			<!-- The counts above say the same in text. -->
			<div class="bar" aria-hidden="true">
				{#each tiers as tier (tier.rarity)}
					<span style:width="{tier.share}%" style:background={tier.color}></span>
				{/each}
			</div>
		</div>
	</div>
</section>

<style>
/* ── Design A: red band, white stats box ────────────────────────────── */
.th {
	display: flex;
	flex-direction: column;
	padding-top: 22px;
	padding-bottom: 24px;
}

.tag {
	display: flex;
	align-items: center;
	gap: 8px;
	margin: 0;
	font-family: var(--font-cond);
	font-weight: 700;
	font-size: 14px;
	letter-spacing: 0.03em;
	text-transform: uppercase;
}

.tag-icon {
	display: none;
}

.body {
	display: flex;
	flex-direction: column;
}

.title {
	margin: 8px 0 0;
	font-size: 40px;
}

.sub {
	margin: 10px 0 0;
	font-size: 15px;
}

.sub strong {
	font-weight: 700;
}

.box {
	display: flex;
	flex-direction: column;
	gap: 14px;
	margin-top: 18px;
	padding: 14px;
	border-radius: var(--radius-tile);
	background: var(--color-surface);
	color: var(--color-ink);
}

.tiers {
	display: grid;
	grid-template-columns: repeat(4, minmax(0, 1fr));
	gap: 8px;
}

/* A: the count on top, a small tier swatch in front of the name. */
.tier {
	--medal-size: 10px;
	display: grid;
	grid-template-columns: auto minmax(0, 1fr);
	grid-template-areas:
		"count count"
		"medal label";
	align-items: center;
	gap: 6px;
	min-width: 0;
}

.tier :global(.medal) {
	grid-area: medal;
}

.count {
	grid-area: count;
	font-size: 28px;
	line-height: 0.85;
}

.tier-label {
	grid-area: label;
	min-width: 0;
	font-family: var(--font-label);
	font-weight: var(--label-weight);
	font-size: 12px;
	letter-spacing: var(--label-tracking);
	text-transform: var(--label-case);
	overflow-wrap: anywhere;
}

.bar {
	display: flex;
	height: 8px;
	overflow: hidden;
	border-radius: var(--radius-bar);
	background: var(--color-sunken);
}

.bar > span {
	display: block;
	height: 100%;
}

@media (min-width: 1024px) {
	.th {
		height: 100%;
		box-sizing: border-box;
		margin: 0;
		padding: 24px;
		border-radius: var(--radius-card);
	}
}

/* ── Design B: white card under a gold strip ────────────────────────── */
:global([data-variant="b"]) .th {
	overflow: hidden;
	padding: 0;
	border-radius: var(--radius-card);
	background: var(--color-surface);
	color: var(--color-ink);
	box-shadow: var(--shadow-card);
}

:global([data-variant="b"]) .tag {
	padding: 8px 18px;
	background: var(--color-gold);
	color: var(--color-on-gold);
	font-weight: 800;
	font-size: 16px;
	letter-spacing: 0;
	text-transform: none;
}

:global([data-variant="b"]) .tag-icon {
	display: inline-flex;
}

:global([data-variant="b"]) .body {
	gap: 14px;
	padding: 16px 18px 18px;
}

:global([data-variant="b"]) .title {
	margin: 0;
	font-size: 32px;
}

:global([data-variant="b"]) .sub {
	margin: -10px 0 0;
	font-size: 14px;
}

:global([data-variant="b"]) .box {
	margin: 0;
	padding: 0;
	background: transparent;
}

:global([data-variant="b"]) .tier {
	--medal-size: 34px;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 4px;
	text-align: center;
}

:global([data-variant="b"]) .count {
	font-size: 22px;
	line-height: 1.1;
}

:global([data-variant="b"]) .tier-label {
	font-size: 11px;
	color: var(--color-muted);
}

:global([data-variant="b"]) .bar {
	height: 10px;
}
</style>
