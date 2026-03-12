<script>
/**
 * OvrBadge - Overall rating badge with color coding (sofifa-style)
 * @param {number|null} rating - The overall rating (e.g., 84)
 * @param {"xs"|"sm"|"md"} [size="sm"] - Size variant
 */
let { rating = null, size = "sm" } = $props();

const colorClass = $derived.by(() => {
	if (!rating) return "bg-bg-input text-text-secondary";
	if (rating >= 80) return "bg-success/20 text-success";
	if (rating >= 70) return "bg-warning/20 text-warning";
	if (rating >= 60) return "bg-accent-red/20 text-accent-red-light";
	return "bg-bg-input text-text-secondary";
});

const sizeClass = $derived(
	size === "xs"
		? "text-[10px] px-1.5 py-0.5"
		: size === "md"
			? "text-sm px-2.5 py-1"
			: "text-xs px-2 py-0.5",
);
</script>

{#if rating}
	<span
		class="inline-flex items-center font-bold rounded-md {colorClass} {sizeClass}"
		aria-label="Overall rating: {rating}"
	>
		{rating}
	</span>
{/if}
