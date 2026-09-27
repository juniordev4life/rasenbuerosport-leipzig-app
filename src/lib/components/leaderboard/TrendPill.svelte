<script>
/**
 * Compact +Δ / −Δ / flat pill used inline in player rows and within the
 * hero card. The direction is derived from the delta sign, so callers
 * only need to pass the numeric value. Uses the theme's semantic
 * success/error/muted tokens so it stays readable in light and dark
 * mode alike.
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

const inlineToneClass = $derived(
	direction === "up"
		? "text-success"
		: direction === "down"
			? "text-error"
			: "text-text-muted",
);

const pillToneClass = $derived(
	direction === "up"
		? "bg-success/10 border-success/30 text-success"
		: direction === "down"
			? "bg-error/10 border-error/30 text-error"
			: "bg-bg-input border-border text-text-muted",
);
</script>

{#if variant === "pill"}
	<span
		class="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold tabular-nums whitespace-nowrap {pillToneClass}"
	>
		{symbol} {label}{#if suffix}&nbsp;{suffix}{/if}
	</span>
{:else}
	<span
		class="inline-flex items-center gap-0.5 text-[10px] font-bold tabular-nums whitespace-nowrap {inlineToneClass}"
	>
		{symbol} {label}
	</span>
{/if}
