<script>
import { getTranslate } from "@tolgee/svelte";
import { avatarGradient } from "$lib/utils/avatarColor.utils.js";
import RankIndicator from "./RankIndicator.svelte";
import TrendPill from "./TrendPill.svelte";

/**
 * Duo list row for the Skill-Rating "Duos" tab — two overlapping
 * avatars, both names, the duo's rating and season record.
 *
 * @type {{
 *   rank: number,
 *   duo: {
 *     duo_id: string,
 *     players: Array<{ player_id: string, username: string, avatar_url: string|null }>,
 *     rating: number, delta_season: number,
 *     games: number, wins: number, draws: number, losses: number, games_total: number,
 *   },
 *   onClick?: (duo: object) => void,
 * }}
 */
let { rank, duo, onClick } = $props();

const { t } = getTranslate();

function initial(name) {
	return (name ?? "?").charAt(0).toUpperCase();
}
</script>

<button
	type="button"
	class="w-full flex items-center gap-2.5 rounded-xl border border-border bg-bg-card px-3 py-2.5 mb-2 text-left hover:bg-bg-input transition-colors"
	onclick={() => onClick?.(duo)}
>
	<RankIndicator {rank} />

	<div class="relative w-14 h-[38px] shrink-0">
		{#each duo.players.slice(0, 2) as p, i (p.player_id)}
			<div
				class="absolute top-0 w-9 h-9 rounded-full border-2 border-bg-card shadow-sm overflow-hidden {i === 0
					? 'left-0 z-[2]'
					: 'right-0 z-[1]'}"
				style:background={p.avatar_url
					? undefined
					: avatarGradient(p.player_id ?? p.username).gradient}
			>
				{#if p.avatar_url}
					<img src={p.avatar_url} alt={p.username} class="w-full h-full object-cover" />
				{:else}
					<span class="w-full h-full flex items-center justify-center text-[13px] font-bold text-white">
						{initial(p.username)}
					</span>
				{/if}
			</div>
		{/each}
	</div>

	<div class="flex-1 min-w-0">
		<div class="text-[13px] font-bold text-text-primary truncate mb-0.5">
			{duo.players.map((p) => p.username).join(" & ")}
		</div>
		<div class="text-[10px] text-text-muted tabular-nums">
			{duo.wins}{$t("leaderboard.w_short")} ·
			{duo.draws}{$t("leaderboard.d_short")} ·
			{duo.losses}{$t("leaderboard.l_short")} ·
			{duo.games} {$t("leaderboard.games_short")} ·
			{duo.games_total} {$t("leaderboard.duo_total_games_short")}
		</div>
	</div>

	<div class="shrink-0 text-right flex flex-col items-end gap-0.5">
		<div class="text-[17px] font-extrabold leading-none tabular-nums text-text-primary">
			{duo.rating ?? "—"}
		</div>
		<TrendPill delta={duo.delta_season} />
	</div>
</button>
