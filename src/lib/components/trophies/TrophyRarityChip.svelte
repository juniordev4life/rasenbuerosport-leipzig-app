<script>
import { getTranslate } from "@tolgee/svelte";
import { RARITY_META } from "$lib/constants/trophies.constants.js";

/**
 * A trophy's rarity named in text ("Bronze", "Gold", …), so the tier
 * never rests on the medal colour alone. Design A: a solid chip in the
 * tier colour. Design B: a pale tint of the tier with darker text.
 * Renders nothing for an unknown rarity.
 *
 * @type {{ rarity: string }}
 */
let { rarity } = $props();

const { t } = getTranslate();

const meta = $derived(RARITY_META[rarity] ?? null);
</script>

{#if meta}
	<span class="chip rarity" style:--tier={meta.color} style:--on-tier={meta.onColor}>
		{$t(meta.i18nKey)}
	</span>
{/if}

<style>
.rarity {
	background: var(--tier);
	color: var(--on-tier);
}

/* B: a pale tint; the text is the tier pulled towards navy (≥ 6:1). */
:global([data-variant="b"]) .rarity {
	padding: 2px 8px;
	background: color-mix(in srgb, var(--tier) 25%, var(--color-surface));
	color: color-mix(in srgb, var(--tier) 35%, var(--color-ink));
}
</style>
