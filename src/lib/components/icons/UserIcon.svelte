<script>
import Icon from "./Icon.svelte";
let { size = 22, strokeWidth = 1.8 } = $props();
</script>

<Icon {size} {strokeWidth}>
	{#snippet children()}
		<circle cx="12" cy="8" r="4" />
		<path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
	{/snippet}
</Icon>
