<script>
import { getTranslate } from "@tolgee/svelte";
import { primaryMarker } from "$lib/utils/matchMarkers.utils.js";
import { relativeTime } from "$lib/utils/relativeTime.utils.js";

/**
 * One match in the Historie list, linking to its detail page.
 *   - Header: the signed-in player's result (S / U / N, only when they
 *     played), mode and time, and the match's primary marker
 *     (Hattrick, Torreich, …) or the "wird analysiert" badge.
 *   - Body: both sides with the score between them; the winning side is
 *     set in bold, the losing side muted. Under the score: extra time or
 *     the shootout result, and the player's ELO change.
 * Design A: the score in display type. Design B: a dark green score chip.
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

// Line under the score. Three cases:
//   - shootout: "i.E. 5:6" with the actual penalty score so the full
//     result is visible at a glance (the "n.E." flag is implied by it);
//   - extra time without shootout: the classic "n.V." short tag;
//   - everything else: nothing.
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
// 1:1 (5:6 i.E.) shows up as "U" and the loser team looks like it tied,
// even though it lost the shootout.
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

// The result marker is meaningful only for the logged-in user. When they
// weren't part of the match (e.g. browsing "Alle Spiele"), it is hidden
// instead of showing the home-team perspective as if it were theirs.
const result = $derived.by(() => {
	if (!userInvolved) return null;
	if (isDraw) return "D";
	return myEntry.team === winnerSide ? "W" : "L";
});

const RESULT = {
	W: {
		cls: "result-w",
		letterKey: "historie.w_short",
		wordKey: "game_detail.lineup.result_win",
	},
	D: {
		cls: "result-d",
		letterKey: "historie.d_short",
		wordKey: "game_detail.lineup.result_draw",
	},
	L: {
		cls: "result-l",
		letterKey: "historie.l_short",
		wordKey: "game_detail.lineup.result_loss",
	},
};

const team1 = $derived(players.filter((p) => p.team === "home"));
const team2 = $derived(players.filter((p) => p.team === "away"));

const marker = $derived(primaryMarker(game));

/** Chip look per marker. The text names the marker; colour only decorates. */
const MARKER_CHIP = {
	comeback: "chip-win",
	hattrick: "chip-gold tone-gold",
	klar: "chip-navy",
	zunull: "chip-aqua tone-aqua",
	torreich: "chip-brand tone-brand",
	krimi: "chip-outline",
};

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
const eloTone = $derived(eloDelta > 0 ? "win" : eloDelta < 0 ? "loss" : "draw");

const special = $derived(
	userInvolved && (marker?.type === "comeback" || marker?.type === "hattrick"),
);

/**
 * Bold for the winning side, muted for the losing one, plain for a draw.
 * @param {"home"|"away"} side
 */
function sideTone(side) {
	if (analyzing || !winnerSide) return "";
	return winnerSide === side ? "winner" : "loser";
}

/** Signed ELO change with a real minus sign: "+12", "−5", "±0". */
function formatDelta(n) {
	if (n > 0) return `+${n}`;
	if (n < 0) return `−${Math.abs(n)}`;
	return "±0";
}

// Player usernames when a side has human players; otherwise the in-game team
// preset in the app (home_team_name / away_team_name) — so a CPU/no-human side
// shows e.g. "Lombardia FC" instead of a blank or "?". There is no CPU mode;
// solo test matches simply leave one side without a human player.
function teamLabel(entries, fallbackName) {
	const names = entries.map((p) => p.profiles?.username).filter(Boolean);
	if (names.length) return names.join(" & ");
	return fallbackName || "?";
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

<a
	href={`/app/games/${game.id}`}
	class="card match"
	class:user-involved={userInvolved}
	class:special
	class:analyzing
>
	<div class="head">
		{#if analyzing}
			<span class="spinner spinner-sm" aria-hidden="true"></span>
		{:else if result}
			<span class="result {RESULT[result].cls}" aria-hidden="true">
				{$t(RESULT[result].letterKey)}
			</span>
			<span class="sr-only">{$t(RESULT[result].wordKey)}</span>
		{/if}
		<span class="meta">
			<span class="mode">{game.mode ?? "—"}</span>
			<span class="time">{time}</span>
		</span>
		{#if analyzing}
			<span class="chip chip-gold tag">
				<span class="pulse" aria-hidden="true"></span>
				{$t("historie.analyzing")}
			</span>
		{:else if marker && markerLabel}
			<span class="chip tag {MARKER_CHIP[marker.type] ?? 'chip-outline'}">
				{markerLabel}
			</span>
		{/if}
	</div>

	<div class="teams">
		<span class="side home {sideTone('home')}">
			{teamLabel(team1, game.home_team_name)}
		</span>
		<span class="centre">
			{#if analyzing}
				<span class="num score-val pending">–:–</span>
			{:else}
				<span class="num score-val">
					{homeScore}<span class="colon">:</span>{awayScore}
				</span>
				{#if resultSuffix}
					<span class="suffix">{resultSuffix}</span>
				{/if}
			{/if}
			{#if userInvolved && eloDelta != null}
				<span class="delta delta-{eloTone}">{formatDelta(eloDelta)} ELO</span>
			{/if}
		</span>
		<span class="side away {sideTone('away')}">
			{teamLabel(team2, game.away_team_name)}
		</span>
	</div>
</a>

<style>
.match {
	display: flex;
	flex-direction: column;
	gap: 12px;
	padding: 14px 16px;
	text-decoration: none;
	transition:
		transform 120ms,
		box-shadow 120ms;
}

.match:hover {
	transform: translateY(-1px);
	box-shadow: var(--shadow-raised);
}

.match:active {
	transform: scale(0.99);
}

/* The player's own comebacks and hattricks get a gold edge. */
.match.special {
	box-shadow:
		inset 3px 0 0 var(--color-gold),
		var(--shadow-card);
}

.match.special:hover {
	box-shadow:
		inset 3px 0 0 var(--color-gold),
		var(--shadow-raised);
}

/* ── Header: result, mode · time, marker ───────────────────────────── */
.head {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 6px 10px;
	min-height: 26px;
}

.meta {
	display: flex;
	align-items: center;
	gap: 8px;
	min-width: 0;
	color: var(--color-muted);
	font-family: var(--font-cond);
	font-weight: 700;
	font-size: 12px;
	letter-spacing: 0.02em;
	text-transform: uppercase;
	white-space: nowrap;
}

.mode::after {
	content: "—";
	margin-left: 8px;
}

.tag {
	margin-left: auto;
	max-width: 100%;
	overflow: hidden;
	text-overflow: ellipsis;
}

.pulse {
	width: 6px;
	height: 6px;
	flex-shrink: 0;
	border-radius: 999px;
	background: currentColor;
	animation: pulse 1.2s ease-in-out infinite;
}

@keyframes pulse {
	0%,
	100% {
		opacity: 1;
	}
	50% {
		opacity: 0.3;
	}
}

/* ── Body: home · score · away ─────────────────────────────────────── */
/* Fills the card, so cards of equal height in a desktop row keep the
 * score line centred. */
.teams {
	flex: 1;
	display: grid;
	grid-template-columns: minmax(0, 1fr) minmax(88px, auto) minmax(0, 1fr);
	align-items: center;
	gap: 10px;
}

.side {
	font-size: 15px;
	line-height: 1.2;
	overflow-wrap: anywhere;
	text-wrap: balance;
}

.side.home {
	text-align: right;
}

.side.winner {
	font-weight: 700;
}

.side.loser {
	color: var(--color-muted);
}

.centre {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 5px;
	text-align: center;
}

.score-val {
	display: inline-flex;
	align-items: baseline;
	font-size: 34px;
	line-height: 0.85;
	white-space: nowrap;
}

.score-val.pending {
	color: var(--color-muted);
}

.colon {
	margin: 0 0.04em;
}

.suffix {
	color: var(--color-brand);
	font-family: var(--font-cond);
	font-weight: 700;
	font-size: 12px;
	letter-spacing: 0.02em;
	text-transform: uppercase;
	white-space: nowrap;
}

/* The player's ELO change is the shared `.delta`: coloured text in A, a
 * pill in B. */
.delta {
	font-size: 13px;
}

/* ── Design B: mode pill, soft marker pills, dark green score chip ─── */
:global([data-variant="b"]) .meta {
	font-family: var(--font-sans);
	font-weight: 400;
	letter-spacing: 0;
	text-transform: none;
}

:global([data-variant="b"]) .mode {
	padding: 2px 8px;
	border-radius: 999px;
	background: var(--color-win-soft);
	color: var(--color-win);
	font-family: var(--font-cond);
	font-weight: 700;
}

:global([data-variant="b"]) .mode::after {
	content: none;
}

:global([data-variant="b"]) .tone-gold {
	background: var(--color-gold-soft);
	color: var(--color-ink);
}

:global([data-variant="b"]) .tone-brand {
	background: var(--color-loss-soft);
	color: var(--color-loss);
}

:global([data-variant="b"]) .tone-aqua {
	background: color-mix(in srgb, var(--color-aqua) 22%, var(--color-surface));
}

:global([data-variant="b"]) .score-val {
	padding: 6px 12px;
	border-radius: 12px;
	background: var(--color-score);
	color: var(--color-on-score);
	font-size: 26px;
	line-height: 1;
}

:global([data-variant="b"]) .score-val.pending {
	background: var(--color-sunken);
	color: var(--color-muted);
}

:global([data-variant="b"]) .colon {
	margin: 0 0.2em;
}

:global([data-variant="b"]) .suffix {
	color: var(--color-muted);
	font-family: var(--font-sans);
	font-size: 11px;
	letter-spacing: 0;
	text-transform: none;
}

:global([data-variant="b"]) .delta {
	font-size: 12px;
}

@media (prefers-reduced-motion: reduce) {
	.match,
	.match:hover,
	.match:active {
		transform: none;
	}

	.pulse {
		animation: none;
	}
}
</style>
