<script>
import CountUpNumber from "./CountUpNumber.svelte";

/**
 * The big number of a season-recap slide (win rate, goals, ELO …) with
 * its caption. Numbers count up from 0 unless `countUp` is off; `from`
 * puts a smaller start value and an arrow in front ("1500 → 1570").
 * Design A: white Anton display type, gold with `accent`. Design B:
 * bold condensed navy on the white card, green with `accent`.
 *
 * @type {{
 *   value: number|string,
 *   from?: number|string|null,
 *   label?: string|null,
 *   suffix?: string,
 *   decimals?: number,
 *   countUp?: boolean,
 *   accent?: boolean,
 *   reduced?: boolean,
 * }}
 */
let {
	value,
	from = null,
	label = null,
	suffix = "",
	decimals = 0,
	countUp = true,
	accent = false,
	reduced = false,
} = $props();

const animate = $derived(countUp && typeof value === "number");
</script>

<div class="hero-number" class:accent class:has-from={from != null}>
	<p class="value">
		{#if from != null}
			<span class="from">{from}</span>
			<span class="arrow">→</span>
		{/if}
		<span class="to">
			{#if animate}
				<CountUpNumber {value} {suffix} {decimals} {reduced} />
			{:else}
				{value}{suffix}
			{/if}
		</span>
	</p>
	{#if label}
		<p class="caption">{label}</p>
	{/if}
</div>

<style>
.hero-number {
	display: flex;
	flex-direction: column;
	gap: 10px;
	min-width: 0;
}

.value {
	display: flex;
	flex-wrap: wrap;
	align-items: baseline;
	gap: 0 12px;
	margin: 0;
	font-family: var(--font-num);
	font-weight: var(--num-weight);
	font-variant-numeric: tabular-nums;
	line-height: 0.85;
}

.to {
	font-size: min(112px, 30cqw);
}

.has-from .to {
	font-size: min(80px, 22cqw);
}

.from {
	font-size: min(44px, 12cqw);
}

.arrow {
	font-size: min(32px, 9cqw);
}

.accent .to {
	color: var(--color-gold);
}

.caption {
	margin: 0;
	font-family: var(--font-label);
	font-weight: var(--label-weight);
	text-transform: var(--label-case);
	letter-spacing: var(--label-tracking);
	font-size: 15px;
	line-height: 1.2;
}

:global([data-variant="b"]) .value {
	line-height: 0.95;
}

:global([data-variant="b"]) .to {
	font-size: min(88px, 24cqw);
	color: var(--color-ink);
}

:global([data-variant="b"]) .has-from .to {
	font-size: min(64px, 18cqw);
}

:global([data-variant="b"]) .from,
:global([data-variant="b"]) .arrow {
	color: var(--color-muted);
}

:global([data-variant="b"]) .accent .to {
	color: var(--color-win);
}

:global([data-variant="b"]) .caption {
	font-size: 14px;
	color: var(--color-muted);
}
</style>
