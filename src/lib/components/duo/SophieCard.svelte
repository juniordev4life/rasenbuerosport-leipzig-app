<script>
import { REPORTERS } from "$lib/constants/reporters.constants.js";

/**
 * Sophie's verdict: her photo, the quote and her name. Used in the duo
 * hero and the H2H hero. Design A: a white box on the red hero band.
 * Design B: a pale gold speech bubble.
 *
 * @type {{ quote: string }}
 */
let { quote } = $props();

const sophie = REPORTERS.analyst;
</script>

<figure class="sophie">
	<img class="sophie-pic" src={sophie.imageUrl} alt="" loading="lazy" />
	<blockquote class="sophie-quote">{quote}</blockquote>
	<figcaption class="sophie-name">{sophie.name}</figcaption>
</figure>

<style>
.sophie {
	display: grid;
	grid-template-columns: auto minmax(0, 1fr);
	align-items: start;
	gap: 6px 12px;
	margin: 0;
	padding: 14px;
	background: var(--color-surface);
	color: var(--color-ink);
	border-radius: var(--radius-tile);
}

.sophie-pic {
	grid-row: span 2;
	width: 36px;
	height: 36px;
	object-fit: cover;
	background: var(--color-navy);
	border-radius: var(--radius-avatar);
}

.sophie-quote {
	margin: 0;
	font-size: 15px;
	line-height: 1.35;
}

.sophie-quote::before {
	content: "„";
}

.sophie-quote::after {
	content: "“";
}

.sophie-name {
	font-family: var(--font-cond);
	font-weight: 700;
	font-size: 12px;
	letter-spacing: 0.03em;
	text-transform: uppercase;
	color: var(--color-brand);
}

/* Design B: a pale gold speech bubble. */
:global([data-variant="b"]) .sophie {
	gap: 4px 10px;
	padding: 12px;
	background: var(--color-gold-soft);
}

:global([data-variant="b"]) .sophie-pic {
	width: 32px;
	height: 32px;
}

:global([data-variant="b"]) .sophie-quote {
	font-weight: 500;
	font-size: 14px;
	line-height: 1.4;
}

:global([data-variant="b"]) .sophie-name {
	font-family: var(--font-sans);
	letter-spacing: 0;
	text-transform: none;
	color: var(--color-muted);
}
</style>
