<script>
import { getTranslate } from "@tolgee/svelte";
import {
	formatStatValue,
	getHeadlineKpis,
	statBarShares,
	statWinner,
} from "$lib/utils/matchKpis.utils.js";

/**
 * Headline KPI grid (possession, xG, shots, shot quality) with a
 * proportional two-tone bar under each value pair.
 *
 * @type {{ matchStats: object|null }}
 */
let { matchStats } = $props();

const { t } = getTranslate();

const kpis = $derived(getHeadlineKpis(matchStats));
</script>

{#if kpis.length > 0}
	<section class="rounded-2xl border border-border bg-bg-secondary p-4 sm:p-5">
		<h3 class="text-[11px] tracking-[0.08em] uppercase text-text-muted font-semibold mb-3">
			{$t("game_detail.section.kpis")}
		</h3>
		<div class="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
			{#each kpis as kpi (kpi.key)}
				{@const winner = statWinner(kpi.home, kpi.away)}
				{@const bar = statBarShares(kpi.home, kpi.away)}
				<div class="rounded-xl bg-bg-input p-3">
					<div class="text-[10px] tracking-[0.05em] uppercase text-text-secondary mb-2">
						{$t(kpi.labelKey)}
					</div>
					<div class="flex items-center justify-between mb-2">
						<span class="text-lg sm:text-xl font-semibold tabular-nums {winner === 'home' ? 'text-accent-red' : 'text-text-muted'}">
							{formatStatValue(kpi.home, kpi.decimals)}{kpi.unit}
						</span>
						<span class="text-lg sm:text-xl font-semibold tabular-nums {winner === 'away' ? 'text-success' : 'text-text-muted'}">
							{formatStatValue(kpi.away, kpi.decimals)}{kpi.unit}
						</span>
					</div>
					<div class="flex h-1 rounded-full overflow-hidden bg-border">
						<div class="bg-accent-red h-full" style="width: {bar.home}%;"></div>
						<div class="bg-success h-full" style="width: {bar.away}%;"></div>
					</div>
				</div>
			{/each}
		</div>
	</section>
{/if}
