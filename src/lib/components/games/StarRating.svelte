<script>
	let { value = $bindable(0), max = 5 } = $props();

	function setRating(rating) {
		value = rating;
	}
</script>

<div class="flex gap-1">
	{#each Array(max) as _, i}
		<button
			type="button"
			onclick={() => setRating(i + 1)}
			class="text-2xl transition-colors {i < value ? 'text-warning' : 'text-bg-input'}"
			aria-label="Rate {i + 1} stars"
		>
			&#9733;
		</button>
	{/each}
</div>
