<script>
/**
 * Layout of one season-recap slide: an optional headline above the
 * slide's blocks. Design A: big white display type straight on the red
 * or navy story frame. Design B: a white sentence-case title on the
 * pitch; the content sits in white sticker cards (see RecapCard).
 *
 * It also styles two small helpers the slides use:
 *   - `.recap-pill` — gold pill for ranks and badges ("Platz 1 von 9");
 *   - `.recap-note` — a secondary line of text. In design B it is muted,
 *     so use it inside a RecapCard there, never straight on the pitch.
 *
 * @type {{ title?: string|null, children: import('svelte').Snippet }}
 */
let { title = null, children } = $props();
</script>

<div class="slide">
	{#if title}
		<h2 class="page-title slide-title">{title}</h2>
	{/if}
	{@render children()}
</div>

<style>
.slide {
	display: flex;
	flex-direction: column;
	gap: 18px;
	width: 100%;
	text-align: left;
}

.slide-title {
	margin: 0;
	font-size: min(36px, 10cqw);
	text-wrap: balance;
	text-shadow: var(--on-page-shadow);
}

.slide :global(.recap-pill) {
	align-self: flex-start;
	display: inline-flex;
	align-items: center;
	gap: 6px;
	margin: 0;
	padding: 7px 14px;
	border-radius: var(--radius-badge);
	background: var(--color-gold);
	color: var(--color-on-gold);
	box-shadow: var(--shadow-control);
	font-family: var(--font-label);
	font-weight: 700;
	font-size: 14px;
	line-height: 1.2;
	text-transform: var(--label-case);
	letter-spacing: var(--label-tracking);
}

.slide :global(.recap-note) {
	margin: 0;
	font-size: 15px;
	line-height: 1.4;
}

:global([data-variant="b"]) .slide-title {
	font-size: min(32px, 9cqw);
}

:global([data-variant="b"]) .slide :global(.recap-note) {
	font-size: 14px;
	color: var(--color-muted);
}
</style>
