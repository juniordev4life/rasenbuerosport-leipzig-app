<script>
import { getTranslate } from "@tolgee/svelte";
import Sparkline from "$lib/components/leaderboard/Sparkline.svelte";

/**
 * Slide 7 — the ELO journey this season: start vs end rating, a
 * sparkline of the rating history, the season peak and the player's
 * league-wide rank.
 *
 * @type {{ recap: object }}
 */
let { recap } = $props();

const { t } = getTranslate();
const elo = $derived(recap.elo ?? {});

function formatDate(iso) {
	if (!iso) return "";
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return "";
	return d.toLocaleDateString("de-DE", { day: "2-digit", month: "short" });
}
</script>

<div class="flex flex-col items-center text-center gap-5 w-full">
	<h2 class="text-xs uppercase tracking-[0.2em] text-white/50 font-bold">
		{$t("season_recap.elo_journey.title")}
	</h2>

	<div class="flex items-center gap-3 text-3xl font-extrabold tabular-nums">
		<span class="text-white/50">{elo.start}</span>
		<span class="text-white/30 text-xl">{"→"}</span>
		<span class="text-[#84CC16]">{elo.end}</span>
	</div>

	{#if elo.history?.length > 1}
		<div class="w-full h-16">
			<Sparkline
				points={elo.history}
				width={280}
				height={64}
				stroke="#84CC16"
				strokeWidth={2}
				opacity={1}
				fluid
			/>
		</div>
	{/if}

	{#if elo.peak}
		<div class="text-sm text-white/60">
			{$t("season_recap.elo_journey.peak", {
				value: elo.peak.value,
				date: formatDate(elo.peak.played_at),
			})}
		</div>
	{/if}

	{#if elo.rank}
		<div class="rounded-full bg-white/10 px-4 py-2 text-sm font-bold">
			{$t("season_recap.elo_journey.rank", { rank: elo.rank, of: elo.of })}
		</div>
	{/if}
</div>
