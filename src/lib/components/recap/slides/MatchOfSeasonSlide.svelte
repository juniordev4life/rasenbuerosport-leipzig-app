<script>
import { getTranslate } from "@tolgee/svelte";

/**
 * Slide 6 — the match of the season, plus a few small season facts
 * (biggest win, highest-scoring game, most common score, favorite and
 * best club).
 *
 * @type {{ recap: object }}
 */
let { recap } = $props();

const { t } = getTranslate();
const stats = $derived(recap.stats ?? {});
const mos = $derived(stats.match_of_season);

function formatDate(iso) {
	if (!iso) return "";
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return "";
	return d.toLocaleDateString("de-DE", { day: "2-digit", month: "short" });
}
</script>

<div class="flex flex-col items-center text-center gap-4 w-full">
	<h2 class="text-xs uppercase tracking-[0.2em] text-white/50 font-bold">
		{$t("season_recap.match_of_season.title")}
	</h2>

	{#if mos}
		<div class="w-full rounded-2xl bg-white/5 p-5">
			{#if mos.result_type === "penalty"}
				<span class="inline-block rounded-full bg-[#F59E0B]/20 text-[#F59E0B] text-[10px] font-bold px-2 py-0.5 mb-2">
					{$t("season_recap.match_of_season.penalty_badge")}
				</span>
			{/if}
			<div class="text-4xl font-extrabold tabular-nums">{mos.score}</div>
			<div class="text-[12px] text-white/50 mt-2">
				{(mos.home_players ?? []).join(" & ")} vs {(mos.away_players ?? []).join(" & ")}
			</div>
			<div class="text-[11px] text-white/40 mt-1">{formatDate(mos.played_at)}</div>
			{#if mos.highlight_url}
				<a
					href={mos.highlight_url}
					target="_blank"
					rel="noopener noreferrer"
					class="inline-flex items-center gap-1.5 mt-3 text-sm font-bold text-[#E24B4A]"
				>
					{"▶"} {$t("season_recap.match_of_season.watch_highlight")}
				</a>
			{/if}
		</div>
	{/if}

	<div class="grid grid-cols-2 gap-2 w-full text-left">
		{#if stats.biggest_win}
			<div class="rounded-xl bg-white/5 p-3">
				<div class="text-[10px] uppercase tracking-wide text-white/40 font-bold">
					{$t("season_recap.match_of_season.biggest_win")}
				</div>
				<div class="text-lg font-extrabold mt-1">{stats.biggest_win.score}</div>
			</div>
		{/if}
		{#if stats.highest_scoring_game}
			<div class="rounded-xl bg-white/5 p-3">
				<div class="text-[10px] uppercase tracking-wide text-white/40 font-bold">
					{$t("season_recap.match_of_season.highest_scoring")}
				</div>
				<div class="text-lg font-extrabold mt-1">{stats.highest_scoring_game.score}</div>
			</div>
		{/if}
		{#if stats.most_common_score}
			<div class="rounded-xl bg-white/5 p-3">
				<div class="text-[10px] uppercase tracking-wide text-white/40 font-bold">
					{$t("season_recap.match_of_season.most_common_score")}
				</div>
				<div class="text-lg font-extrabold mt-1">
					{stats.most_common_score.score}
					<span class="text-white/40 text-xs">&times;{stats.most_common_score.count}</span>
				</div>
			</div>
		{/if}
		{#if stats.favorite_club}
			<div class="rounded-xl bg-white/5 p-3">
				<div class="text-[10px] uppercase tracking-wide text-white/40 font-bold">
					{$t("season_recap.match_of_season.favorite_club")}
				</div>
				<div class="text-lg font-extrabold mt-1 truncate">{stats.favorite_club.name}</div>
			</div>
		{/if}
		{#if stats.best_club}
			<div class="rounded-xl bg-white/5 p-3">
				<div class="text-[10px] uppercase tracking-wide text-white/40 font-bold">
					{$t("season_recap.match_of_season.best_club")}
				</div>
				<div class="text-lg font-extrabold mt-1 truncate">{stats.best_club.name}</div>
				<div class="text-[10px] text-white/40">{Math.round(stats.best_club.win_rate * 100)}%</div>
			</div>
		{/if}
	</div>
</div>
