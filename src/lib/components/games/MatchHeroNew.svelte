<script>
import { getTranslate } from "@tolgee/svelte";
import TeamLogo from "$lib/components/ui/TeamLogo.svelte";
import { getMatchCharacterTags } from "$lib/utils/matchCharacterTags.utils.js";

/**
 * Top block of the match detail page: mode and date, both clubs with the
 * score between them (plus extra time / the shootout result), each
 * side's players with a Sieg / Niederlage tag, the match's character
 * tags and the rematch button.
 * Design A: the red hero band under the header with the score in big
 * display type (a red card on desktop). Design B: a white score card on
 * the pitch with the dark green score chip.
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
 *   class?: string,
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
	class: className = "",
} = $props();

const { t } = getTranslate();

const homeScore = $derived(game?.score_home ?? 0);
const awayScore = $derived(game?.score_away ?? 0);

/**
 * Penalty shootout reshapes "who won": regular score is a draw but
 * the shootout settles it. Treat `penalty_shootout.winner_side` as
 * the authoritative winner whenever the JSONB blob is present, so the
 * side tags read penalties correctly without touching the score numbers
 * themselves.
 */
const penaltyShootout = $derived(game?.penalty_shootout ?? null);
const penaltyWinner = $derived(penaltyShootout?.winner_side ?? null);

const homeWins = $derived(
	penaltyWinner ? penaltyWinner === "home" : homeScore > awayScore,
);
const awayWins = $derived(
	penaltyWinner ? penaltyWinner === "away" : awayScore > homeScore,
);
const isDraw = $derived(!homeWins && !awayWins);

const tags = $derived(getMatchCharacterTags(game));

const TAG_LABEL_KEY = {
	late_drama: "match_hero.tags.late_drama",
	lucky_win: "match_hero.tags.lucky_win",
	defensive_battle: "match_hero.tags.defensive_battle",
	penalty_decision: "match_hero.tags.penalty_decision",
	goal_fest: "match_hero.tags.goal_fest",
	clear_win: "match_hero.tags.clear_win",
	draw: "match_hero.tags.draw",
	comeback: "match_hero.tags.comeback",
	elferkrimi: "match_hero.tags.elferkrimi",
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

/** "win" | "loss" | "draw" from one side's point of view. */
function resultTone(side) {
	if (isDraw) return "draw";
	const wins = side === "home" ? homeWins : awayWins;
	return wins ? "win" : "loss";
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
</script>

{#snippet club(team, fallbackName)}
	<div class="club">
		<span class="crest">
			<TeamLogo
				logoUrl={team?.logo_url}
				teamName={team?.name || fallbackName || "?"}
				size="md"
			/>
		</span>
		<span class="club-name">{team?.name || fallbackName || "—"}</span>
	</div>
{/snippet}

{#snippet side(key, names, isMe)}
	<div class="team {key}">
		<div class="team-meta">
			<span class="side-label">{teamLabel(key)}</span>
			<span class="chip rtag rtag-{resultTone(key)}">{resultLabel(key)}</span>
			{#if isMe}
				<span class="chip chip-gold">{$t("leaderboard.you")}</span>
			{/if}
		</div>
		<div class="players">{names.join(" & ")}</div>
	</div>
{/snippet}

<section class="hero bleed match-hero {className}">
	<div class="top-row">
		{#if game.mode}
			<span class="chip mode">{game.mode}</span>
		{/if}
		<span class="date">{formattedDate} · {formattedTime}</span>
	</div>

	<div class="score-row">
		{@render club(homeTeam, homeTeamName)}
		<div class="score-block">
			<span class="num scoreline">
				<span>{homeScore}</span><span class="colon">:</span><span>{awayScore}</span>
			</span>
			{#if resultSuffix}
				<span class="suffix">{resultSuffix}</span>
			{/if}
			{#if penaltyShootout}
				<span class="penalty" aria-label={$t("game_detail.penalty_score_aria")}>
					{$t("game_detail.penalty_score_label", {
						home: penaltyShootout.final_score?.home ?? 0,
						away: penaltyShootout.final_score?.away ?? 0,
					})}
				</span>
			{/if}
		</div>
		{@render club(awayTeam, awayTeamName)}
	</div>

	<div class="teams">
		{@render side("home", homeNames, userInHome)}
		{@render side("away", awayNames, userInAway)}
	</div>

	{#if tags.length > 0}
		<div class="tags">
			{#each tags as tag (tag.id)}
				<span class="chip tag tag-{tag.variant}">
					{$t(TAG_LABEL_KEY[tag.id] ?? tag.id)}
				</span>
			{/each}
		</div>
	{/if}

	{#if rematchUrl}
		<div class="rematch-block">
			<a href={rematchUrl} class="btn btn-accent rematch">
				<svg
					viewBox="0 0 24 24"
					width="18"
					height="18"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
				>
					<polyline points="23 4 23 10 17 10" />
					<polyline points="1 20 1 14 7 14" />
					<path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
				</svg>
				<span>{$t("match_hero.rematch")}</span>
			</a>
			<p class="rematch-hint">{$t("match_hero.rematch_hint")}</p>
		</div>
	{/if}
</section>

<style>
/* ── Design A: red band under the header ───────────────────────────── */
.match-hero {
	display: flex;
	flex-direction: column;
	gap: 18px;
	padding-top: 18px;
	padding-bottom: 24px;
}

.top-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
}

.mode {
	padding: 3px 8px;
	background: var(--color-surface);
	color: var(--color-brand);
	font-size: 12px;
}

.date {
	margin-left: auto;
	font-family: var(--font-cond);
	font-weight: 700;
	font-size: 13px;
	letter-spacing: 0.03em;
	text-transform: uppercase;
	text-align: right;
}

.score-row {
	display: grid;
	grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
	align-items: center;
	gap: 12px;
}

.club {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8px;
	min-width: 0;
	text-align: center;
}

/* Crests sit on a white tile: a red crest would vanish on the red band. */
.crest {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 56px;
	height: 56px;
	flex-shrink: 0;
	border-radius: var(--radius-tile);
	background: var(--color-surface);
}

.club-name {
	display: -webkit-box;
	max-width: 100%;
	overflow: hidden;
	-webkit-box-orient: vertical;
	-webkit-line-clamp: 2;
	line-clamp: 2;
	overflow-wrap: anywhere;
	font-weight: 700;
	font-size: 14px;
	line-height: 1.2;
}

.score-block {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 6px;
	text-align: center;
}

.scoreline {
	display: inline-flex;
	align-items: baseline;
	font-size: 64px;
	line-height: 0.85;
	white-space: nowrap;
}

.colon {
	margin: 0 0.06em;
}

.suffix,
.penalty {
	font-family: var(--font-cond);
	font-weight: 700;
	letter-spacing: 0.03em;
	text-transform: uppercase;
	font-variant-numeric: tabular-nums;
	white-space: nowrap;
}

.suffix {
	font-size: 13px;
}

.penalty {
	font-size: 15px;
}

.teams {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 12px;
	padding-top: 14px;
	border-top: 1px solid currentColor;
}

.team {
	display: flex;
	flex-direction: column;
	gap: 6px;
	min-width: 0;
}

.team.away {
	align-items: flex-end;
	text-align: right;
}

.team-meta {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 6px;
}

.team.away .team-meta {
	justify-content: flex-end;
}

.side-label {
	font-family: var(--font-label);
	font-weight: var(--label-weight);
	font-size: 12px;
	letter-spacing: var(--label-tracking);
	text-transform: var(--label-case);
}

/* A: the winner's tag solid white, the others outlined. */
.rtag {
	background: transparent;
	color: inherit;
	box-shadow: inset 0 0 0 1px currentColor;
}

.rtag-win {
	background: var(--color-surface);
	color: var(--color-brand);
	box-shadow: none;
}

.players {
	max-width: 100%;
	overflow-wrap: anywhere;
	font-weight: 700;
	font-size: 15px;
	line-height: 1.25;
}

.tags {
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
}

.tag {
	padding: 3px 9px;
	font-size: 12px;
	background: transparent;
	color: inherit;
	box-shadow: inset 0 0 0 1px currentColor;
}

.rematch-block {
	display: flex;
	flex-direction: column;
	gap: 6px;
}

.rematch {
	width: 100%;
}

.rematch-hint {
	margin: 0;
	font-size: 12px;
	text-align: center;
}

@media (min-width: 1024px) {
	.match-hero {
		margin: 0;
		padding: 24px;
		border-radius: var(--radius-card);
	}
}

/* ── Design B: white score card on the pitch ──────────────────────── */
/* `.hero` sets a white focus ring (right for the pitch); this hero is a
 * white card, so it goes back to navy. */
:global([data-variant="b"]) .match-hero {
	--focus-ring: var(--color-navy);
	gap: 16px;
	padding: 18px;
	background: var(--color-surface);
	color: var(--color-ink);
	border-radius: var(--radius-card);
	box-shadow: var(--shadow-card);
}

:global([data-variant="b"]) .mode {
	background: var(--color-win-soft);
	color: var(--color-win);
}

:global([data-variant="b"]) .date {
	color: var(--color-muted);
	font-family: var(--font-sans);
	font-weight: 500;
	letter-spacing: 0;
	text-transform: none;
}

:global([data-variant="b"]) .crest {
	background: var(--color-sunken);
}

:global([data-variant="b"]) .scoreline {
	padding: 8px 14px;
	border-radius: 14px;
	background: var(--color-score);
	color: var(--color-on-score);
	font-size: 42px;
	line-height: 1;
}

:global([data-variant="b"]) .colon {
	margin: 0 0.2em;
}

:global([data-variant="b"]) .suffix {
	color: var(--color-muted);
	font-family: var(--font-sans);
	font-size: 12px;
	letter-spacing: 0;
	text-transform: none;
}

:global([data-variant="b"]) .penalty {
	padding: 3px 10px;
	border-radius: 999px;
	background: var(--color-gold);
	color: var(--color-on-gold);
	font-size: 14px;
	letter-spacing: 0;
	text-transform: none;
}

:global([data-variant="b"]) .teams {
	border-top-color: var(--color-line);
}

:global([data-variant="b"]) .side-label {
	color: var(--color-muted);
}

:global([data-variant="b"]) .rtag,
:global([data-variant="b"]) .tag {
	box-shadow: none;
}

:global([data-variant="b"]) .rtag-win,
:global([data-variant="b"]) .tag-success {
	background: var(--color-win-soft);
	color: var(--color-win);
}

:global([data-variant="b"]) .rtag-loss,
:global([data-variant="b"]) .tag-red {
	background: var(--color-loss-soft);
	color: var(--color-loss);
}

:global([data-variant="b"]) .rtag-draw,
:global([data-variant="b"]) .tag-info {
	background: var(--color-sunken);
	color: var(--color-muted);
}

:global([data-variant="b"]) .tag-warning {
	background: var(--color-gold);
	color: var(--color-on-gold);
}

:global([data-variant="b"]) .rematch-hint {
	color: var(--color-muted);
}
</style>
