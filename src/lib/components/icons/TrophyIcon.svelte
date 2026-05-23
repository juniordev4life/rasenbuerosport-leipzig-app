<script>
import Icon from "./Icon.svelte";
let { size = 22, strokeWidth = 1.8 } = $props();
</script>

<Icon {size} {strokeWidth}>
	{#snippet children()}
		<path d="M8 21h8M12 17v4M7 4h10v3a5 5 0 01-10 0V4zM7 4H4v2a3 3 0 003 3M17 4h3v2a3 3 0 01-3 3" />
	{/snippet}
</Icon>
