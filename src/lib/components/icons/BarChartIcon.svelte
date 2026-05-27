<script>
import Icon from "./Icon.svelte";

/**
 * Three-bar chart icon for statistics / career-overview headers.
 * Bars rise from a shared baseline to suggest a numeric breakdown
 * without locking the meaning to "increase" (the data is just
 * "stats").
 */
let { size = 22, strokeWidth = 1.8 } = $props();
</script>

<Icon {size} {strokeWidth}>
	{#snippet children()}
		<line x1="3" y1="21" x2="21" y2="21" />
		<line x1="6" y1="21" x2="6" y2="14" />
		<line x1="12" y1="21" x2="12" y2="9" />
		<line x1="18" y1="21" x2="18" y2="5" />
	{/snippet}
</Icon>
