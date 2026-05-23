<script>
/**
 * Compact +Δ / −Δ / flat pill used inline in player rows and within
 * the hero card. The direction is derived from the delta sign, so
 * callers only need to pass the numeric value.
 *
 * @type {{
 *   delta: number|null,
 *   variant?: "inline"|"pill",
 *   suffix?: string|null,
 * }}
 */
let { delta = null, variant = "inline", suffix = null } = $props();

const direction = $derived(
	delta == null ? "flat" : delta > 0 ? "up" : delta < 0 ? "down" : "flat",
);

const symbol = $derived(
	direction === "up" ? "↑" : direction === "down" ? "↓" : "—",
);

const label = $derived.by(() => {
	if (delta == null) return "—";
	const abs = Math.round(Math.abs(delta));
	const sign = direction === "up" ? "+" : direction === "down" ? "−" : "±";
	return `${sign}${abs}`;
});
</script>

{#if variant === "pill"}
	<span class="trend-pill {direction}">
		{symbol} {label}{#if suffix}&nbsp;{suffix}{/if}
	</span>
{:else}
	<span class="trend-inline {direction}">
		{symbol} {label}
	</span>
{/if}

<style>
.trend-inline {
	font-size: 10px;
	font-weight: 700;
	font-variant-numeric: tabular-nums;
	display: inline-flex;
	align-items: center;
	gap: 3px;
	white-space: nowrap;
}
.trend-inline.up { color: #84CC16; }
.trend-inline.down { color: #E24B4A; }
.trend-inline.flat { color: #6B7280; }

.trend-pill {
	display: inline-block;
	font-size: 11px;
	font-weight: 700;
	font-variant-numeric: tabular-nums;
	padding: 4px 10px;
	border-radius: 999px;
	white-space: nowrap;
}
.trend-pill.up {
	background: rgba(132, 204, 22, 0.15);
	border: 1px solid rgba(132, 204, 22, 0.3);
	color: #84CC16;
}
.trend-pill.down {
	background: rgba(226, 75, 74, 0.15);
	border: 1px solid rgba(226, 75, 74, 0.3);
	color: #E24B4A;
}
.trend-pill.flat {
	background: rgba(107, 114, 128, 0.15);
	border: 1px solid rgba(107, 114, 128, 0.3);
	color: #9CA3AF;
}
</style>
