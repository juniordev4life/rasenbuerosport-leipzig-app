<script>
import Icon from "./Icon.svelte";
let { size = 22, strokeWidth = 1.8 } = $props();
</script>

<Icon {size} {strokeWidth}>
	{#snippet children()}
		<rect x="9" y="2" width="6" height="12" rx="3" />
		<path d="M5 11a7 7 0 0014 0M12 18v4M8 22h8" />
	{/snippet}
</Icon>
