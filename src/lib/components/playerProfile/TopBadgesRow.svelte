<script>
import { getTranslate } from "@tolgee/svelte";

/**
 * Up to 3 top badges as a small row.
 * @type {{ badges: Array<{ id:string, name:string, icon:string, tier?:string, description?:string }> }}
 */
let { badges = [] } = $props();

const { t } = getTranslate();

const TIER_RING = {
	gold: "ring-warning",
	silber: "ring-silver",
	silver: "ring-silver",
	bronze: "ring-accent-red",
};
</script>

<div class="bg-bg-secondary border border-border rounded-2xl p-4">
	<h2 class="mb-3 text-sm font-semibold text-text-secondary uppercase tracking-wide">
		{$t("player_profile.top_badges_title")}
	</h2>
	{#if badges.length === 0}
		<p class="text-xs italic text-text-muted">{$t("player_profile.no_badges")}</p>
	{:else}
		<div class="flex flex-wrap gap-3">
			{#each badges as badge (badge.id)}
				<div class="flex items-center gap-2">
					<div
						class="flex h-12 w-12 items-center justify-center rounded-full bg-bg-primary text-2xl ring-2 {TIER_RING[
							badge.tier
						] ?? 'ring-border'}"
						title={badge.description ?? badge.name}
					>
						{badge.icon}
					</div>
					<span class="text-xs font-semibold text-text-primary">{badge.name}</span>
				</div>
			{/each}
		</div>
	{/if}
</div>
