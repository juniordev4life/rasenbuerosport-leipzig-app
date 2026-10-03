<script>
/**
 * Card around one chart: a small label-style title (plus an optional
 * `aside`, e.g. the xG difference) above the canvas. Inside a design-B
 * Section the card loses its own frame, so the charts sit straight on the
 * section's white card.
 *
 * @type {{
 *   title: string,
 *   aside?: import('svelte').Snippet,
 *   children: import('svelte').Snippet,
 * }}
 */
let { title, aside, children } = $props();
</script>

<div class="card chart-card">
	<div class="chart-head">
		<h3 class="label chart-title">{title}</h3>
		{#if aside}
			{@render aside()}
		{/if}
	</div>
	{@render children()}
</div>

<style>
.chart-card {
	display: flex;
	flex-direction: column;
	gap: 12px;
	min-width: 0;
	padding: 16px;
}

.chart-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	min-height: 22px;
}

.chart-title {
	margin: 0;
	font-size: 13px;
	color: var(--color-muted);
}
</style>
