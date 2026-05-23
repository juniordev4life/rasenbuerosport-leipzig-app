<script>
import Icon from "./Icon.svelte";
let { size = 18, strokeWidth = 1.8 } = $props();
</script>

<Icon {size} {strokeWidth}>
	{#snippet children()}
		<path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
		<polyline points="16 17 21 12 16 7" />
		<line x1="21" y1="12" x2="9" y2="12" />
	{/snippet}
</Icon>
