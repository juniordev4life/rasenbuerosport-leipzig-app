<script>
import { getTranslate } from "@tolgee/svelte";
import CountUpNumber from "../CountUpNumber.svelte";

/**
 * Slide 2 — the season in numbers: games, W/D/L, win rate and the
 * player's rank among the league for wins.
 *
 * @type {{ recap: object, reducedMotion: boolean }}
 */
let { recap, reducedMotion } = $props();

const { t } = getTranslate();
const stats = $derived(recap.stats ?? {});
const winPct = $derived(Math.round((stats.win_rate ?? 0) * 100));
</script>

<div class="flex flex-col items-center text-center gap-6 w-full">
	<h2 class="text-xs uppercase tracking-[0.2em] text-white/50 font-bold">
		{$t("season_recap.numbers.title")}
	</h2>

	<div class="text-6xl font-extrabold text-white">
		<CountUpNumber value={winPct} suffix="%" reduced={reducedMotion} />
	</div>
	<p class="text-sm text-white/60 -mt-4">{$t("season_recap.numbers.win_rate")}</p>

	<div class="grid grid-cols-3 gap-3 w-full max-w-xs">
		<div class="flex flex-col items-center">
			<div class="text-2xl font-extrabold text-[#84CC16]">
				<CountUpNumber value={stats.wins ?? 0} reduced={reducedMotion} />
			</div>
			<div class="text-[11px] text-white/50 mt-1">{$t("season_recap.numbers.wins")}</div>
		</div>
		<div class="flex flex-col items-center">
			<div class="text-2xl font-extrabold text-white/80">
				<CountUpNumber value={stats.draws ?? 0} reduced={reducedMotion} />
			</div>
			<div class="text-[11px] text-white/50 mt-1">{$t("season_recap.numbers.draws")}</div>
		</div>
		<div class="flex flex-col items-center">
			<div class="text-2xl font-extrabold text-[#E24B4A]">
				<CountUpNumber value={stats.losses ?? 0} reduced={reducedMotion} />
			</div>
			<div class="text-[11px] text-white/50 mt-1">{$t("season_recap.numbers.losses")}</div>
		</div>
	</div>

	<div class="text-sm text-white/70 mt-2">
		{$t("season_recap.numbers.games_played", { count: stats.games })}
	</div>

	{#if stats.ranks?.wins}
		<div class="mt-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold">
			{$t("season_recap.numbers.rank", {
				rank: stats.ranks.wins.rank,
				of: stats.ranks.wins.of,
			})}
		</div>
	{/if}
</div>
