<script>
import { getTranslate } from "@tolgee/svelte";
import EventFooter from "$lib/components/liveMatch/EventFooter.svelte";
import GoalTypeDialog from "$lib/components/liveMatch/GoalTypeDialog.svelte";
import MatchHeader from "$lib/components/liveMatch/MatchHeader.svelte";
import Pitch from "$lib/components/liveMatch/Pitch.svelte";
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

function gradientFor(id) {
	const palette = [
		["#84CC16", "#65A30D"],
		["#E24B4A", "#C73E3D"],
		["#6366F1", "#4338CA"],
		["#F59E0B", "#D97706"],
		["#06B6D4", "#0891B2"],
		["#A78BFA", "#7C3AED"],
		["#EC4899", "#BE185D"],
		["#14B8A6", "#0F766E"],
	];
	let hash = 0;
	for (let i = 0; i < id.length; i += 1) {
		hash = (hash * 31 + id.charCodeAt(i)) | 0;
	}
	const [a, b] = palette[Math.abs(hash) % palette.length];
	return `linear-gradient(135deg, ${a}, ${b})`;
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
 * the minute slider scroll, the stoppage slider light up and the
 * event pill appear — without touching the DOM. The tour calls these
 * via `window.__rblLiveDemo` (set up below) so we don't have to
 * plumb props or stores just for a first-run walkthrough.
 *
 * The demo intentionally lands on minute 45 + 3 of stoppage time so
 * the tour can showcase the stoppage slider — that slider is only
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
			// Prefer a different teammate, fall back to the scorer for 1v1
			// games — the state machine treats a second tap on the scorer
			// as a no-op, so the editor still shows the right end state.
			const id = homePlayers[1] ?? homePlayers[0];
			if (id) state = selectPlayer(state, { playerId: id, side: "home" });
			break;
		}
		case "set-minute":
			// 45 lets the next step (stoppage) showcase the slider — only
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
		class="w-4 h-4 rounded-full bg-black/30 hover:bg-black/60 flex items-center justify-center text-[10px] text-text-secondary hover:text-text-primary shrink-0"
		aria-label={$t("live_match.events.delete_aria")}
	>×</button>
{/snippet}

<div class="flex flex-col gap-3">
	<MatchHeader
		homeTeam={homeTeamData}
		awayTeam={awayTeamData}
		scoreHome={state.scoreHome}
		scoreAway={state.scoreAway}
	/>

	<div class="my-3" data-onboarding="live-pitch">
		<Pitch
		homePlayers={homePitchPlayers}
		awayPlayers={awayPitchPlayers}
		homeTeam={homeTeamData}
		awayTeam={awayTeamData}
		{state}
		{gradientFor}
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

	<!-- Container is always rendered so the onboarding tour can attach
	     its `live-event-pill` anchor at tour-start time, even before
	     the demo `confirm` action inserts the first event. Padding +
	     margin are toggled with the events count so an empty strip
	     collapses to 0 px height and doesn't add visible whitespace. -->
	<div
		data-onboarding="live-event-pill"
		class="flex items-center gap-2 overflow-x-auto whitespace-nowrap [&::-webkit-scrollbar]:hidden [scrollbar-width:none] {state.events.length > 0 ? 'px-2 py-1' : ''}"
	>
		{#if state.events.length > 0}
			{@const reversed = state.events.toReversed()}
			{#each reversed as e, i (i)}
				{@const originalIndex = state.events.length - 1 - i}
				{@const minLabel = (e.stoppage ?? 0) > 0
					? `${e.minute}+${e.stoppage}'`
					: `${e.minute}'`}
				{#if e.event_type === "goal"}
					{@const isHome = e.team === "home"}
					{@const player = playerName(e.scored_by)}
					<span class="inline-flex shrink-0 items-center gap-1.5 rounded-full pl-2.5 pr-1 py-1 text-[11px] font-semibold {isHome ? 'bg-accent-red/15 text-accent-red' : 'bg-success/15 text-success'}">
						<span class="font-bold tabular-nums">{e.home}:{e.away}</span>
						<span class="opacity-80">{player}</span>
						<span class="text-text-muted tabular-nums">{minLabel}</span>
						{@render deleteBtn(originalIndex)}
					</span>
				{:else if e.event_type === "red_card" || (e.event_type === "card" && e.card_type === "red")}
					<span class="inline-flex shrink-0 items-center gap-1 rounded-full pl-2.5 pr-1 py-1 text-[11px] font-semibold bg-accent-red/20 text-accent-red">
						<span aria-hidden="true">🟥</span>
						<span class="opacity-80">{playerName(e.player_id)}</span>
						<span class="text-text-muted tabular-nums">{minLabel}</span>
						{@render deleteBtn(originalIndex)}
					</span>
				{:else if e.event_type === "card"}
					<span class="inline-flex shrink-0 items-center gap-1 rounded-full pl-2.5 pr-1 py-1 text-[11px] font-semibold bg-warning/20 text-warning">
						<span aria-hidden="true">🟨</span>
						<span class="opacity-80">{playerName(e.player_id)}</span>
						<span class="text-text-muted tabular-nums">{minLabel}</span>
						{@render deleteBtn(originalIndex)}
					</span>
				{:else if e.event_type === "penalty_missed"}
					<span class="inline-flex shrink-0 items-center gap-1 rounded-full pl-2.5 pr-1 py-1 text-[11px] font-semibold bg-warning/20 text-warning">
						<span aria-hidden="true">❌</span>
						<span class="opacity-80">{playerName(e.shooter_id)}</span>
						<span class="text-text-muted tabular-nums">{minLabel}</span>
						{@render deleteBtn(originalIndex)}
					</span>
				{/if}
			{/each}
		{/if}
	</div>

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

	<button
		type="button"
		onclick={onBack}
		class="self-center text-xs text-text-muted hover:text-text-primary px-3 py-2"
	>
		← {$t("new_game.back")}
	</button>
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

{#if pendingDeleteIndex !== null}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
		onclick={() => (pendingDeleteIndex = null)}
		role="dialog"
		aria-modal="true"
	>
		<div
			class="bg-bg-secondary border border-border rounded-2xl w-full max-w-sm p-5"
			onclick={(e) => e.stopPropagation()}
		>
			<h3 class="text-base font-bold mb-2">{$t("live_match.events.delete_title")}</h3>
			<p class="text-sm text-text-secondary mb-5">
				{$t("live_match.events.delete_body")}
			</p>
			<div class="flex gap-3">
				<button
					type="button"
					onclick={() => (pendingDeleteIndex = null)}
					class="flex-1 py-2.5 rounded-lg bg-bg-input border border-border text-sm font-medium text-text-primary hover:bg-bg-card"
				>
					{$t("game_detail.delete_cancel")}
				</button>
				<button
					type="button"
					onclick={() => {
						state = removeEventAt(state, pendingDeleteIndex);
						pendingDeleteIndex = null;
					}}
					class="flex-1 py-2.5 rounded-lg bg-error text-white text-sm font-medium hover:bg-error/90"
				>
					{$t("game_detail.delete_confirm")}
				</button>
			</div>
		</div>
	</div>
{/if}
