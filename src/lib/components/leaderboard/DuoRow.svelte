<script>
import { getTranslate } from "@tolgee/svelte";
import RankIndicator from "./RankIndicator.svelte";
import TrendPill from "./TrendPill.svelte";

/**
 * Duo list row. The ELO column reuses the points value the API
 * already returns — duos have no dedicated ELO snapshot yet, but the
 * column reads "Pkt" in the stats line so users see the right
 * scale.
 *
 * @type {{
 *   rank: number,
 *   duo: {
 *     duo_id: string,
 *     player1: { player_id: string, username: string, avatar_url: string|null },
 *     player2: { player_id: string, username: string, avatar_url: string|null },
 *     wins: number,
 *     draws: number,
 *     losses: number,
 *     games: number,
 *     win_rate: number,
 *     points: number,
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

<button type="button" class="duo-row" onclick={() => onClick?.(duo)}>
	<RankIndicator {rank} />

	<div class="duo-avatars">
		{#if duo.player1.avatar_url}
			<img src={duo.player1.avatar_url} alt={duo.player1.username} class="duo-avatar duo-a" />
		{:else}
			<div class="duo-avatar duo-a duo-fallback">{initial(duo.player1.username)}</div>
		{/if}
		{#if duo.player2.avatar_url}
			<img src={duo.player2.avatar_url} alt={duo.player2.username} class="duo-avatar duo-b" />
		{:else}
			<div class="duo-avatar duo-b duo-fallback">{initial(duo.player2.username)}</div>
		{/if}
	</div>

	<div class="duo-info">
		<div class="duo-names">{duo.player1.username} &amp; {duo.player2.username}</div>
		<div class="duo-stats">
			{duo.wins}{$t("leaderboard.w_short")} ·
			{duo.draws}{$t("leaderboard.d_short")} ·
			{duo.losses}{$t("leaderboard.l_short")} ·
			{duo.games} {$t("leaderboard.games_short")} ·
			{duo.win_rate}% {$t("leaderboard.win_rate_short")}
		</div>
	</div>

	<div class="duo-elo-block">
		<div class="duo-elo">{duo.points}</div>
		<div class="duo-elo-label">{$t("leaderboard.points_short")}</div>
	</div>
</button>

<style>
.duo-row {
	display: flex; align-items: center; gap: 11px;
	background: #131822;
	border: 1px solid #1F2937;
	border-radius: 14px;
	padding: 10px 12px;
	margin-bottom: 8px;
	width: 100%;
	text-align: left;
	cursor: pointer;
	transition: background-color .15s;
}
.duo-row:hover { background: #161C28; }
.duo-avatars {
	position: relative;
	width: 56px; height: 38px;
	flex-shrink: 0;
}
.duo-avatar {
	position: absolute;
	width: 36px; height: 36px; border-radius: 50%;
	object-fit: cover;
	border: 2px solid #131822;
	box-shadow: 0 2px 6px rgba(0,0,0,0.3);
}
.duo-fallback {
	background: linear-gradient(135deg, #6366F1, #4338CA);
	display: flex; align-items: center; justify-content: center;
	font-size: 13px; font-weight: 700; color: white;
}
.duo-a { left: 0; top: 0; z-index: 2; }
.duo-b { right: 0; top: 0; z-index: 1; }

.duo-info { flex: 1; min-width: 0; }
.duo-names {
	font-size: 13px; font-weight: 700;
	color: #E5E7EB;
	overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
	margin-bottom: 2px;
}
.duo-stats {
	font-size: 10px; color: #6B7280;
	font-variant-numeric: tabular-nums;
}
.duo-elo-block {
	text-align: right;
	flex-shrink: 0;
}
.duo-elo {
	font-size: 17px; font-weight: 800;
	color: #FFFFFF;
	line-height: 1;
	font-variant-numeric: tabular-nums;
}
.duo-elo-label {
	font-size: 10px;
	color: #6B7280;
	margin-top: 2px;
}
</style>
