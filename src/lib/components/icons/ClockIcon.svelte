<script>
import Icon from "./Icon.svelte";
let { size = 14, strokeWidth = 2 } = $props();
</script>

<Icon {size} {strokeWidth}>
	{#snippet children()}
		<circle cx="12" cy="12" r="9" />
		<polyline points="12 7 12 12 15 14" />
	{/snippet}
</Icon>
