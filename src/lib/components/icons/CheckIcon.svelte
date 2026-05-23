<script>
import Icon from "./Icon.svelte";
let { size = 14, strokeWidth = 2.5 } = $props();
</script>

<Icon {size} {strokeWidth}>
	{#snippet children()}
		<polyline points="20 6 9 17 4 12" />
	{/snippet}
</Icon>
