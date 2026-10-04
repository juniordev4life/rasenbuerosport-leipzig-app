<script>
/**
 * One content block of a season-recap slide. Design A: the block sits
 * straight on the red or navy story frame in white type, or — with
 * `panel` — in a white inset panel like the panels inside the A hero
 * bands (lists, quotes, the audio player). Design B: always a white
 * sticker card on the pitch.
 *
 * @type {{ panel?: boolean, children: import('svelte').Snippet }}
 */
let { panel = false, children } = $props();
</script>

<div class="block" class:panel>
	{@render children()}
</div>

<style>
.block {
	display: flex;
	flex-direction: column;
	gap: 14px;
	min-width: 0;
}

.panel {
	--focus-ring: var(--color-ink);
	padding: 16px;
	background: var(--color-surface);
	color: var(--color-ink);
	border-radius: var(--radius-tile);
}

.panel :global(.recap-note) {
	color: var(--color-muted);
}

:global([data-variant="b"]) .block {
	--focus-ring: var(--color-ink);
	padding: 18px;
	background: var(--color-surface);
	color: var(--color-ink);
	border-radius: var(--radius-card);
	box-shadow: var(--shadow-card);
}
</style>
