<script>
import Icon from "./Icon.svelte";

/**
 * Crosshair / target icon for character-related section headers
 * (Spielercharakter / Stärken-Profil). Three concentric circles with
 * cross-hairs through them, matching the line-icon style of the rest
 * of the set.
 */
let { size = 22, strokeWidth = 1.8 } = $props();
</script>

<Icon {size} {strokeWidth}>
	{#snippet children()}
		<circle cx="12" cy="12" r="9" />
		<circle cx="12" cy="12" r="5" />
		<line x1="12" y1="2" x2="12" y2="5" />
		<line x1="12" y1="19" x2="12" y2="22" />
		<line x1="2" y1="12" x2="5" y2="12" />
		<line x1="19" y1="12" x2="22" y2="12" />
	{/snippet}
</Icon>
