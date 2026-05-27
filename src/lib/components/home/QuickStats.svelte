<script>
import { getTranslate } from "@tolgee/svelte";
import InfoTip from "$lib/components/ui/InfoTip.svelte";

/**
 * ELO + last-five form pills in one compact row.
 *
 * @type {{
 *   elo: number|null,
 *   eloDelta: number|null,
 *   lastFive: Array<"W"|"L"|"D">,
 * }}
 */
let { elo = null, eloDelta = null, lastFive = [] } = $props();

const { t } = getTranslate();

function formatDelta(n) {
	if (n === null || n === undefined) return null;
	const r = Math.round(n);
	if (r > 0) return `↑ +${r}`;
	if (r < 0) return `↓ ${r}`;
	return "±0";
}

const trendClass = $derived(
	eloDelta == null || eloDelta === 0
		? "bg-bg-input border-border text-text-muted"
		: eloDelta > 0
			? "bg-success/15 border-success/30 text-success"
			: "bg-accent-red/15 border-accent-red/30 text-accent-red",
);
</script>

<div class="bg-bg-card border border-border rounded-2xl px-4 py-3">
	<div class="flex items-center gap-4">
		<div class="flex flex-col gap-1">
			<div class="flex items-baseline gap-1.5">
				<span class="text-[28px] font-extrabold leading-none tabular-nums -tracking-[0.02em]">
					{elo ?? "—"}
				</span>
				<InfoTip titleKey="info_tips.elo.title" bodyKey="info_tips.elo.body" />
			</div>
			{#if eloDelta != null}
				<span class="inline-flex items-center gap-1 text-[10px] font-bold border rounded-full px-2 py-0.5 w-fit {trendClass}">
					{formatDelta(eloDelta)} {$t("home.quick_stats.this_week")}
				</span>
			{/if}
		</div>
		<div class="ml-auto flex flex-col gap-1.5 items-end">
			<div class="text-[9px] uppercase tracking-[0.08em] font-bold text-text-muted">
				{$t("home.quick_stats.last_five")}
			</div>
			<div class="flex gap-1">
				{#each lastFive as r, i (i)}
					<span
						class="w-[22px] h-[22px] rounded-md flex items-center justify-center text-[10px] font-extrabold border-[1.5px] {r === 'W'
							? 'bg-success/15 text-success border-success/30'
							: r === 'L'
								? 'bg-accent-red/15 text-accent-red border-accent-red/30'
								: 'bg-warning/15 text-warning border-warning/30'}"
					>
						{r === "W" ? "S" : r === "L" ? "N" : "U"}
					</span>
				{/each}
				{#if lastFive.length === 0}
					<span class="text-[10px] text-text-muted italic">{$t("home.quick_stats.no_form")}</span>
				{/if}
			</div>
		</div>
	</div>
</div>
