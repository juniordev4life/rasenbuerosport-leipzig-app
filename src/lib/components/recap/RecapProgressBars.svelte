<script>
/**
 * Instagram-story-style progress bars at the top of the recap story —
 * one segment per slide, filled according to
 * {@link import('$lib/utils/recapStory.utils.js').slideProgressRatios}.
 *
 * @type {{ ratios: number[] }}
 */
let { ratios = [] } = $props();
</script>

<div class="flex gap-1 px-3 pt-3">
	{#each ratios as ratio, i (i)}
		<div class="h-[3px] flex-1 rounded-full bg-white/25 overflow-hidden">
			<div class="h-full bg-white rounded-full" style:width="{ratio * 100}%"></div>
		</div>
	{/each}
</div>
