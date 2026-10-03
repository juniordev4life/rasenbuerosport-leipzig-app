<script>
import PadlockIcon from "$lib/components/icons/PadlockIcon.svelte";
import { RARITY_META } from "$lib/constants/trophies.constants.js";
import TrophyCategoryIcon from "./TrophyCategoryIcon.svelte";

/**
 * A trophy's medal: the rarity tier as a square tile in design A and as
 * a metallic disc in design B, with the category glyph on it. A locked
 * trophy gets an empty, dashed slot with a padlock, so its state never
 * rests on colour alone. Decorative: the trophy's name and rarity are
 * always printed next to it.
 *
 * The size comes from `size` or, when that is omitted, from a
 * `--medal-size` custom property set by the parent (44 px otherwise),
 * so a parent can size it per design in its own CSS.
 *
 * @type {{
 *   rarity: string,
 *   category?: string|null,
 *   locked?: boolean,
 *   size?: number|null,
 * }}
 */
let { rarity, category = null, locked = false, size = null } = $props();

const tier = $derived(RARITY_META[rarity] ?? RARITY_META.silver);
</script>

<span
	class="medal"
	class:locked
	data-tier={rarity}
	style:--tier={tier.color}
	style:--on-tier={tier.onColor}
	style:--medal-size={size ? `${size}px` : undefined}
	aria-hidden="true"
>
	{#if locked}
		<PadlockIcon size={24} strokeWidth={2} />
	{:else if category}
		<TrophyCategoryIcon {category} size={24} strokeWidth={2} />
	{/if}
</span>

<style>
/* ── Design A: a square tile in the tier colour ─────────────────────── */
.medal {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	box-sizing: border-box;
	width: var(--medal-size, 44px);
	height: var(--medal-size, 44px);
	border-radius: var(--radius-tile);
	background: var(--tier);
	color: var(--on-tier);
}

/* The glyph scales with the medal (CSS beats the SVG's size attributes). */
.medal :global(svg) {
	width: 58%;
	height: 58%;
}

.medal.locked {
	border: 1px dashed var(--color-muted);
	background: var(--color-sunken);
	color: var(--color-muted);
}

.medal.locked :global(svg) {
	width: 46%;
	height: 46%;
}

/* ── Design B: a metallic disc, lit from the top left ───────────────── */
:global([data-variant="b"]) .medal {
	border-radius: 999px;
	background: radial-gradient(
		circle at 35% 30%,
		color-mix(in srgb, var(--tier) 40%, var(--color-white)),
		var(--tier) 60%,
		color-mix(in srgb, var(--tier) 80%, var(--color-black))
	);
	box-shadow: 0 2px 0 color-mix(in srgb, var(--tier) 65%, var(--color-black));
}

:global([data-variant="b"]) .medal.locked {
	border: 2px dashed color-mix(in srgb, var(--color-muted) 40%, var(--color-surface));
	background: var(--color-sunken);
	box-shadow: none;
	color: var(--color-muted);
}
</style>
