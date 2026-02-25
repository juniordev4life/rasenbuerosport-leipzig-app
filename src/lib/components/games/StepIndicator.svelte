<script>
	let { currentStep = 1, totalSteps = 3, labels = [] } = $props();
</script>

<div class="flex items-center justify-center gap-2">
	{#each Array(totalSteps) as _, i}
		<div class="flex items-center gap-2">
			<div
				class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors {i + 1 <= currentStep ? 'bg-accent-red text-white' : 'bg-bg-input text-text-secondary'}"
			>
				{i + 1}
			</div>
			{#if i < totalSteps - 1}
				<div
					class="w-8 h-0.5 {i + 1 < currentStep ? 'bg-accent-red' : 'bg-bg-input'}"
				></div>
			{/if}
		</div>
	{/each}
</div>
