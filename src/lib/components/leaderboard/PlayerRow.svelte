<script>
import { getTranslate } from "@tolgee/svelte";
import { avatarGradient } from "$lib/utils/avatarColor.utils.js";
import RankIndicator from "./RankIndicator.svelte";
import Sparkline from "./Sparkline.svelte";
import TrendPill from "./TrendPill.svelte";

/**
 * A single row in the Skill-Rating player list. Composes rank
 * indicator, avatar, name/badges, stats line, sparkline and the
 * rating + delta pill. The row is a button so callers can hook into
 * clicks (e.g. open the player's profile).
 *
 * Players with no rated game in the selected season still show their
 * rating, but the S/U/N · Spiele · Tore line collapses to "—" instead
 * of an all-zero line.
 *
 * @type {{
 *   rank: number,
 *   player: {
 *     player_id: string, username: string, avatar_url: string|null,
 *     rating: number|null, delta_season: number, delta_week: number,
 *     form_delta: number|null, history: number[],
 *     games: number, wins: number, draws: number, losses: number, goals: number,
 *     streak: { type: "W"|"D"|"L", count: number }|null, rookie: boolean,
 *     qualified?: boolean,
 *   },
 *   sort: "current"|"form",
 *   isCurrentUser?: boolean,
 *   dimmed?: boolean,
 *   onClick?: (id: string) => void,
 * }}
 */
let {
	rank,
	player,
	sort,
	isCurrentUser = false,
	dimmed = false,
	onClick,
} = $props();

const { t } = getTranslate();

const hasSeasonGames = $derived(player.games > 0);

const streakLabel = $derived(
	player.streak?.type === "W" && player.streak.count >= 3
		? `${"\u{1F525}"} ${player.streak.count}`
		: null,
);

const displayedDelta = $derived(
	sort === "form" ? player.form_delta : player.delta_season,
);

const trendDirection = $derived(
	displayedDelta == null || displayedDelta === 0
		? "flat"
		: displayedDelta > 0
			? "up"
			: "down",
);

const sparkStroke = $derived(
	player.rookie
		? "var(--color-text-muted)"
		: trendDirection === "down"
			? "var(--color-error)"
			: "var(--color-success)",
);

const fallbackGradient = $derived(
	avatarGradient(player.player_id ?? player.username).gradient,
);

function handleClick() {
	onClick?.(player.player_id);
}
</script>

<button
	type="button"
	onclick={handleClick}
	class="w-full flex items-center gap-2.5 rounded-xl border px-3 py-2.5 mb-2 text-left transition-colors {isCurrentUser
		? 'border-accent-red/30 bg-accent-red/5'
		: 'border-border bg-bg-card hover:bg-bg-input'} {dimmed || player.qualified === false
		? 'opacity-70'
		: ''}"
>
	<RankIndicator {rank} />

	{#if player.avatar_url}
		<img
			src={player.avatar_url}
			alt={player.username}
			class="w-[42px] h-[42px] rounded-full object-cover shrink-0"
		/>
	{:else}
		<div
			class="w-[42px] h-[42px] rounded-full flex items-center justify-center text-[15px] font-bold text-white shrink-0"
			style:background={fallbackGradient}
		>
			{(player.username ?? "?").charAt(0).toUpperCase()}
		</div>
	{/if}

	<div class="flex-1 min-w-0">
		<div class="flex items-center gap-1.5 mb-0.5 flex-wrap">
			<span class="text-sm font-bold text-text-primary truncate">{player.username}</span>
			{#if player.rookie}
				<span
					class="shrink-0 rounded-full border border-border bg-bg-input px-1.5 py-px text-[8px] font-bold uppercase tracking-wide text-text-secondary"
				>
					{$t("leaderboard.rookie")}
				</span>
			{/if}
			{#if streakLabel}
				<span class="shrink-0 text-[10px] font-bold text-warning">{streakLabel}</span>
			{/if}
			{#if isCurrentUser}
				<span
					class="shrink-0 rounded-full border border-accent-red/30 bg-accent-red/10 px-1.5 py-px text-[8px] font-bold uppercase tracking-wide text-accent-red"
				>
					{$t("leaderboard.you")}
				</span>
			{/if}
		</div>
		<div class="text-[10px] text-text-muted tabular-nums">
			{#if hasSeasonGames}
				{player.wins}{$t("leaderboard.w_short")} ·
				{player.draws}{$t("leaderboard.d_short")} ·
				{player.losses}{$t("leaderboard.l_short")} ·
				{player.games} {$t("leaderboard.games_short")} ·
				{player.goals} {$t("leaderboard.goals_short")}
			{:else}
				{"—"}
			{/if}
		</div>
	</div>

	<div class="shrink-0">
		<Sparkline
			points={player.history}
			width={50}
			height={18}
			stroke={sparkStroke}
			dashed={player.rookie}
			strokeWidth={1.3}
			opacity={0.85}
		/>
	</div>

	<div class="shrink-0 text-right flex flex-col items-end gap-0.5">
		<div class="text-[17px] font-extrabold leading-none tabular-nums text-text-primary">
			{player.rating ?? "—"}
		</div>
		<TrendPill delta={displayedDelta} />
	</div>
</button>
