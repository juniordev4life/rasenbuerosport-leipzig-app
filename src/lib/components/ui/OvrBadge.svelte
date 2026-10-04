<script>
/**
 * OvrBadge - Overall rating badge with color coding (sofifa-style)
 * @param {number|null} rating - The overall rating (e.g., 84)
 * @param {"xs"|"sm"|"md"} [size="sm"] - Size variant
 */
let { rating = null, size = "sm" } = $props();

// Strong / good / fair / weak, on the shared chip colours.
const colorClass = $derived.by(() => {
	if (!rating) return "chip-muted";
	if (rating >= 80) return "chip-win";
	if (rating >= 70) return "chip-gold";
	if (rating >= 60) return "chip-loss";
	return "chip-muted";
});

const sizeClass = $derived(
	size === "xs"
		? "text-[10px]"
		: size === "md"
			? "text-sm px-2.5 py-1"
			: "text-xs",
);
</script>

{#if rating}
	<span class="chip {colorClass} {sizeClass}" aria-label="Overall rating: {rating}">
		{rating}
	</span>
{/if}
