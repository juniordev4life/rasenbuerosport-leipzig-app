<script>
import Icon from "./Icon.svelte";
let { size = 22, strokeWidth = 1.8 } = $props();
</script>

<Icon {size} {strokeWidth}>
	{#snippet children()}
		<path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-5v-7h-6v7H4a1 1 0 01-1-1v-9.5z" />
	{/snippet}
</Icon>
