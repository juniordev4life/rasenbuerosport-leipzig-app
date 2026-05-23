<script>
import Icon from "./Icon.svelte";
let { size = 22, strokeWidth = 2.4 } = $props();
</script>

<Icon {size} {strokeWidth}>
	{#snippet children()}
		<path d="M12 5v14M5 12h14" />
	{/snippet}
</Icon>
