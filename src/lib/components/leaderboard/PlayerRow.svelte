<script>
import { getTranslate } from "@tolgee/svelte";
import RankIndicator from "./RankIndicator.svelte";
import Sparkline from "./Sparkline.svelte";
import TrendPill from "./TrendPill.svelte";

/**
 * A single row in the solo list. Composes rank indicator, avatar,
 * name/stats, sparkline and the ELO + trend block. The row is a
 * button so callers can hook into clicks (e.g. open the H2H modal).
 *
 * Rookie state: when the player has fewer than 5 games in the active
 * window the sparkline switches to a dashed grey baseline and a
 * "Rookie" badge is shown next to the name.
 *
 * @type {{
 *   rank: number,
 *   player: {
 *     id: string,
 *     username: string,
 *     avatarUrl: string|null,
 *     initials: string,
 *     currentRating: number|null,
 *     ratings: number[],
 *     formDelta: number|null,
 *     weekDelta: number,
 *     wins: number,
 *     draws: number,
 *     losses: number,
 *     games: number,
 *     currentStreak: { type: "win"|"loss"|"draw", count: number }|null,
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

const isRookie = $derived(player.games < 5);
const streakLabel = $derived(
	player.currentStreak?.type === "win" && player.currentStreak.count >= 3
		? `${"\u{1F525}"} ${player.currentStreak.count}`
		: null,
);

const displayedDelta = $derived(
	sort === "form" ? player.formDelta : player.weekDelta,
);

const trendDirection = $derived(
	displayedDelta == null || displayedDelta === 0
		? "flat"
		: displayedDelta > 0
			? "up"
			: "down",
);

const sparkStroke = $derived(
	isRookie ? "#6B7280" : trendDirection === "down" ? "#E24B4A" : "#84CC16",
);

function handleClick() {
	if (onClick) onClick(player.id);
}
</script>

<button
	type="button"
	class="player-row"
	class:dimmed
	class:current-user={isCurrentUser}
	onclick={handleClick}
>
	<RankIndicator {rank} />

	{#if player.avatarUrl}
		<img src={player.avatarUrl} alt={player.username} class="player-avatar-img" />
	{:else}
		<div class="player-avatar">{player.initials}</div>
	{/if}

	<div class="player-info">
		<div class="player-name-row">
			<span class="player-name">{player.username}</span>
			{#if isRookie}
				<span class="rookie-badge">{$t("leaderboard.rookie")}</span>
			{/if}
			{#if streakLabel}
				<span class="streak-mini">{streakLabel}</span>
			{/if}
			{#if isCurrentUser}
				<span class="me-badge">{$t("leaderboard.you")}</span>
			{/if}
		</div>
		<div class="player-stats">
			{player.wins}{$t("leaderboard.w_short")} ·
			{player.draws}{$t("leaderboard.d_short")} ·
			{player.losses}{$t("leaderboard.l_short")} ·
			{player.games} {$t("leaderboard.games_short")}
		</div>
	</div>

	<div class="player-sparkline">
		<Sparkline
			points={player.ratings}
			width={50}
			height={18}
			stroke={sparkStroke}
			dashed={isRookie}
			strokeWidth={1.3}
			opacity={0.85}
		/>
	</div>

	<div class="player-elo-block">
		<div class="player-elo">{player.currentRating ?? "—"}</div>
		<TrendPill delta={displayedDelta} />
	</div>
</button>

<style>
.player-row {
	display: flex; align-items: center; gap: 11px;
	background: #131822;
	border: 1px solid #1F2937;
	border-radius: 14px;
	padding: 10px 12px;
	margin-bottom: 8px;
	width: 100%;
	text-align: left;
	cursor: pointer;
	transition: background-color .15s, border-color .15s, transform .1s;
}
.player-row:hover { background: #161C28; }
.player-row:active { transform: scale(0.99); }
.player-row.dimmed { opacity: 0.55; }
.player-row.current-user {
	border-color: rgba(245, 158, 11, 0.35);
	background: linear-gradient(180deg, rgba(245, 158, 11, 0.05), #131822);
}
.player-avatar,
.player-avatar-img {
	width: 42px; height: 42px; border-radius: 50%;
	flex-shrink: 0;
	box-shadow: 0 3px 10px rgba(0,0,0,0.3);
}
.player-avatar {
	background: linear-gradient(135deg, #6366F1, #4338CA);
	display: flex; align-items: center; justify-content: center;
	font-size: 15px; font-weight: 700; color: white;
}
.player-avatar-img { object-fit: cover; }
.player-info { flex: 1; min-width: 0; }
.player-name-row {
	display: flex; align-items: center; gap: 6px;
	margin-bottom: 2px;
}
.player-name {
	font-size: 14px; font-weight: 700;
	color: #E5E7EB;
	overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.rookie-badge {
	background: rgba(99, 102, 241, 0.15);
	border: 1px solid rgba(99, 102, 241, 0.3);
	color: #6366F1;
	font-size: 8px; font-weight: 700;
	padding: 1px 5px; border-radius: 999px;
	text-transform: uppercase; letter-spacing: 0.05em;
	flex-shrink: 0;
}
.me-badge {
	background: rgba(245, 158, 11, 0.15);
	border: 1px solid rgba(245, 158, 11, 0.3);
	color: #F59E0B;
	font-size: 8px; font-weight: 700;
	padding: 1px 5px; border-radius: 999px;
	text-transform: uppercase; letter-spacing: 0.05em;
	flex-shrink: 0;
}
.streak-mini {
	font-size: 10px; font-weight: 700;
	color: #F59E0B;
	flex-shrink: 0;
}
.player-stats {
	font-size: 10px; color: #6B7280;
	font-variant-numeric: tabular-nums;
}
.player-sparkline { flex-shrink: 0; }
.player-elo-block {
	text-align: right;
	flex-shrink: 0;
	display: flex; flex-direction: column; align-items: flex-end;
	gap: 2px;
}
.player-elo {
	font-size: 17px; font-weight: 800;
	color: #FFFFFF;
	line-height: 1;
	font-variant-numeric: tabular-nums;
}
</style>
