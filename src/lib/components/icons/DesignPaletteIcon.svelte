<script>
import Icon from "./Icon.svelte";

/**
 * Painter's palette line icon for the design (look) settings.
 *
 * @type {{ size?: number, strokeWidth?: number }}
 */
let { size = 22, strokeWidth = 1.8 } = $props();
</script>

<Icon {size} {strokeWidth}>
	{#snippet children()}
		<path
			d="M12 3a9 9 0 000 18c1.4 0 2.2-1 2.2-2.1 0-.6-.2-1-.5-1.4-.3-.4-.5-.8-.5-1.3 0-1.1.9-1.9 2-1.9h2.2A4.6 4.6 0 0021 9.7C21 5.9 17 3 12 3z"
		/>
		<circle cx="7.5" cy="11" r="1.2" />
		<circle cx="10" cy="7.2" r="1.2" />
		<circle cx="14.6" cy="7.2" r="1.2" />
	{/snippet}
</Icon>
