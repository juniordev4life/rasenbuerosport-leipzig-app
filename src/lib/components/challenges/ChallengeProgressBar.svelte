<script>
/**
 * Compact progress bar for a single challenge. Driven by `current` / `target`.
 * Fills the bar in `bg-accent-red`, switches to `bg-success` when completed.
 *
 * @typedef {Object} ChallengeProgressBarProps
 * @property {number} current
 * @property {number} target
 * @property {boolean} [completed]
 * @property {"sm"|"md"} [size="md"]
 */
let { current, target, completed = false, size = "md" } = $props();

const ratio = $derived(
	target > 0 ? Math.min(1, Math.max(0, current / target)) : 0,
);
const widthPct = $derived(ratio * 100);
const heightClass = $derived(size === "sm" ? "h-1.5" : "h-2");
</script>

<div class="flex flex-col gap-1">
	<div class="relative w-full {heightClass} rounded-full bg-bg-input overflow-hidden">
		<div
			class="absolute inset-y-0 left-0 transition-all duration-300 {completed
				? 'bg-success'
				: 'bg-accent-red'}"
			style="width: {widthPct}%;"
		></div>
	</div>
	<div class="flex items-center justify-between text-[10px] tabular-nums text-text-secondary">
		<span>{current} / {target}</span>
		{#if completed}
			<span class="text-success font-medium">✓</span>
		{/if}
	</div>
</div>
