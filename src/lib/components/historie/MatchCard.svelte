<script>
import { getTranslate } from "@tolgee/svelte";
import { goto } from "$app/navigation";
import { avatarGradient } from "$lib/utils/avatarColor.utils.js";
import { primaryMarker } from "$lib/utils/matchMarkers.utils.js";
import { relativeTime } from "$lib/utils/relativeTime.utils.js";

/**
 * Match row used inside Historie date groups. Three text lines:
 *   1. team names (own player painted in their accent colour)
 *   2. score · mode pill · primary marker
 *   3. ELO delta · relative timestamp · arrow
 *
 * Cards are clickable and navigate to the match detail.
 *
 * @type {{ game: object, currentUserId: string|null }}
 */
let { game, currentUserId } = $props();

const { t } = getTranslate();

const players = $derived(game.game_players ?? []);
const homeScore = $derived(game.score_home ?? 0);
const awayScore = $derived(game.score_away ?? 0);

// Zero-tracking: the result is still being extracted from the recording.
// Checked before `result`/score so a pending 0:0 never renders as a real
// goalless draw — it shows a spinner and a "wird analysiert" badge instead.
const analyzing = $derived(Boolean(game.pending));

const penaltyShootout = $derived(game.penalty_shootout ?? null);
const penaltyWinner = $derived(penaltyShootout?.winner_side ?? null);

// Suffix the score after the regular result. Three cases:
//   - shootout: show "i.E. 5:6" with the actual penalty score so the
//     full result is visible at a glance (the "n.E." flag is implied
//     by the i.E. notation, no need to print both);
//   - extra time without shootout: classic "n.V." short tag;
//   - everything else: no suffix.
const resultSuffix = $derived.by(() => {
	if (penaltyShootout) {
		return $t("game_detail.penalty_score_label", {
			home: penaltyShootout.final_score?.home ?? 0,
			away: penaltyShootout.final_score?.away ?? 0,
		});
	}
	if (game.result_type === "penalty") return $t("game_detail.penalty_short");
	if (game.result_type === "extra_time")
		return $t("game_detail.extra_time_short");
	return "";
});

const myEntry = $derived(
	currentUserId ? players.find((p) => p.player_id === currentUserId) : null,
);
const userInvolved = $derived(Boolean(myEntry));

// Penalty winner overrides the regular-time draw — without this, a
// 1:1 (5:6 i.E.) shows up as "U" (draw pill) and the loser team
// looks like it tied, even though it lost the shootout.
const isDraw = $derived(penaltyWinner ? false : homeScore === awayScore);
const winnerSide = $derived(
	penaltyWinner
		? penaltyWinner
		: isDraw
			? null
			: homeScore > awayScore
				? "home"
				: "away",
);

// Result pill is meaningful only for the logged-in user. When the user
// wasn't part of the match (e.g. browsing "Alle Spiele" or a foreign
// match from a comparison view), we return null so the pill is hidden
// instead of showing the home-team perspective as if it were the user's.
const result = $derived.by(() => {
	if (!userInvolved) return null;
	if (isDraw) return "D";
	return myEntry.team === winnerSide ? "W" : "L";
});

const team1 = $derived(players.filter((p) => p.team === "home"));
const team2 = $derived(players.filter((p) => p.team === "away"));

const userAccent = $derived(
	currentUserId ? avatarGradient(currentUserId).from : "#F59E0B",
);

const marker = $derived(primaryMarker(game));

const eloEntry = $derived.by(() => {
	const snap = game.elo_snapshot;
	if (!snap || !currentUserId) return null;
	return [...(snap.teamA ?? []), ...(snap.teamB ?? [])].find(
		(e) => e.playerId === currentUserId,
	);
});
const eloDelta = $derived(
	eloEntry?.delta != null ? Math.round(eloEntry.delta) : null,
);

const special = $derived(
	userInvolved && (marker?.type === "comeback" || marker?.type === "hattrick"),
);

const scoreClass = $derived.by(() => {
	if (isDraw || !userInvolved) return "neutral";
	return myEntry.team === winnerSide ? "win" : "loss";
});

const meTeamSide = $derived(myEntry?.team ?? null);

// Player usernames when a side has human players; otherwise the in-game team
// preset in the app (home_team_name / away_team_name) — so a CPU/no-human side
// shows e.g. "Lombardia FC" instead of a blank or "?". There is no CPU mode;
// solo test matches simply leave one side without a human player.
function teamLabel(entries, fallbackName) {
	const names = entries.map((p) => p.profiles?.username).filter(Boolean);
	if (names.length) return names.join(" & ");
	return fallbackName || "?";
}

function navigateToDetail() {
	goto(`/app/games/${game.id}`);
}

const time = $derived(relativeTime(game.played_at));

const markerLabel = $derived.by(() => {
	if (!marker) return null;
	const base = $t(`historie.markers.${marker.type}`);
	if (marker.type === "hattrick" && marker.scorerName) {
		return `${base} · ${marker.scorerName}`;
	}
	return base;
});
</script>

<button
	type="button"
	class="card"
	class:user-involved={userInvolved}
	class:special
	class:analyzing
	onclick={navigateToDetail}
>
	{#if analyzing}
		<div class="analyze-spinner" aria-hidden="true"></div>
	{:else if result}
		<div class="result-pill {result === 'W' ? 'win' : result === 'L' ? 'loss' : 'draw'}">
			{result === "W" ? $t("historie.w_short") : result === "L" ? $t("historie.l_short") : $t("historie.d_short")}
		</div>
	{:else}
		<div class="result-pill-spacer" aria-hidden="true"></div>
	{/if}

	<div class="body">
		<div class="line line-1">
			<span class="team-names">
				<span
					class="team-name"
					class:me={meTeamSide === "home"}
					class:winner={!meTeamSide && winnerSide === "home"}
					style:--accent={userAccent}
				>{teamLabel(team1, game.home_team_name)}</span>
				<span class="vs-divider">vs</span>
				<span
					class="team-name"
					class:me={meTeamSide === "away"}
					class:winner={!meTeamSide && winnerSide === "away"}
					style:--accent={userAccent}
				>{teamLabel(team2, game.away_team_name)}</span>
			</span>
		</div>

		<div class="line line-2">
			{#if analyzing}
				<span class="score analyzing-score">–:–</span>
			{:else}
				<span class="score {scoreClass}">
					{homeScore}:{awayScore}{#if resultSuffix}<span class="result-suffix"> {resultSuffix}</span>{/if}
				</span>
			{/if}
			<span class="mode">{game.mode ?? "—"}</span>
			{#if analyzing}
				<span class="analyze-tag"><span class="analyze-dot" aria-hidden="true"></span>{$t("historie.analyzing")}</span>
			{:else if marker && markerLabel}
				<span class="marker {marker.type}">{markerLabel}</span>
			{/if}
		</div>

		<div class="line line-3">
			{#if userInvolved && eloDelta != null}
				<span class="elo {eloDelta > 0 ? 'up' : eloDelta < 0 ? 'down' : 'neutral'}">
					{eloDelta > 0 ? "↑ +" : eloDelta < 0 ? "↓ " : "± "}{Math.abs(eloDelta)} ELO
				</span>
				<span class="dot">·</span>
			{/if}
			<span class="time">{time}</span>
		</div>
	</div>

	<div class="arrow" aria-hidden="true">›</div>
</button>

<style>
.card {
	background: #131822;
	border: 1px solid #1F2937;
	border-radius: 14px;
	padding: 11px 12px;
	display: flex; align-items: center; gap: 11px;
	cursor: pointer;
	transition: background-color .15s, transform .1s, border-color .15s;
	position: relative;
	text-align: left;
	width: 100%;
}
.card:active {
	background: #1A1F2A;
	transform: scale(0.99);
}
.card.user-involved { border-color: rgba(245, 158, 11, 0.2); }
.card.special {
	border-color: rgba(245, 158, 11, 0.3);
	background: linear-gradient(180deg, rgba(245, 158, 11, 0.04), #131822);
}
.card.analyzing {
	border-color: rgba(245, 158, 11, 0.28);
	background: linear-gradient(180deg, rgba(245, 158, 11, 0.05), #131822);
}
.analyze-spinner {
	width: 28px; height: 28px;
	border-radius: 50%;
	border: 2px solid rgba(245, 158, 11, 0.25);
	border-top-color: #F59E0B;
	flex-shrink: 0;
	animation: analyze-spin 0.8s linear infinite;
}
@keyframes analyze-spin { to { transform: rotate(360deg); } }
.analyzing-score { color: #4B5563; letter-spacing: 0.05em; }
.analyze-tag {
	display: inline-flex; align-items: center; gap: 5px;
	font-size: 9px; font-weight: 700;
	padding: 1px 6px; border-radius: 4px;
	background: rgba(245, 158, 11, 0.12);
	border: 1px solid rgba(245, 158, 11, 0.4);
	color: #F59E0B;
	text-transform: uppercase; letter-spacing: 0.04em;
}
.analyze-dot {
	width: 5px; height: 5px; border-radius: 50%;
	background: #F59E0B;
	animation: analyze-pulse 1.2s ease-in-out infinite;
}
@keyframes analyze-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
@media (prefers-reduced-motion: reduce) {
	.analyze-spinner, .analyze-dot { animation: none; }
}
.result-pill {
	width: 28px; height: 28px;
	border-radius: 50%;
	display: flex; align-items: center; justify-content: center;
	font-size: 11px; font-weight: 800;
	flex-shrink: 0;
}
.result-pill.win {
	background: rgba(132, 204, 22, 0.15);
	color: #84CC16;
	border: 1.5px solid rgba(132, 204, 22, 0.4);
}
.result-pill.loss {
	background: rgba(226, 75, 74, 0.15);
	color: #E24B4A;
	border: 1.5px solid rgba(226, 75, 74, 0.4);
}
.result-pill.draw {
	background: rgba(245, 158, 11, 0.15);
	color: #F59E0B;
	border: 1.5px solid rgba(245, 158, 11, 0.4);
}
.result-pill-spacer {
	width: 28px;
	height: 28px;
	flex-shrink: 0;
}
.body {
	flex: 1; min-width: 0;
	display: flex; flex-direction: column; gap: 4px;
}
.line-1 {
	font-size: 12px;
	line-height: 1.2;
}
.team-names {
	display: block;
	overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.team-name {
	font-weight: 700;
	color: #D1D5DB;
}
.team-name.me { color: var(--accent, #F59E0B); }
.team-name.winner { color: #FFFFFF; }
.vs-divider {
	color: #4B5563;
	font-weight: 600;
	margin: 0 4px;
}
.line-2 {
	display: flex; align-items: center; gap: 6px;
	font-size: 11px;
	color: #6B7280;
	flex-wrap: wrap;
}
.score {
	font-size: 14px;
	font-weight: 800;
	font-variant-numeric: tabular-nums;
	color: #E5E7EB;
	margin-right: 2px;
}
.score.win { color: #84CC16; }
.score.loss { color: #E24B4A; }
.result-suffix {
	/* Smaller and dimmer than the main score so the digits stay
	 * dominant — keeps "7:4 n.E." readable without the suffix
	 * stealing focus. */
	font-size: 11px;
	font-weight: 700;
	color: #9CA3AF;
	margin-left: 2px;
	letter-spacing: 0.02em;
}
.mode {
	background: rgba(255, 255, 255, 0.05);
	color: #9CA3AF;
	font-size: 9px;
	font-weight: 700;
	padding: 1px 5px;
	border-radius: 4px;
	letter-spacing: 0.04em;
	text-transform: uppercase;
}
.marker {
	font-size: 9px;
	font-weight: 700;
	padding: 1px 5px;
	border-radius: 4px;
	border: 1px solid transparent;
}
.marker.comeback {
	background: rgba(132, 204, 22, 0.12);
	border-color: rgba(132, 204, 22, 0.3);
	color: #84CC16;
}
.marker.hattrick {
	background: rgba(245, 158, 11, 0.12);
	border-color: rgba(245, 158, 11, 0.35);
	color: #F59E0B;
}
.marker.klar,
.marker.zunull {
	background: rgba(129, 140, 248, 0.12);
	border-color: rgba(129, 140, 248, 0.3);
	color: #818CF8;
}
.marker.torreich {
	background: rgba(236, 72, 153, 0.12);
	border-color: rgba(236, 72, 153, 0.3);
	color: #EC4899;
}
.marker.krimi {
	background: rgba(245, 158, 11, 0.12);
	border-color: rgba(245, 158, 11, 0.35);
	color: #F59E0B;
}
.line-3 {
	display: flex; align-items: center; gap: 6px;
	font-size: 10px;
	color: #6B7280;
}
.elo {
	font-weight: 800;
	font-variant-numeric: tabular-nums;
}
.elo.up { color: #84CC16; }
.elo.down { color: #E24B4A; }
.elo.neutral { color: #9CA3AF; }
.dot { color: #4B5563; }
.arrow {
	color: #4B5563;
	font-size: 16px;
	flex-shrink: 0;
	margin-left: 2px;
}
</style>
