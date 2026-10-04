<script>
/**
 * The duo's key figures as a 2 × 2 grid of stat cards: label, big
 * number and an optional note. A "positive" note is printed in the win
 * colour and bold; the text itself says what it means.
 *
 * @type {{
 *   cards: Array<{ label: string, value: string, meta?: string|null, tone?: "positive"|"neutral" }>,
 * }}
 */
let { cards } = $props();
</script>

<dl class="kpis">
	{#each cards as card, i (i)}
		<div class="kpi">
			<dt class="label kpi-label">{card.label}</dt>
			<dd class="num kpi-value">{card.value}</dd>
			{#if card.meta}
				<dd class="kpi-meta" class:positive={card.tone === "positive"}>{card.meta}</dd>
			{/if}
		</div>
	{/each}
</dl>

<style>
.kpis {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 10px;
	margin: 0;
}

.kpi {
	display: flex;
	flex-direction: column;
	gap: 8px;
	min-width: 0;
	padding: 14px;
	background: var(--color-surface);
	color: var(--color-ink);
	border-radius: var(--radius-card);
	box-shadow: var(--shadow-card);
}

.kpi-label {
	color: var(--color-muted);
}

.kpi-value {
	margin: 0;
	font-size: 36px;
	line-height: 0.85;
	overflow-wrap: anywhere;
}

.kpi-meta {
	margin: 0;
	font-size: 12px;
	line-height: 1.3;
	color: var(--color-muted);
}

.kpi-meta.positive {
	font-weight: 700;
	color: var(--color-win);
}

:global([data-variant="b"]) .kpi {
	gap: 4px;
	padding: 14px 16px;
}

:global([data-variant="b"]) .kpi-value {
	font-size: 32px;
	line-height: 1.05;
}
</style>
