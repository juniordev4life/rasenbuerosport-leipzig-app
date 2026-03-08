<script>
	/**
	 * StarRating - Renders filled/half/empty star icons (sofifa-style)
	 * @param {number} rating - Rating from 0 to 5 (supports .5 increments)
	 * @param {"xs"|"sm"|"md"} [size="sm"] - Display size
	 */
	let { rating = 0, size = "sm" } = $props();

	const sizes = { xs: "w-3 h-3", sm: "w-4 h-4", md: "w-5 h-5" };
	const sizeClass = $derived(sizes[size] || sizes.sm);

	const stars = $derived(
		Array.from({ length: 5 }, (_, i) =>
			rating >= i + 1 ? "full" : rating >= i + 0.5 ? "half" : "empty",
		),
	);
</script>

<div
	class="inline-flex items-center gap-0.5"
	aria-label="Star rating: {rating} out of 5"
	role="img"
>
	{#each stars as type, i (i)}
		{#if type === "full"}
			<svg
				class="{sizeClass} text-warning"
				viewBox="0 0 24 24"
				fill="currentColor"
				aria-hidden="true"
			>
				<path
					d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
				/>
			</svg>
		{:else if type === "half"}
			<svg
				class="{sizeClass} text-warning"
				viewBox="0 0 24 24"
				aria-hidden="true"
			>
				<defs>
					<linearGradient id="half-star-{i}">
						<stop offset="50%" stop-color="currentColor" />
						<stop offset="50%" stop-color="var(--color-text-muted)" />
					</linearGradient>
				</defs>
				<path
					d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
					fill="url(#half-star-{i})"
				/>
			</svg>
		{:else}
			<svg
				class="{sizeClass} text-text-muted"
				viewBox="0 0 24 24"
				fill="currentColor"
				aria-hidden="true"
			>
				<path
					d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
				/>
			</svg>
		{/if}
	{/each}
</div>
