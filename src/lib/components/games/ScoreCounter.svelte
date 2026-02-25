<script>
	let { value = $bindable(0) } = $props();

	function increment() {
		value = Math.min(value + 1, 99);
	}

	function decrement() {
		value = Math.max(value - 1, 0);
	}
</script>

<div class="flex flex-col items-center gap-1">
	<button
		type="button"
		onclick={increment}
		class="w-10 h-10 rounded-lg bg-bg-input border border-border flex items-center justify-center text-text-primary hover:bg-border transition-colors"
		aria-label="Increase score"
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="h-5 w-5"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
			stroke-width="2"
		>
			<path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7" />
		</svg>
	</button>

	<span class="text-4xl font-bold text-text-primary tabular-nums min-w-[3ch] text-center">
		{value}
	</span>

	<button
		type="button"
		onclick={decrement}
		class="w-10 h-10 rounded-lg bg-bg-input border border-border flex items-center justify-center text-text-primary hover:bg-border transition-colors"
		aria-label="Decrease score"
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="h-5 w-5"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
			stroke-width="2"
		>
			<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
		</svg>
	</button>
</div>
