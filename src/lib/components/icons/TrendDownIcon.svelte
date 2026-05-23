<script>
import Icon from "./Icon.svelte";
let { size = 14, strokeWidth = 2 } = $props();
</script>

<Icon {size} {strokeWidth}>
	{#snippet children()}
		<polyline points="17 18 9 18 9 10" />
		<line x1="9" y1="18" x2="20" y2="7" />
	{/snippet}
</Icon>
