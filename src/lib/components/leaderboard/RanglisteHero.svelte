<script>
import { getTranslate } from "@tolgee/svelte";
import Sparkline from "./Sparkline.svelte";
import TrendPill from "./TrendPill.svelte";

/**
 * Top-of-page hero card for the current #1 player. Shows the avatar
 * with a crown, the headline ELO, a sparkline of recent ratings,
 * a "this week" trend pill and the wins/draws/losses breakdown.
 *
 * @type {{
 *   player: {
 *     id: string,
 *     username: string,
 *     avatarUrl: string|null,
 *     initials: string,
 *     currentRating: number|null,
 *     ratings: number[],
 *     weekDelta: number,
 *     wins: number,
 *     draws: number,
 *     losses: number,
 *     games: number,
 *     currentStreak: { type: "win"|"loss"|"draw", count: number }|null,
 *   },
 * }}
 */
let { player } = $props();

const { t } = getTranslate();

const winStreak = $derived(
	player.currentStreak?.type === "win" && player.currentStreak.count >= 3
		? player.currentStreak.count
		: null,
);
</script>

<div class="hero-card">
	<div class="hero-top-row">
		<div class="hero-avatar-wrap">
			<div class="crown-badge" aria-hidden="true">{"\u{1F451}"}</div>
			{#if player.avatarUrl}
				<img src={player.avatarUrl} alt={player.username} class="hero-avatar-img" />
			{:else}
				<div class="hero-avatar">{player.initials}</div>
			{/if}
		</div>
		<div class="hero-info">
			<div class="hero-rank-label">★ {$t("leaderboard.hero_label")}</div>
			<h2 class="hero-name">{player.username}</h2>
		</div>
	</div>

	<div class="hero-elo-row">
		<div class="hero-elo-left">
			<div class="hero-elo-value">{player.currentRating ?? "—"}</div>
			<TrendPill delta={player.weekDelta} variant="pill" suffix={$t("leaderboard.this_week")} />
		</div>
		<div class="hero-sparkline">
			<Sparkline
				points={player.ratings}
				width={220}
				height={56}
				stroke="#84CC16"
				fillId="ranglisteHeroSpark"
				strokeWidth={2}
				opacity={1}
				fluid
			/>
		</div>
	</div>

	<div class="hero-bottom-row">
		<span class="hero-stat"><strong>{player.wins}</strong>{$t("leaderboard.w_short")}</span>
		<span class="hero-stat-divider">·</span>
		<span class="hero-stat"><strong>{player.draws}</strong>{$t("leaderboard.d_short")}</span>
		<span class="hero-stat-divider">·</span>
		<span class="hero-stat"><strong>{player.losses}</strong>{$t("leaderboard.l_short")}</span>
		<span class="hero-stat-divider">·</span>
		<span class="hero-stat"><strong>{player.games}</strong> {$t("leaderboard.games_short")}</span>
		{#if winStreak}
			<span class="hero-streak-badge">{"\u{1F525}"} {winStreak}{$t("leaderboard.streak_suffix")}</span>
		{/if}
	</div>
</div>

<style>
.hero-card {
	position: relative;
	background: radial-gradient(circle at top right, rgba(132, 204, 22, 0.12), transparent 60%),
		linear-gradient(135deg, #1A1F2A 0%, #232938 100%);
	border: 1px solid rgba(132, 204, 22, 0.25);
	border-radius: 18px;
	padding: 14px;
	overflow: hidden;
}
.hero-top-row {
	display: flex; gap: 14px; align-items: center;
	position: relative; z-index: 1;
}
.hero-avatar-wrap { position: relative; flex-shrink: 0; }
.hero-avatar,
.hero-avatar-img {
	width: 70px; height: 70px; border-radius: 50%;
	box-shadow: 0 6px 18px rgba(0,0,0,0.4);
	border: 3px solid rgba(251, 191, 36, 0.5);
}
.hero-avatar {
	background: linear-gradient(135deg, #84CC16, #65A30D);
	display: flex; align-items: center; justify-content: center;
	font-size: 28px; font-weight: 800; color: white;
}
.hero-avatar-img { object-fit: cover; }
.crown-badge {
	position: absolute;
	top: -10px; left: 50%;
	transform: translateX(-50%);
	font-size: 22px;
	filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));
	z-index: 2;
}
.hero-info { flex: 1; min-width: 0; }
.hero-rank-label {
	font-size: 9px; color: #FBBF24;
	text-transform: uppercase; letter-spacing: 0.1em;
	font-weight: 800;
	margin-bottom: 2px;
}
.hero-name {
	font-size: 19px; font-weight: 800;
	margin: 0;
	letter-spacing: -0.01em;
	color: #FFFFFF;
	overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.hero-elo-row {
	display: flex; align-items: center;
	justify-content: space-between;
	gap: 14px;
	margin-top: 14px;
	position: relative; z-index: 1;
}
.hero-elo-left {
	display: flex; flex-direction: column;
	align-items: flex-start;
	gap: 8px;
}
.hero-elo-value {
	font-size: 42px; font-weight: 800;
	color: #FFFFFF;
	line-height: 1;
	font-variant-numeric: tabular-nums;
	letter-spacing: -0.02em;
}
/* Sparkline grows to fill the gap between the headline ELO and the
 * card edge — was previously clipped to 100 px, leaving a lot of
 * empty space. Bounds keep it readable across breakpoints. */
.hero-sparkline { flex: 1 1 auto; min-width: 100px; max-width: 240px; height: 56px; }
.hero-bottom-row {
	margin-top: 10px;
	padding-top: 10px;
	border-top: 1px solid rgba(255,255,255,0.06);
	display: flex; gap: 8px;
	flex-wrap: wrap;
	align-items: center;
	position: relative; z-index: 1;
}
.hero-stat {
	font-size: 11px; color: #9CA3AF;
	font-variant-numeric: tabular-nums;
}
.hero-stat strong { color: #E5E7EB; font-weight: 700; }
.hero-stat-divider { color: #4B5563; }
.hero-streak-badge {
	background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.1));
	border: 1px solid rgba(245, 158, 11, 0.3);
	color: #F59E0B;
	font-size: 10px; font-weight: 700;
	padding: 3px 8px;
	border-radius: 999px;
	margin-left: auto;
}
</style>
