<script>
import { REPORTERS } from "$lib/constants/reporters.constants.js";

/**
 * Marcel's one-line verdict with his photo. Marcel appears twice on the
 * profile page:
 *  - `variant="normal"` in the hero (character verdict): a quote box
 *    signed with his name — white on the red band in design A, pale
 *    gold in B.
 *  - `variant="compact"` in the form section (situation verdict): photo
 *    and quote only, straight on the card.
 *
 * @type {{ quote: string, variant?: "normal"|"compact" }}
 */
let { quote, variant = "normal" } = $props();

const marcel = REPORTERS.klassiker;

const compact = $derived(variant === "compact");
</script>

<div class="marcel" class:compact>
	<img
		class="photo"
		src={marcel.imageUrl}
		alt={compact ? marcel.name : ""}
		loading="lazy"
	/>
	<div class="body">
		<p class="quote">{quote}</p>
		{#if !compact}
			<span class="name">{marcel.name}</span>
		{/if}
	</div>
</div>

<style>
/* ── Design A ───────────────────────────────────────────────────────── */
.marcel {
	display: flex;
	align-items: flex-start;
	gap: 12px;
	padding: 14px;
	border-radius: var(--radius-tile);
	background: var(--color-surface);
	color: var(--color-ink);
}

.marcel.compact {
	padding: 0;
	background: transparent;
}

.photo {
	width: 36px;
	height: 36px;
	flex-shrink: 0;
	object-fit: cover;
	border-radius: var(--radius-avatar);
	background: var(--color-sunken);
}

.compact .photo {
	width: 32px;
	height: 32px;
}

.body {
	display: flex;
	flex-direction: column;
	gap: 6px;
	min-width: 0;
}

.quote {
	margin: 0;
	font-size: 15px;
	line-height: 1.3;
}

.compact .quote {
	font-size: 14px;
}

.quote::before {
	content: "„";
}

.quote::after {
	content: "“";
}

.name {
	font-family: var(--font-cond);
	font-weight: 700;
	font-size: 12px;
	letter-spacing: 0.03em;
	text-transform: uppercase;
	color: var(--color-brand);
}

/* ── Design B: pale gold quote box, round photo ─────────────────────── */
:global([data-variant="b"]) .marcel {
	gap: 10px;
	padding: 12px;
	border-radius: 14px;
	background: var(--color-gold-soft);
}

:global([data-variant="b"]) .marcel.compact {
	padding: 0;
	background: transparent;
}

:global([data-variant="b"]) .photo {
	width: 32px;
	height: 32px;
}

:global([data-variant="b"]) .body {
	gap: 4px;
}

:global([data-variant="b"]) .quote {
	font-weight: 500;
	font-size: 14px;
	line-height: 1.4;
}

:global([data-variant="b"]) .name {
	font-family: var(--font-sans);
	letter-spacing: 0;
	text-transform: none;
	color: var(--color-muted);
}
</style>
