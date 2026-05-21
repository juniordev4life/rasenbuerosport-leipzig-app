<script>
import { getTranslate } from "@tolgee/svelte";

/**
 * Up to 3 top badges as a small row.
 * Consumes the shared badge shape from getUserStats: { type, emoji, unlocked, ... }.
 * @type {{ badges: Array<{ type:string, emoji:string }> }}
 */
let { badges = [] } = $props();

const { t } = getTranslate();

const TIER_RING = {
	gold: "ring-warning",
	silber: "ring-silver",
	silver: "ring-silver",
	bronze: "ring-accent-red",
	platin: "ring-text-secondary",
	diamant: "ring-success",
};

/**
 * Extract the tier suffix from a badge type like "torjaeger_gold" → "gold".
 * @param {string} type
 * @returns {string|null}
 */
function tierOf(type) {
	if (!type) return null;
	const parts = type.split("_");
	return parts[parts.length - 1];
}
</script>

<div class="bg-bg-secondary border border-border rounded-2xl p-4">
	<h2 class="mb-3 text-sm font-semibold text-text-secondary uppercase tracking-wide">
		{$t("player_profile.top_badges_title")}
	</h2>
	{#if badges.length === 0}
		<p class="text-xs italic text-text-muted">{$t("player_profile.no_badges")}</p>
	{:else}
		<div class="flex flex-wrap gap-3">
			{#each badges as badge, idx (badge.type ?? idx)}
				{@const tier = tierOf(badge.type)}
				<div class="flex items-center gap-2">
					<div
						class="flex h-12 w-12 items-center justify-center rounded-full bg-bg-primary text-2xl ring-2 {TIER_RING[
							tier
						] ?? 'ring-border'}"
						title={$t(`profile.badges.${badge.type}`)}
					>
						{badge.emoji}
					</div>
					<span class="text-xs font-semibold text-text-primary">
						{$t(`profile.badges.${badge.type}`)}
					</span>
				</div>
			{/each}
		</div>
	{/if}
</div>
