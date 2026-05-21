<script>
import { getTranslate } from "@tolgee/svelte";
import MatchStatsDisplay from "$lib/components/games/MatchStatsDisplay.svelte";
import {
	DETAIL_STAT_DEFS,
	formatStatValue,
	getTopDetailStats,
	statWinner,
} from "$lib/utils/matchKpis.utils.js";

/**
 * Detail-statistics panel — surfaces the Top-5 most divergent stats
 * up-front, with an expand toggle that swaps in the full
 * `MatchStatsDisplay` (overview + passes + defense) for power users.
 *
 * @type {{ matchStats: object|null }}
 */
let { matchStats } = $props();

const { t } = getTranslate();

const topStats = $derived(getTopDetailStats(matchStats, 5));

let expanded = $state(false);
</script>

{#if topStats.length > 0}
	<section class="rounded-2xl border border-border bg-bg-secondary p-4 sm:p-5">
		<h3 class="text-[11px] tracking-[0.08em] uppercase text-text-muted font-semibold mb-3 flex items-center justify-between">
			<span>{$t("game_detail.section.detail_stats")}</span>
			<span class="text-text-secondary normal-case tracking-normal text-[11px] font-normal">
				{$t("game_detail.detail_stats.top_hint")}
			</span>
		</h3>

		{#if !expanded}
			<div class="flex flex-col">
				{#each topStats as stat (stat.key)}
					{@const winner = statWinner(stat.home, stat.away)}
					<div class="grid grid-cols-[1fr_auto_1fr] gap-3 sm:gap-4 items-center py-2.5 border-b border-border last:border-b-0">
						<div class="text-right text-base sm:text-lg font-semibold tabular-nums {winner === 'home' ? 'text-accent-red' : 'text-text-muted'}">
							{formatStatValue(stat.home, stat.decimals)}{stat.unit}
						</div>
						<div class="text-[10px] tracking-[0.05em] uppercase text-text-secondary text-center min-w-[100px]">
							{$t(stat.labelKey)}
						</div>
						<div class="text-left text-base sm:text-lg font-semibold tabular-nums {winner === 'away' ? 'text-success' : 'text-text-muted'}">
							{formatStatValue(stat.away, stat.decimals)}{stat.unit}
						</div>
					</div>
				{/each}
			</div>
			<button
				type="button"
				onclick={() => (expanded = true)}
				class="mt-3 w-full py-2.5 rounded-lg bg-bg-input hover:bg-bg-card text-sm text-text-secondary"
			>
				{$t("game_detail.detail_stats.expand", { count: DETAIL_STAT_DEFS.length })} ›
			</button>
		{:else}
			<MatchStatsDisplay {matchStats} />
			<button
				type="button"
				onclick={() => (expanded = false)}
				class="mt-3 w-full py-2.5 rounded-lg bg-bg-input hover:bg-bg-card text-sm text-text-secondary"
			>
				{$t("game_detail.detail_stats.collapse")} ‹
			</button>
		{/if}
	</section>
{/if}
