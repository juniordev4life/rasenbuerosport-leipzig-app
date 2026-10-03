<script>
/**
 * Instagram-story-style progress bars at the top of the recap story —
 * one segment per slide, filled according to
 * {@link import('$lib/utils/recapStory.utils.js').slideProgressRatios}.
 * They take the text colour of the story frame (white on red, navy and
 * the pitch); square in design A, rounded in design B.
 *
 * @type {{ ratios: number[] }}
 */
let { ratios = [] } = $props();
</script>

<div class="bars" aria-hidden="true">
	{#each ratios as ratio, i (i)}
		<div class="bar">
			<div class="fill" style:width="{ratio * 100}%"></div>
		</div>
	{/each}
</div>

<style>
.bars {
	display: flex;
	gap: 4px;
}

.bar {
	flex: 1;
	height: 4px;
	overflow: hidden;
	border-radius: var(--radius-bar);
	background: color-mix(in srgb, currentColor 35%, transparent);
}

.fill {
	height: 100%;
	border-radius: var(--radius-bar);
	background: currentColor;
}
</style>
