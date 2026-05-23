<script>
import Icon from "./Icon.svelte";

let { size = 22, strokeWidth = 1.8 } = $props();
</script>

<Icon {size} {strokeWidth}>
	{#snippet children()}
		<path d="M12 8v4l2.5 2.5M12 3a9 9 0 109 9M3 5v4h4" />
	{/snippet}
</Icon>
