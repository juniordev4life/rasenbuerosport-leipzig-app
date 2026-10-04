<script>
import Icon from "./Icon.svelte";

/**
 * Closed padlock for content that is not unlocked yet (trophies the
 * player has not earned, hidden trophies). Pair it with a text label or
 * an accessible name: the icon itself is decorative.
 */
let { size = 22, strokeWidth = 1.8 } = $props();
</script>

<Icon {size} {strokeWidth}>
	{#snippet children()}
		<rect x="4.5" y="11" width="15" height="10" rx="2" />
		<path d="M8 11V7.5a4 4 0 0 1 8 0V11" />
		<line x1="12" y1="15" x2="12" y2="17" />
	{/snippet}
</Icon>
