<script>
import Icon from "./Icon.svelte";

let { size = 14, strokeWidth = 2 } = $props();
</script>

<Icon {size} {strokeWidth}>
	{#snippet children()}
		<path d="M13 2L4.5 13h6L11 22l8.5-11h-6L13 2z" />
	{/snippet}
</Icon>
