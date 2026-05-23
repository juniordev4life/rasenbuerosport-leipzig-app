<script>
import Icon from "./Icon.svelte";
let { size = 14, strokeWidth = 2 } = $props();
</script>

<Icon {size} {strokeWidth}>
	{#snippet children()}
		<circle cx="12" cy="12" r="9" />
		<path d="M12 3v18M3 12h18" />
	{/snippet}
</Icon>
