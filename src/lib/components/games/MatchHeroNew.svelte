<script>
import { getTranslate } from "@tolgee/svelte";
import TeamLogo from "$lib/components/ui/TeamLogo.svelte";
import { avatarGradient } from "$lib/utils/avatarColor.utils.js";
import { getMatchCharacterTags } from "$lib/utils/matchCharacterTags.utils.js";

/**
 * Atmospheric match hero card — applies the new-design language: radial
 * glow in the winner's colour, top accent line, big score with the
 * loser side muted, team labels with Sieg/Niederlage tags and the
 * player names in their identity colour, marker tags below and the
 * rematch CTA directly inside the hero.
 *
 * Logos stay small in the outer columns; the focus is the score and
 * the identity-coloured player names.
 *
 * @type {{
 *   game: object,
 *   homeTeam: object|null,
 *   awayTeam: object|null,
 *   homeTeamName: string|null,
 *   awayTeamName: string|null,
 *   homePlayers: Array<object>,
 *   awayPlayers: Array<object>,
 *   currentUserId: string|null,
 *   resultSuffix?: string,
 *   rematchUrl?: string,
 * }}
 */
let {
	game,
	homeTeam = null,
	awayTeam = null,
	homeTeamName = null,
	awayTeamName = null,
	homePlayers = [],
	awayPlayers = [],
	currentUserId = null,
	resultSuffix = "",
	rematchUrl = "",
} = $props();

const { t } = getTranslate();

const homeScore = $derived(game?.score_home ?? 0);
const awayScore = $derived(game?.score_away ?? 0);
const homeWins = $derived(homeScore > awayScore);
const awayWins = $derived(awayScore > homeScore);
const isDraw = $derived(homeScore === awayScore);
const winnerSide = $derived(homeWins ? "home" : awayWins ? "away" : "draw");

const palette = {
	home: {
		glow: "rgba(226, 75, 74, 0.16)",
		border: "rgba(226, 75, 74, 0.22)",
		line: "#E24B4A",
	},
	away: {
		glow: "rgba(132, 204, 22, 0.16)",
		border: "rgba(132, 204, 22, 0.22)",
		line: "#84CC16",
	},
	draw: {
		glow: "rgba(245, 158, 11, 0.16)",
		border: "rgba(245, 158, 11, 0.22)",
		line: "#F59E0B",
	},
};
const skin = $derived(palette[winnerSide]);

const tags = $derived(getMatchCharacterTags(game));

const TAG_VARIANT = {
	warning: {
		bg: "rgba(245, 158, 11, 0.12)",
		border: "rgba(245, 158, 11, 0.3)",
		color: "#F59E0B",
	},
	red: {
		bg: "rgba(226, 75, 74, 0.12)",
		border: "rgba(226, 75, 74, 0.3)",
		color: "#E24B4A",
	},
	success: {
		bg: "rgba(132, 204, 22, 0.12)",
		border: "rgba(132, 204, 22, 0.3)",
		color: "#84CC16",
	},
	info: {
		bg: "rgba(129, 140, 248, 0.12)",
		border: "rgba(129, 140, 248, 0.3)",
		color: "#818CF8",
	},
};

const TAG_LABEL_KEY = {
	late_drama: "match_hero.tags.late_drama",
	lucky_win: "match_hero.tags.lucky_win",
	defensive_battle: "match_hero.tags.defensive_battle",
	penalty_decision: "match_hero.tags.penalty_decision",
	goal_fest: "match_hero.tags.goal_fest",
	clear_win: "match_hero.tags.clear_win",
	draw: "match_hero.tags.draw",
	comeback: "match_hero.tags.comeback",
};

const formattedDate = $derived(
	new Date(game.played_at).toLocaleDateString("de-DE", {
		weekday: "short",
		day: "2-digit",
		month: "short",
	}),
);
const formattedTime = $derived(
	new Date(game.played_at).toLocaleTimeString("de-DE", {
		hour: "2-digit",
		minute: "2-digit",
	}),
);

function teamLabel(side) {
	return side === "home"
		? $t("match_hero.home_label")
		: $t("match_hero.away_label");
}

function resultLabel(side) {
	if (isDraw) return $t("match_hero.draw_label");
	if (side === "home")
		return homeWins ? $t("match_hero.wins") : $t("match_hero.loses");
	return awayWins ? $t("match_hero.wins") : $t("match_hero.loses");
}

function playerNames(players) {
	return (players ?? []).map((p) => p.profiles?.username ?? "?");
}

const homeNames = $derived(playerNames(homePlayers));
const awayNames = $derived(playerNames(awayPlayers));

function isUserInTeam(players) {
	if (!currentUserId) return false;
	return (players ?? []).some((p) => p.player_id === currentUserId);
}

const userInHome = $derived(isUserInTeam(homePlayers));
const userInAway = $derived(isUserInTeam(awayPlayers));
const userAccent = $derived(
	currentUserId ? avatarGradient(currentUserId).from : "#F59E0B",
);
</script>

<div
	class="hero"
	style="--glow: {skin.glow}; --border: {skin.border}; --line: {skin.line};"
>
	<div class="top-row">
		<span class="mode-pill">{game.mode}</span>
		<span class="date">{formattedDate} · {formattedTime}</span>
	</div>

	<div class="score-row">
		<div class="logo-col">
			<TeamLogo logoUrl={homeTeam?.logo_url} teamName={homeTeam?.name || homeTeamName || "?"} size="md" />
			<div class="club-name">{homeTeam?.name || homeTeamName || "—"}</div>
		</div>
		<div class="score-block">
			<div class="score">
				<span class="num" class:winner={homeWins}>{homeScore}</span>
				<span class="sep">:</span>
				<span class="num" class:winner={awayWins}>{awayScore}</span>
			</div>
			{#if resultSuffix}
				<div class="result-suffix">{resultSuffix}</div>
			{/if}
		</div>
		<div class="logo-col">
			<TeamLogo logoUrl={awayTeam?.logo_url} teamName={awayTeam?.name || awayTeamName || "?"} size="md" />
			<div class="club-name">{awayTeam?.name || awayTeamName || "—"}</div>
		</div>
	</div>

	<div class="teams-row">
		<div class="team-block">
			<div class="team-meta">
				<span class="team-side">{teamLabel("home")}</span>
				<span class="team-tag" class:win={homeWins} class:loss={awayWins} class:draw={isDraw}>
					{resultLabel("home")}
				</span>
			</div>
			<div class="players" class:me={userInHome} style:--accent={userAccent}>
				{homeNames.join(" & ")}
			</div>
		</div>
		<div class="team-block away">
			<div class="team-meta">
				<span class="team-side">{teamLabel("away")}</span>
				<span class="team-tag" class:win={awayWins} class:loss={homeWins} class:draw={isDraw}>
					{resultLabel("away")}
				</span>
			</div>
			<div class="players" class:me={userInAway} style:--accent={userAccent}>
				{awayNames.join(" & ")}
			</div>
		</div>
	</div>

	{#if tags.length > 0}
		<div class="markers-row">
			{#each tags as tag (tag.id)}
				{@const v = TAG_VARIANT[tag.variant] ?? TAG_VARIANT.info}
				<span
					class="marker"
					style="background: {v.bg}; border: 1px solid {v.border}; color: {v.color};"
				>
					{$t(TAG_LABEL_KEY[tag.id] ?? tag.id)}
				</span>
			{/each}
		</div>
	{/if}

	{#if rematchUrl}
		<a href={rematchUrl} class="rematch">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
				<polyline points="23 4 23 10 17 10" />
				<polyline points="1 20 1 14 7 14" />
				<path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
			</svg>
			<span>{$t("match_hero.rematch")}</span>
		</a>
		<div class="rematch-hint">{$t("match_hero.rematch_hint")}</div>
	{/if}
</div>

<style>
.hero {
	background: radial-gradient(ellipse at top, var(--glow) 0%, transparent 60%),
		linear-gradient(180deg, #1A1F2A 0%, #131822 100%);
	border: 1px solid var(--border);
	border-radius: 18px;
	padding: 16px;
	position: relative;
	overflow: hidden;
}
.hero::before {
	content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
	background: linear-gradient(90deg, transparent, var(--line) 50%, transparent);
	opacity: 0.5;
}
.top-row {
	display: flex; justify-content: space-between; align-items: center;
	margin-bottom: 16px;
	gap: 8px;
}
.mode-pill {
	background: rgba(226, 75, 74, 0.15);
	color: #E24B4A;
	font-size: 10px;
	font-weight: 800;
	padding: 3px 8px;
	border-radius: 6px;
	letter-spacing: 0.08em;
	text-transform: uppercase;
}
.date {
	font-size: 11px;
	color: #9CA3AF;
}
.score-row {
	display: grid;
	grid-template-columns: 1fr auto 1fr;
	align-items: center;
	gap: 12px;
	margin-bottom: 14px;
}
.logo-col {
	display: flex; flex-direction: column;
	align-items: center;
	gap: 6px;
	min-width: 0;
}
.club-name {
	font-size: 9px;
	font-weight: 700;
	color: #9CA3AF;
	text-transform: uppercase;
	letter-spacing: 0.08em;
	max-width: 100%;
	overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.score-block {
	text-align: center;
	min-width: 0;
}
.score {
	display: flex; align-items: baseline;
	justify-content: center;
	gap: 6px;
	font-variant-numeric: tabular-nums;
}
.score .num {
	font-size: 36px;
	font-weight: 800;
	color: #6B7280;
	line-height: 1;
}
.score .num.winner { color: #FFFFFF; }
.score .sep {
	font-size: 22px;
	color: #4B5563;
}
.result-suffix {
	margin-top: 6px;
	font-size: 10px;
	font-weight: 800;
	color: var(--line);
	text-transform: uppercase;
	letter-spacing: 0.08em;
}
.teams-row {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 12px;
	padding-top: 12px;
	border-top: 1px solid rgba(255,255,255,0.06);
	margin-bottom: 12px;
}
.team-block { min-width: 0; }
.team-block.away { text-align: right; }
.team-meta {
	display: flex; align-items: center; gap: 6px;
	font-size: 9px;
	text-transform: uppercase;
	letter-spacing: 0.08em;
	font-weight: 700;
	color: #6B7280;
	margin-bottom: 3px;
}
.team-block.away .team-meta { justify-content: flex-end; }
.team-tag {
	font-size: 9px;
	font-weight: 800;
	padding: 2px 6px;
	border-radius: 4px;
	letter-spacing: 0.06em;
	border: 1px solid transparent;
}
.team-tag.win {
	background: rgba(132, 204, 22, 0.12);
	color: #84CC16;
	border-color: rgba(132, 204, 22, 0.3);
}
.team-tag.loss {
	background: rgba(226, 75, 74, 0.12);
	color: #E24B4A;
	border-color: rgba(226, 75, 74, 0.3);
}
.team-tag.draw {
	background: rgba(245, 158, 11, 0.12);
	color: #F59E0B;
	border-color: rgba(245, 158, 11, 0.3);
}
.players {
	font-size: 13px;
	font-weight: 700;
	color: #D1D5DB;
	overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.players.me { color: var(--accent, #F59E0B); }
.markers-row {
	display: flex; flex-wrap: wrap;
	gap: 6px;
	margin-bottom: 14px;
}
.marker {
	font-size: 10px;
	font-weight: 700;
	padding: 3px 8px;
	border-radius: 999px;
}
.rematch {
	display: flex; align-items: center; justify-content: center;
	gap: 8px;
	width: 100%;
	padding: 12px 16px;
	border-radius: 12px;
	background: linear-gradient(135deg, #E24B4A, #C73E3D);
	color: #FFFFFF;
	font-size: 13px;
	font-weight: 800;
	letter-spacing: 0.04em;
	text-decoration: none;
	box-shadow: 0 6px 18px rgba(226, 75, 74, 0.35);
	transition: transform 0.15s, box-shadow 0.15s;
}
.rematch:hover { transform: translateY(-1px); }
.rematch:active { transform: scale(0.99); }
.rematch svg {
	width: 16px; height: 16px;
}
.rematch-hint {
	text-align: center;
	font-size: 10px;
	color: #6B7280;
	margin-top: 6px;
}
</style>
