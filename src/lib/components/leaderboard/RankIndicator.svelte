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

<div class="w-7 flex items-center justify-center shrink-0">
	{#if medal}
		<span class="text-[22px] leading-none" aria-hidden="true">{medal}</span>
	{:else}
		<span class="text-[15px] font-bold text-muted tabular-nums">{rank}</span>
	{/if}
</div>
