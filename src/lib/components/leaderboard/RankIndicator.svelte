<script>
/**
 * Rank figure of a ranking row. Design A: a red display number. Design
 * B: a round badge — gold, silver and bronze for the top three, a plain
 * figure below. A parent can recolour it with `--rank-color` (e.g. white
 * on the highlighted own row, muted for unranked players).
 *
 * @type {{ rank: number|null }}
 */
let { rank } = $props();

const podium = $derived(rank >= 1 && rank <= 3 ? rank : null);
</script>

<span class="rank {podium ? `place-${podium}` : ''}">{rank ?? "—"}</span>

<style>
.rank {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	min-width: 26px;
	font-family: var(--font-display);
	font-size: 22px;
	line-height: 0.8;
	font-variant-numeric: tabular-nums;
	color: var(--rank-color, var(--color-brand));
}

:global([data-variant="b"]) .rank {
	width: 26px;
	height: 26px;
	border-radius: 999px;
	font-family: var(--font-cond);
	font-weight: 800;
	font-size: 14px;
	line-height: 1;
	color: var(--rank-color, var(--color-ink));
}

:global([data-variant="b"]) .place-1 {
	background: var(--color-gold);
	color: var(--color-on-gold);
}

:global([data-variant="b"]) .place-2 {
	background: var(--color-line);
	color: var(--color-ink);
}

:global([data-variant="b"]) .place-3 {
	background: color-mix(
		in srgb,
		var(--color-tier-bronze) 35%,
		var(--color-surface)
	);
	color: var(--color-ink);
}
</style>
