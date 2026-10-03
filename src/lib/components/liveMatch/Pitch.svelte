<script>
import { getTranslate } from "@tolgee/svelte";
import { MODE } from "$lib/constants/liveMatch.constants.js";
import { isEntryMode } from "$lib/utils/liveMatchState.utils.js";
import MinuteEditor from "./MinuteEditor.svelte";
import PitchPlayer from "./PitchPlayer.svelte";

/**
 * The live pitch: two halves, stacked on phones and side by side from
 * `lg`, with chalk markings, a team label in each half and the players
 * as tap targets. The half opposite the active player turns into the
 * minute editor — see `MinuteEditor`. Awaiting-player modes show a hint
 * on the halfway line and pulse the eligible players.
 *
 * Design A: a white card with grey markings. Design B: a darker grass
 * card with white chalk on the pitch background.
 *
 * @type {{
 *   homePlayers: Array<{ id: string, name: string, avatar_url?: string|null }>,
 *   awayPlayers: Array<{ id: string, name: string, avatar_url?: string|null }>,
 *   homeTeam?: { name: string, logo_url?: string|null }|null,
 *   awayTeam?: { name: string, logo_url?: string|null }|null,
 *   state: import('$lib/utils/liveMatchState.utils.js').LiveMatchState,
 *   saving?: boolean,
 *   onSelectPlayer: (playerId: string, side: "home"|"away") => void,
 *   onLongPressPlayer: (playerId: string, side: "home"|"away") => void,
 *   onMinuteChange: (minute: number) => void,
 *   onStoppageChange: (stoppage: number|null) => void,
 *   onGoalTypeClick: () => void,
 *   onCancel: () => void,
 *   onConfirm: () => void,
 * }}
 */
let {
	homePlayers,
	awayPlayers,
	homeTeam = null,
	awayTeam = null,
	state,
	saving = false,
	onSelectPlayer,
	onLongPressPlayer,
	onMinuteChange,
	onStoppageChange,
	onGoalTypeClick,
	onCancel,
	onConfirm,
} = $props();

const { t } = getTranslate();

const entryActive = $derived(isEntryMode(state.mode));
/** Side that hosts the editor — opposite of the active player. */
const editorSide = $derived(
	entryActive ? (state.playerSide === "home" ? "away" : "home") : null,
);

const eventKind = $derived(
	state.mode === MODE.GOAL_ENTRY
		? "goal"
		: state.mode === MODE.CARD_ENTRY
			? "card"
			: state.mode === MODE.PENALTY_MISS_ENTRY
				? "penalty_missed"
				: null,
);

const awaitingHint = $derived.by(() => {
	if (state.mode === MODE.CARD_AWAITING_PLAYER) {
		return state.pendingCardColor === "red"
			? $t("live_match.hint.card_red")
			: $t("live_match.hint.card_yellow");
	}
	if (state.mode === MODE.PENALTY_MISS_AWAITING_PLAYER) {
		return $t("live_match.hint.penalty_miss");
	}
	if (state.mode === MODE.PENALTY_MISS_AWAITING_KEEPER) {
		return $t("live_match.hint.penalty_keeper");
	}
	return null;
});

const glowColor = $derived(
	state.mode === MODE.CARD_AWAITING_PLAYER
		? state.pendingCardColor === "red"
			? "red"
			: "yellow"
		: state.mode === MODE.PENALTY_MISS_AWAITING_PLAYER ||
				state.mode === MODE.PENALTY_MISS_AWAITING_KEEPER
			? "orange"
			: null,
);

const homeLabel = $derived(homeTeam?.name || $t("new_game.home"));
const awayLabel = $derived(awayTeam?.name || $t("new_game.away"));

function isPlayerScorer(id) {
	if (state.mode === MODE.PENALTY_MISS_AWAITING_KEEPER) {
		// During keeper selection the shooter stays visually flagged.
		return state.playerId === id;
	}
	return state.playerId === id && entryActive;
}
function isPlayerAssister(id) {
	return state.assisterId === id && state.mode === MODE.GOAL_ENTRY;
}
function isPlayerKeeper(id) {
	return state.keeperId === id && state.mode === MODE.PENALTY_MISS_ENTRY;
}
/** Dim players that are not legal targets in the current mode. Used
 *  for the missed-penalty keeper step: only the opposing team can
 *  catch, so the shooter's own teammates are disabled. */
function isPlayerDisabled(id, side) {
	if (state.mode === MODE.PENALTY_MISS_AWAITING_KEEPER) {
		// Same side as shooter → not allowed; shooter itself stays
		// highlighted but not tappable as keeper.
		return side === state.playerSide;
	}
	return false;
}
/** Highlight the other home/away teammate when a scorer is selected. */
function isPlayerAssistHint(id, side) {
	if (state.mode !== MODE.GOAL_ENTRY) return false;
	if (state.isOwnGoal) return false;
	if (side !== state.playerSide) return false;
	if (state.playerId === id) return false;
	if (state.assisterId) return false;
	return true;
}
</script>

{#snippet halfPlayers(players, side)}
	<!-- Three columns for consistent spacing:
	     1 player  → centre column,
	     2 players → outer columns,
	     3 players → all three; four or five get a column each. -->
	{@const slotCols = players.length === 1
		? ["2"]
		: players.length === 2
			? ["1", "3"]
			: players.map((_, i) => String(i + 1))}
	<div
		class="players"
		style="grid-template-columns: repeat({Math.max(3, players.length)}, minmax(0, 1fr));"
	>
		{#each players as p, i (p.id)}
			<div class="flex justify-center min-w-0" style="grid-column-start: {slotCols[i] ?? '2'};">
				<PitchPlayer
					playerId={p.id}
					name={p.name}
					avatarUrl={p.avatar_url}
					{side}
					isScorer={isPlayerScorer(p.id)}
					isAssister={isPlayerAssister(p.id)}
					isKeeper={isPlayerKeeper(p.id)}
					isOwnGoal={state.isOwnGoal && isPlayerScorer(p.id)}
					assistHint={isPlayerAssistHint(p.id, side)}
					awaitingTarget={glowColor !== null && !isPlayerDisabled(p.id, side)}
					disabled={isPlayerDisabled(p.id, side)}
					{glowColor}
					onSelect={() => onSelectPlayer(p.id, side)}
					onLongPress={() => onLongPressPlayer(p.id, side)}
				/>
			</div>
		{/each}
	</div>
{/snippet}

{#snippet half(side, players, team, label)}
	<div class="half half-{side}">
		{#if team?.logo_url}
			<img src={team.logo_url} alt="" class="watermark" aria-hidden="true" />
		{/if}
		<span class="half-label">
			<span class="half-dot" aria-hidden="true"></span>
			<span class="truncate">{label}</span>
		</span>
		<!-- Avatars always mount; only the editor overlay toggles, so
		     PitchPlayer instances keep their state and don't trigger
		     image reloads when the user closes the editor. -->
		<div class="w-full" class:invisible={editorSide === side}>
			{@render halfPlayers(players, side)}
		</div>
		{#if editorSide === side}
			<div class="editor-card">
				<MinuteEditor
					minute={state.minute}
					stoppageMinutes={state.stoppageMinutes}
					goalType={state.goalType}
					previousEvents={state.events}
					{eventKind}
					cardColor={state.pendingCardColor}
					isOwnGoal={state.isOwnGoal}
					{saving}
					onMinuteChange={(m) => onMinuteChange(m)}
					onStoppageChange={(s) => onStoppageChange(s)}
					{onGoalTypeClick}
					{onCancel}
					{onConfirm}
				/>
			</div>
		{/if}
	</div>
{/snippet}

<div class="pitch" data-glow={glowColor}>
	<div class="lines" aria-hidden="true">
		<span class="halfway"></span>
		<span class="circle"></span>
		<span class="spot"></span>
		<span class="box box-home"><span class="goal-box"></span></span>
		<span class="box box-away"><span class="goal-box"></span></span>
	</div>

	<div class="halves">
		{@render half("home", homePlayers, homeTeam, homeLabel)}
		{@render half("away", awayPlayers, awayTeam, awayLabel)}
	</div>

	{#if awaitingHint}
		<div class="center-hint">
			<span class="hint-pill tone-{glowColor}">{awaitingHint}</span>
		</div>
	{:else if state.mode === MODE.IDLE && state.events.length === 0}
		<div class="center-hint">
			<span class="hint-pill">{$t("live_match.hint.idle")}</span>
		</div>
	{/if}
</div>

<style>
/* ── Surface ────────────────────────────────────────────────────────── */
.pitch {
	--chalk: var(--color-chalk);
	--chalk-width: 2px;
	position: relative;
	overflow: hidden;
	background: var(--color-pitch);
	color: var(--color-ink);
	border-radius: var(--radius-card);
	box-shadow: var(--shadow-card);
	transition: box-shadow 150ms;
}

/* Armed card / missed-penalty mode: a coloured rim around the pitch. */
.pitch[data-glow="red"] {
	box-shadow:
		var(--shadow-card),
		inset 0 0 0 3px var(--color-brand);
}

.pitch[data-glow="yellow"],
.pitch[data-glow="orange"] {
	box-shadow:
		var(--shadow-card),
		inset 0 0 0 3px var(--color-gold);
}

:global([data-variant="b"]) .pitch {
	--chalk-width: 3px;
	color: var(--color-on-page);
}

/* ── Chalk markings (portrait on phones, landscape from lg) ─────────── */
.lines {
	position: absolute;
	inset: 10px;
	border: var(--chalk-width) solid var(--chalk);
	pointer-events: none;
}

.lines > span,
.goal-box {
	position: absolute;
}

.halfway {
	left: 0;
	right: 0;
	top: 50%;
	border-top: var(--chalk-width) solid var(--chalk);
	transform: translateY(-50%);
}

.circle {
	left: 50%;
	top: 50%;
	width: 84px;
	height: 84px;
	border: var(--chalk-width) solid var(--chalk);
	border-radius: 50%;
	transform: translate(-50%, -50%);
}

.spot {
	left: 50%;
	top: 50%;
	width: 6px;
	height: 6px;
	border-radius: 50%;
	background: var(--chalk);
	transform: translate(-50%, -50%);
}

/* Penalty and goal areas sit on the goal line; their outer edge
 * overlaps the touchline, so they read as three-sided boxes. */
.box {
	left: 50%;
	width: 52%;
	height: 52px;
	border: var(--chalk-width) solid var(--chalk);
	transform: translateX(-50%);
}

.box-home {
	top: calc(var(--chalk-width) * -1);
}

.box-away {
	bottom: calc(var(--chalk-width) * -1);
}

.goal-box {
	left: 50%;
	width: 48%;
	height: 22px;
	border: var(--chalk-width) solid var(--chalk);
	transform: translateX(-50%);
}

.box-home .goal-box {
	top: calc(var(--chalk-width) * -1);
}

.box-away .goal-box {
	bottom: calc(var(--chalk-width) * -1);
}

/* ── Halves ─────────────────────────────────────────────────────────── */
/* Both halves keep a strict 50/50 share even when the editor is open;
 * `overflow: hidden` stops the editor from spilling past the centre. */
.halves {
	position: relative;
	display: grid;
	grid-template-columns: minmax(0, 1fr);
	grid-template-rows: repeat(2, minmax(0, 1fr));
	height: 460px;
}

.half {
	position: relative;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	min-height: 0;
	padding: 12px;
	overflow: hidden;
}

.watermark {
	position: absolute;
	inset: 0;
	width: 168px;
	height: 168px;
	margin: auto;
	object-fit: contain;
	opacity: 0.08;
	pointer-events: none;
	user-select: none;
}

.players {
	position: relative;
	z-index: 2;
	display: grid;
	align-items: center;
	width: 100%;
	padding: 0 8px;
}

/* Team name in the outer corner of its half. A: condensed caps in the
 * team colour; B: a white pill with a team-coloured dot. */
.half-label {
	--team: var(--color-home);
	position: absolute;
	z-index: 1;
	left: 20px;
	display: inline-flex;
	align-items: center;
	gap: 6px;
	max-width: calc(100% - 40px);
	padding: 0 4px;
	background: var(--color-surface);
	color: var(--team);
	font-family: var(--font-cond);
	font-weight: 700;
	font-size: 14px;
	letter-spacing: 0.02em;
	line-height: 1.4;
	text-transform: uppercase;
}

.half-home .half-label {
	top: 18px;
}

.half-away .half-label {
	--team: var(--color-away);
	bottom: 18px;
}

.half-dot {
	display: none;
	width: 8px;
	height: 8px;
	flex-shrink: 0;
	border-radius: 999px;
	background: var(--team);
}

:global([data-variant="b"]) .half-label {
	padding: 3px 10px;
	border-radius: 999px;
	color: var(--color-ink);
	font-family: var(--font-sans);
	font-size: 12px;
	letter-spacing: 0;
	text-transform: none;
	box-shadow: var(--shadow-control);
}

:global([data-variant="b"]) .half-dot {
	display: inline-block;
}

/* Minute editor over the half opposite the active player. */
.editor-card {
	position: absolute;
	inset: 8px;
	z-index: 10;
	overflow: hidden;
	padding: 12px;
	background: var(--color-surface);
	color: var(--color-ink);
	border: 1px solid var(--color-line);
	border-radius: var(--radius-card);
	box-shadow: var(--shadow-raised);
}

:global([data-variant="b"]) .editor-card {
	border: 0;
	border-radius: 16px;
}

/* ── Hint on the halfway line ───────────────────────────────────────── */
.center-hint {
	position: absolute;
	inset-inline: 12px;
	top: 50%;
	z-index: 20;
	display: flex;
	justify-content: center;
	transform: translateY(-50%);
	pointer-events: none;
}

.hint-pill {
	max-width: 100%;
	padding: 5px 12px;
	border: 1px solid var(--color-line);
	border-radius: var(--radius-control);
	background: var(--color-surface);
	color: var(--color-ink);
	font-size: 13px;
	font-weight: 700;
	line-height: 1.3;
	text-align: center;
}

.hint-pill.tone-red {
	border-color: transparent;
	background: var(--color-brand);
	color: var(--color-on-brand);
}

.hint-pill.tone-yellow,
.hint-pill.tone-orange {
	border-color: transparent;
	background: var(--color-gold);
	color: var(--color-on-gold);
}

:global([data-variant="b"]) .hint-pill {
	border: 0;
	padding: 7px 14px;
	box-shadow: var(--shadow-control);
}

/* ── Desktop: landscape pitch, home left, away right ─────────────────── */
@media (min-width: 1024px) {
	.halves {
		grid-template-columns: repeat(2, minmax(0, 1fr));
		grid-template-rows: minmax(0, 1fr);
		height: 440px;
	}

	.half {
		padding: 16px;
	}

	.half-away .half-label {
		top: 18px;
		bottom: auto;
		left: auto;
		right: 20px;
	}

	.halfway {
		left: 50%;
		right: auto;
		top: 0;
		bottom: 0;
		border-top: 0;
		border-left: var(--chalk-width) solid var(--chalk);
		transform: translateX(-50%);
	}

	.circle {
		width: 110px;
		height: 110px;
	}

	.box {
		left: auto;
		top: 50%;
		width: 64px;
		height: 48%;
		transform: translateY(-50%);
	}

	.box-home {
		top: 50%;
		left: calc(var(--chalk-width) * -1);
	}

	.box-away {
		top: 50%;
		bottom: auto;
		right: calc(var(--chalk-width) * -1);
	}

	.goal-box {
		left: auto;
		top: 50%;
		width: 26px;
		height: 46%;
		transform: translateY(-50%);
	}

	.box-home .goal-box {
		top: 50%;
		left: calc(var(--chalk-width) * -1);
	}

	.box-away .goal-box {
		top: 50%;
		bottom: auto;
		right: calc(var(--chalk-width) * -1);
	}
}
</style>
