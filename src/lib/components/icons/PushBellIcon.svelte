<script>
import Icon from "./Icon.svelte";

/**
 * Bell line icon for push notifications (settings, soft prompt).
 *
 * @type {{ size?: number, strokeWidth?: number }}
 */
let { size = 22, strokeWidth = 1.8 } = $props();
</script>

<Icon {size} {strokeWidth}>
	{#snippet children()}
		<path d="M18 8.5a6 6 0 10-12 0c0 6.5-3 8.5-3 8.5h18s-3-2-3-8.5" />
		<path d="M13.7 20.5a2 2 0 01-3.4 0" />
	{/snippet}
</Icon>
