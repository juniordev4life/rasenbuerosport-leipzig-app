<script>
import Icon from "./Icon.svelte";

/**
 * Two-person icon for relationship / multi-player sections
 * (Lieblingsgegner & Co.). One front-facing user with a slightly
 * offset second silhouette — keeps the bullhead-detail minimal so
 * the icon still reads at 12–16 px.
 */
let { size = 22, strokeWidth = 1.8 } = $props();
</script>

<Icon {size} {strokeWidth}>
	{#snippet children()}
		<circle cx="9" cy="8" r="3.5" />
		<path d="M2 21c0-3.9 3.1-7 7-7s7 3.1 7 7" />
		<circle cx="17" cy="6.5" r="2.5" />
		<path d="M16 13.2c2.4.4 4.5 2.4 5 4.8" />
	{/snippet}
</Icon>
