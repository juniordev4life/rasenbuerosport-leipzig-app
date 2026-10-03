<script>
import { designVariant } from "$lib/stores/designVariant.stores.js";

/**
 * The signed-in player's running series (win / loss streaks, scoring,
 * clean sheets). Design A: the count in big red display type. Design B:
 * the count fanned out as cards, like a referee's hand.
 *
 * @type {{ series: Array<{ id: string, type: string, headline: string, detail: string, count: number, label: string }> }}
 */
let { series = [] } = $props();

/** Fan of up to five cards, rotated around the middle one. */
const FAN = [-16, -8, 0, 8, 16];

function fanFor(count) {
	const n = Math.min(Math.max(count ?? 1, 1), FAN.length);
	const start = Math.floor((FAN.length - n) / 2);
	return FAN.slice(start, start + n);
}
</script>

<div class="flex flex-col gap-3">
	{#each series as s (s.id)}
		<div class="card serie {s.type}">
			{#if $designVariant === "b"}
				<div class="fan" aria-hidden="true">
					{#each fanFor(s.count) as angle, i (i)}
						<span class="fan-card" style="--angle: {angle}deg; --i: {i};"></span>
					{/each}
				</div>
			{:else}
				<span class="count num" aria-hidden="true">{s.count}</span>
			{/if}
			<div class="flex flex-col gap-1 min-w-0">
				<span class="kicker">{s.label}</span>
				<span class="line">{s.count} {s.label}</span>
				<span class="text-sm leading-snug">{s.headline}</span>
			</div>
		</div>
	{/each}
</div>

<style>
.serie {
	display: flex;
	align-items: center;
	gap: 16px;
	padding: 16px;
}

.count {
	font-size: 64px;
	line-height: 0.8;
	color: var(--color-brand);
}

.win_streak .count,
.defensive .count {
	color: var(--color-win);
}

.kicker {
	font-family: var(--font-cond);
	font-weight: 700;
	font-size: 16px;
	letter-spacing: 0.03em;
	text-transform: uppercase;
}

.line {
	display: none;
}

/* Design B */
.fan {
	position: relative;
	width: 96px;
	height: 64px;
	flex-shrink: 0;
}

.fan-card {
	position: absolute;
	left: calc(var(--i) * 17px);
	top: 10px;
	width: 26px;
	height: 36px;
	border: 2px solid var(--color-surface);
	border-radius: 4px;
	background: var(--color-brand);
	box-shadow: var(--shadow-control);
	transform: rotate(var(--angle));
}

.win_streak .fan-card,
.defensive .fan-card {
	background: var(--color-win);
}

.scoring .fan-card {
	background: var(--color-gold);
}

/* B names the series in one line under the fan instead. */
:global([data-variant="b"]) .kicker {
	display: none;
}

:global([data-variant="b"]) .line {
	display: block;
	font-family: var(--font-cond);
	font-weight: 800;
	font-size: 20px;
	line-height: 1.1;
}

:global([data-variant="b"]) .serie {
	padding: 18px;
}
</style>
