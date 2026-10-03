<script>
/**
 * Signed rating change: "+12", "−5", "±0", or "—" when there is none.
 * The sign carries the direction; colour only repeats it.
 *
 * `inline` (list rows): a small condensed figure in the win / loss /
 * muted colour. `pill` (heroes): design A prints it as a caption in the
 * text colour of its surroundings (white on the red hero); design B puts
 * it in a pale green / red / grey chip. `suffix` follows the figure
 * ("diese Woche").
 *
 * @type {{
 *   delta: number|null,
 *   variant?: "inline"|"pill",
 *   suffix?: string|null,
 * }}
 */
let { delta = null, variant = "inline", suffix = null } = $props();

const rounded = $derived(delta == null ? null : Math.round(delta));

const direction = $derived(
	rounded == null || rounded === 0 ? "flat" : rounded > 0 ? "up" : "down",
);

const label = $derived.by(() => {
	if (rounded == null) return "—";
	if (rounded > 0) return `+${rounded}`;
	if (rounded < 0) return `−${Math.abs(rounded)}`;
	return "±0";
});
</script>

<span class="trend trend-{variant} {direction}">
	{label}{#if suffix}&nbsp;{suffix}{/if}
</span>

<style>
.trend {
	display: inline-flex;
	align-items: center;
	white-space: nowrap;
	font-variant-numeric: tabular-nums;
}

.trend-inline {
	font-family: var(--font-cond);
	font-weight: 700;
	font-size: 13px;
	line-height: 1;
}

.trend-inline.up {
	color: var(--color-win);
}

.trend-inline.down {
	color: var(--color-loss);
}

.trend-inline.flat {
	color: var(--color-muted);
}

/* A: a caption in the surrounding text colour. */
.trend-pill {
	font-size: 13px;
	line-height: 1.25;
}

/* B: a tinted chip. */
:global([data-variant="b"]) .trend-pill {
	padding: 3px 10px;
	border-radius: 999px;
	font-weight: 500;
	font-size: 12px;
}

:global([data-variant="b"]) .trend-pill.up {
	background: var(--color-win-soft);
	color: var(--color-win);
}

:global([data-variant="b"]) .trend-pill.down {
	background: var(--color-loss-soft);
	color: var(--color-loss);
}

:global([data-variant="b"]) .trend-pill.flat {
	background: var(--color-sunken);
	color: var(--color-muted);
}
</style>
