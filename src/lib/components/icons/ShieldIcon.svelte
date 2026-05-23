<script>
import Icon from "./Icon.svelte";

let { size = 14, strokeWidth = 2 } = $props();
</script>

<Icon {size} {strokeWidth}>
	{#snippet children()}
		<path d="M12 2L4 6v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V6l-8-4z" />
	{/snippet}
</Icon>
