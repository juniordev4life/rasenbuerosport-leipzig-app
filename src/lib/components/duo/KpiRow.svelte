<script>
import { getTranslate } from "@tolgee/svelte";

/**
 * 2×2 KPI grid for the duo page. Each card has an optional meta line
 * that can be styled positive (green arrow) or neutral (grey text).
 *
 * @type {{
 *   cards: Array<{ label: string, value: string, meta?: string|null, tone?: "positive"|"neutral" }>,
 * }}
 */
let { cards } = $props();

const { t } = getTranslate();
</script>

<div class="kpi-row">
	{#each cards as card, i (i)}
		<div class="kpi-card">
			<div class="kpi-label">{card.label}</div>
			<div class="kpi-value">{card.value}</div>
			{#if card.meta}
				<div class="kpi-meta" class:positive={card.tone === "positive"}>{card.meta}</div>
			{/if}
		</div>
	{/each}
</div>

<style>
.kpi-row {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 8px;
}
.kpi-card {
	background: #131822;
	border: 1px solid #1F2937;
	border-radius: 12px;
	padding: 12px;
}
.kpi-label {
	font-size: 9px;
	text-transform: uppercase;
	letter-spacing: 0.08em;
	color: #6B7280;
	font-weight: 700;
	margin-bottom: 6px;
}
.kpi-value {
	font-size: 22px; font-weight: 800;
	line-height: 1;
	color: #FFFFFF;
	font-variant-numeric: tabular-nums;
}
.kpi-meta {
	font-size: 10px;
	color: #6B7280;
	margin-top: 4px;
}
.kpi-meta.positive {
	color: #84CC16;
	font-weight: 700;
}
</style>
