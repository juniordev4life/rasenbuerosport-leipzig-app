<script>
import { getTranslate } from "@tolgee/svelte";
import EventFooter from "$lib/components/liveMatch/EventFooter.svelte";
import GoalTypeDialog from "$lib/components/liveMatch/GoalTypeDialog.svelte";
import MatchHeader from "$lib/components/liveMatch/MatchHeader.svelte";
import Pitch from "$lib/components/liveMatch/Pitch.svelte";
import ConfirmDialog from "$lib/components/ui/ConfirmDialog.svelte";
import { getTeamByName } from "$lib/services/teams.services.js";
import {
	cancelEntry,
	confirmEntry,
	initialLiveMatchState,
	longPressPlayer,
	removeEventAt,
	selectPlayer,
	setGoalType,
	setMinute,
	setStoppage,
	toggleCardMode,
	togglePenaltyMissMode,
} from "$lib/utils/liveMatchState.utils.js";

/**
 * Live-match wizard step. Hosts the state-machine for event entry and
 * drives the three children (header / pitch / footer). On "Spiel
 * beenden" it forwards the accumulated score + score_timeline through
 * `onEndMatch` so the parent page can POST the game in one call.
 *
 * Phones stack scoreboard, pitch, event pills and controls; from `xl`
 * the pitch sits next to a column with the pills and the controls.
 *
 * The 11m button bubbles via `onStartPenaltyShootout` so the parent
 * page can decide where the penalty-shootout flow lives — either as
 * another wizard step or a separate route. Kept here as a bubbled
 * event so this component stays oblivious to navigation.
 *
 * @type {{
 *   homePlayers: string[],
 *   awayPlayers: string[],
 *   allPlayers: Array<{ id: string, username: string, avatar_url?: string|null }>,
 *   homeTeam: string,
 *   awayTeam: string,
 *   ending?: boolean,
 *   onEndMatch: (payload: { scoreHome: number, scoreAway: number, scoreTimeline: object[] }) => void,
 *   onStartPenaltyShootout?: (payload: { scoreHome: number, scoreAway: number, scoreTimeline: object[] }) => void,
 *   onBack: () => void,
 * }}
 */
let {
	homePlayers,
	awayPlayers,
	allPlayers,
	homeTeam,
	awayTeam,
	ending = false,
	onEndMatch,
	onStartPenaltyShootout,
	onBack,
} = $props();

const { t } = getTranslate();
const GUEST_ID = "__guest__";

let state = $state(initialLiveMatchState());
let showGoalDialog = $state(false);
/** Index of the event the user is currently confirming a delete for. */
let pendingDeleteIndex = $state(null);

/** @type {import('$lib/services/teams.services.js').TeamData|null} */
let homeTeamData = $state(null);
/** @type {import('$lib/services/teams.services.js').TeamData|null} */
let awayTeamData = $state(null);

$effect(() => {
	if (homeTeam) {
		getTeamByName(homeTeam).then((td) => {
			homeTeamData = td || null;
		});
	}
});
$effect(() => {
	if (awayTeam) {
		getTeamByName(awayTeam).then((td) => {
			awayTeamData = td || null;
		});
	}
});

function playerName(id) {
	if (id.startsWith(GUEST_ID)) return $t("new_game.guest");
	return allPlayers.find((p) => p.id === id)?.username ?? "?";
}
function playerAvatar(id) {
	if (id.startsWith(GUEST_ID)) return null;
	return allPlayers.find((p) => p.id === id)?.avatar_url ?? null;
}

const homePitchPlayers = $derived(
	homePlayers.map((id) => ({
		id,
		name: playerName(id),
		avatar_url: playerAvatar(id),
	})),
);
const awayPitchPlayers = $derived(
	awayPlayers.map((id) => ({
		id,
		name: playerName(id),
		avatar_url: playerAvatar(id),
	})),
);

/**
 * What the scoreboard and the pitch show for a side: the catalogue
 * entry (with crest) once loaded, else the typed name.
 *
 * @param {object|null} data - team from `getTeamByName`
 * @param {string} name - team name chosen on the poster step
 * @returns {{ name: string, logo_url?: string|null }|null}
 */
function teamView(data, name) {
	return data ?? (name ? { name, logo_url: null } : null);
}

const homeTeamView = $derived(teamView(homeTeamData, homeTeam));
const awayTeamView = $derived(teamView(awayTeamData, awayTeam));

/**
 * Team name for an event pill's side marker.
 *
 * @param {"home"|"away"} side
 * @returns {string}
 */
function sideName(side) {
	if (side === "home") return homeTeam || $t("new_game.home");
	return awayTeam || $t("new_game.away");
}

function handleEnd() {
	onEndMatch?.({
		scoreHome: state.scoreHome,
		scoreAway: state.scoreAway,
		scoreTimeline: state.events,
	});
}

/**
 * Hand the current match state up to the parent so it can route into
 * the penalty-shootout flow with the pre-shootout score intact.
 * Parent decides whether that's a new wizard step, a route push or
 * an overlay — this component stays unopinionated.
 */
function handleStartPenaltyShootout() {
	onStartPenaltyShootout?.({
		scoreHome: state.scoreHome,
		scoreAway: state.scoreAway,
		scoreTimeline: state.events,
	});
}

/**
 * Demo bridge for the onboarding tour. Each action drives the same
 * state machine real taps would, so the user sees the editor open,
 * the minute field fill in, the stoppage field unlock and the
 * event pill appear — without touching the DOM. The tour calls these
 * via `window.__rblLiveDemo` (set up below) so we don't have to
 * plumb props or stores just for a first-run walkthrough.
 *
 * The demo intentionally lands on minute 45 + 3 of stoppage time so
 * the tour can showcase the stoppage field — that field is only
 * usable at the 45 / 90 / 120 boundaries. The goal-type pill is
 * highlighted by the tour but left on the default ("Spiel"); a
 * penalty + assist combo wouldn't make sense as a demo example.
 *
 * `reset` must run on every tour exit / completion so demo events
 * never leak into the real `saveGame` payload.
 *
 * @param {"select-scorer"|"select-assister"|"set-minute"|"set-stoppage"|"confirm"|"remove-event"|"reset"} action
 */
function runDemoAction(action) {
	switch (action) {
		case "select-scorer": {
			const id = homePlayers[0];
			if (id) state = selectPlayer(state, { playerId: id, side: "home" });
			break;
		}
		case "select-assister": {
			// 1v1 has no teammate to assist, so skip the tap. Tapping the
			// scorer again would cancel the goal entry, and the remaining
			// demo steps would then run against a closed editor.
			const id = homePlayers[1];
			if (id) state = selectPlayer(state, { playerId: id, side: "home" });
			break;
		}
		case "set-minute":
			// 45 lets the next step (stoppage) showcase that field — only
			// 45 / 90 / 120 unlock the stoppage row.
			state = setMinute(state, 45);
			break;
		case "set-stoppage":
			state = setStoppage(state, 3);
			break;
		case "confirm":
			state = confirmEntry(state);
			break;
		case "remove-event":
			if (state.events.length > 0) state = removeEventAt(state, 0);
			break;
		case "reset":
			state = initialLiveMatchState();
			break;
	}
}

$effect(() => {
	window.__rblLiveDemo = runDemoAction;
	return () => {
		if (window.__rblLiveDemo === runDemoAction) delete window.__rblLiveDemo;
	};
});
</script>

{#snippet deleteBtn(index)}
	<button
		type="button"
		onclick={() => (pendingDeleteIndex = index)}
		class="event-delete"
		aria-label={$t("live_match.events.delete_aria")}
	>
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" width="11" height="11" aria-hidden="true">
			<line x1="18" y1="6" x2="6" y2="18" />
			<line x1="6" y1="6" x2="18" y2="18" />
		</svg>
	</button>
{/snippet}

{#snippet sideMarker(side)}
	{@const name = sideName(side)}
	<span class="event-side" title={name}>
		<span aria-hidden="true">{name.charAt(0).toUpperCase()}</span>
		<span class="sr-only">{name}</span>
	</span>
{/snippet}

<div class="live">
	<div class="live-head">
		<MatchHeader
			homeTeam={homeTeamView}
			awayTeam={awayTeamView}
			scoreHome={state.scoreHome}
			scoreAway={state.scoreAway}
		/>
	</div>

	<div class="live-pitch" data-onboarding="live-pitch">
		<Pitch
			homePlayers={homePitchPlayers}
			awayPlayers={awayPitchPlayers}
			homeTeam={homeTeamView}
			awayTeam={awayTeamView}
			{state}
			onSelectPlayer={(id, side) => (state = selectPlayer(state, { playerId: id, side }))}
			onLongPressPlayer={(id, side) => (state = longPressPlayer(state, { playerId: id, side }))}
			onMinuteChange={(m) => {
				if (state.minute !== m) state = setMinute(state, m);
			}}
			onStoppageChange={(s) => {
				if (state.stoppageMinutes !== s) state = setStoppage(state, s);
			}}
			onGoalTypeClick={() => (showGoalDialog = true)}
			onCancel={() => (state = cancelEntry(state))}
			onConfirm={() => (state = confirmEntry(state))}
		/>
	</div>

	<div class="live-side">
		<!-- Container is always rendered so the onboarding tour can attach
		     its `live-event-pill` anchor at tour-start time, even before
		     the demo `confirm` action inserts the first event. Its margin
		     is toggled with the events count so an empty strip collapses
		     to 0 px height and doesn't add visible whitespace. -->
		<div
			data-onboarding="live-event-pill"
			class="events"
			class:has-events={state.events.length > 0}
		>
			{#if state.events.length > 0}
				{@const reversed = state.events.toReversed()}
				{#each reversed as e, i (i)}
					{@const originalIndex = state.events.length - 1 - i}
					{@const minLabel = (e.stoppage ?? 0) > 0
						? `${e.minute}+${e.stoppage}'`
						: `${e.minute}'`}
					{#if e.event_type === "goal"}
						<span class="event" data-side={e.team}>
							{@render sideMarker(e.team)}
							<span class="event-score">{e.home}:{e.away}</span>
							<span class="event-player">{playerName(e.scored_by)}</span>
							<span class="event-minute">{minLabel}</span>
							{@render deleteBtn(originalIndex)}
						</span>
					{:else if e.event_type === "red_card" || (e.event_type === "card" && e.card_type === "red")}
						<span class="event" data-side={e.team}>
							{@render sideMarker(e.team)}
							<span class="card-shape red" role="img" aria-label={$t("game_detail.event_red_card")}></span>
							<span class="event-player">{playerName(e.player_id)}</span>
							<span class="event-minute">{minLabel}</span>
							{@render deleteBtn(originalIndex)}
						</span>
					{:else if e.event_type === "card"}
						<span class="event" data-side={e.team}>
							{@render sideMarker(e.team)}
							<span class="card-shape yellow" role="img" aria-label={$t("game_detail.event_yellow_card")}></span>
							<span class="event-player">{playerName(e.player_id)}</span>
							<span class="event-minute">{minLabel}</span>
							{@render deleteBtn(originalIndex)}
						</span>
					{:else if e.event_type === "penalty_missed"}
						<span class="event" data-side={e.team}>
							{@render sideMarker(e.team)}
							<svg class="miss-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" width="12" height="12" role="img" aria-label={$t("game_detail.event_penalty_missed")}>
								<line x1="18" y1="6" x2="6" y2="18" />
								<line x1="6" y1="6" x2="18" y2="18" />
							</svg>
							<span class="event-player">{playerName(e.shooter_id)}</span>
							<span class="event-minute">{minLabel}</span>
							{@render deleteBtn(originalIndex)}
						</span>
					{/if}
				{/each}
			{/if}
		</div>

		<div class="controls">
			<div data-onboarding="live-footer">
				<EventFooter
					mode={state.mode}
					pendingCardColor={state.pendingCardColor}
					{ending}
					onToggleCard={(color) => (state = toggleCardMode(state, color))}
					onTogglePenaltyMiss={() => (state = togglePenaltyMissMode(state))}
					onStartPenaltyShootout={handleStartPenaltyShootout}
					onEndMatch={handleEnd}
				/>
			</div>

			<button type="button" onclick={onBack} class="back-link">
				<span aria-hidden="true">←</span>
				{$t("new_game.back")}
			</button>
		</div>
	</div>
</div>

{#if showGoalDialog}
	<GoalTypeDialog
		onPick={(type) => {
			state = setGoalType(state, type);
			showGoalDialog = false;
		}}
		onClose={() => (showGoalDialog = false)}
	/>
{/if}

<ConfirmDialog
	open={pendingDeleteIndex !== null}
	title={$t("live_match.events.delete_title")}
	message={$t("live_match.events.delete_body")}
	actions={[
		{
			label: $t("game_detail.delete_confirm"),
			variant: "primary",
			onClick: () => {
				state = removeEventAt(state, pendingDeleteIndex);
				pendingDeleteIndex = null;
			},
		},
		{
			label: $t("game_detail.delete_cancel"),
			variant: "ghost",
			onClick: () => (pendingDeleteIndex = null),
		},
	]}
	onDismiss={() => (pendingDeleteIndex = null)}
/>

<style>
.live {
	display: flex;
	flex-direction: column;
	gap: 14px;
}

/* ── Event pills ────────────────────────────────────────────────────── */
.events {
	display: flex;
	align-items: center;
	gap: 8px;
	overflow-x: auto;
	scrollbar-width: none;
}

.events::-webkit-scrollbar {
	display: none;
}

.events.has-events {
	padding: 2px 2px 4px;
	margin-bottom: 12px;
}

.event {
	display: inline-flex;
	flex-shrink: 0;
	align-items: center;
	gap: 7px;
	min-height: 34px;
	padding: 0 4px 0 5px;
	background: var(--color-surface);
	color: var(--color-ink);
	border: 1px solid var(--color-line);
	border-radius: var(--radius-badge);
	font-size: 13px;
	white-space: nowrap;
}

/* Side marker: the team's initial on its colour (home red, away navy),
 * full name for screen readers and as a tooltip. */
.event-side {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 22px;
	height: 22px;
	flex-shrink: 0;
	border-radius: var(--radius-avatar);
	background: var(--color-home);
	color: var(--color-on-home);
	font-family: var(--font-cond);
	font-weight: 800;
	font-size: 12px;
}

.event[data-side="away"] .event-side {
	background: var(--color-away);
	color: var(--color-on-away);
}

.event-score {
	font-family: var(--font-num);
	font-weight: var(--num-weight);
	font-size: 16px;
	font-variant-numeric: tabular-nums;
}

.event-player {
	font-weight: 700;
}

.event-minute {
	color: var(--color-muted);
	font-variant-numeric: tabular-nums;
}

.card-shape {
	display: inline-block;
	flex-shrink: 0;
	width: 10px;
	height: 14px;
	border-radius: 2px;
}

.card-shape.red {
	background: var(--color-brand);
}

.card-shape.yellow {
	background: var(--color-gold);
}

.miss-icon {
	flex-shrink: 0;
	color: var(--color-brand);
}

.event-delete {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 26px;
	height: 26px;
	flex-shrink: 0;
	border: 0;
	border-radius: var(--radius-control);
	background: var(--color-sunken);
	color: var(--color-muted);
	cursor: pointer;
}

.event-delete:hover {
	color: var(--color-ink);
	background: var(--color-line);
}

/* ── Controls ───────────────────────────────────────────────────────── */
.controls {
	display: flex;
	flex-direction: column;
	gap: 6px;
}

.back-link {
	align-self: center;
	display: inline-flex;
	align-items: center;
	gap: 6px;
	min-height: 40px;
	padding: 0 12px;
	border: 0;
	background: none;
	color: var(--color-on-page);
	text-shadow: var(--on-page-shadow);
	font-size: 14px;
	cursor: pointer;
}

.back-link:hover {
	text-decoration: underline;
}

/* Design B: pills as white stickers, the controls in one white card. */
:global([data-variant="b"]) .event {
	border: 0;
	padding-left: 4px;
	box-shadow: var(--shadow-control);
}

:global([data-variant="b"]) .controls {
	padding: 14px;
	background: var(--color-surface);
	color: var(--color-ink);
	border-radius: var(--radius-card);
	box-shadow: var(--shadow-card);
}

:global([data-variant="b"]) .back-link {
	color: var(--color-muted);
	text-shadow: none;
	font-weight: 700;
}

/* ── Desktop: the landscape pitch takes the full width, the controls a
 *    comfortable centred column under it. ─────────────────────────── */
@media (min-width: 1024px) {
	.live-side {
		align-self: center;
		width: min(100%, 36rem);
	}
}

/* ── Wide screens: pitch left, pills and controls in a side column.
 *    Below xl the landscape pitch keeps the full width. ─────────────── */
@media (min-width: 1280px) {
	.live {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 22rem;
		grid-template-areas:
			"head head"
			"pitch side";
		align-items: start;
		gap: 24px;
	}

	.live-head {
		grid-area: head;
	}

	.live-pitch {
		grid-area: pitch;
	}

	.live-side {
		grid-area: side;
		position: sticky;
		top: 24px;
		align-self: start;
		width: auto;
	}

	/* The column has the height to list the events instead of scrolling. */
	.events {
		flex-wrap: wrap;
		overflow: visible;
	}
}
</style>
