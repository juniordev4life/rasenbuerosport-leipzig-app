<script>
/**
 * Renders a gold/silver/bronze medal emoji for ranks 1–3, otherwise the
 * plain rank number. Kept as its own component so list rows can stay
 * declarative.
 *
 * @type {{ rank: number }}
 */
let { rank } = $props();

const MEDALS = ["\u{1F947}", "\u{1F948}", "\u{1F949}"];
const medal = $derived(rank >= 1 && rank <= 3 ? MEDALS[rank - 1] : null);
</script>

<div class="rank-indicator">
	{#if medal}
		<span class="rank-medal" aria-hidden="true">{medal}</span>
	{:else}
		<span class="rank-num">{rank}</span>
	{/if}
</div>

<style>
.rank-indicator {
	width: 28px;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}
.rank-medal { font-size: 22px; line-height: 1; }
.rank-num {
	font-size: 15px;
	font-weight: 700;
	color: #6B7280;
	font-variant-numeric: tabular-nums;
}
</style>
