<script>
import { getTranslate } from "@tolgee/svelte";
import { fade } from "svelte/transition";
import { goto } from "$app/navigation";
import { page } from "$app/state";
import MatchPosterStep from "$lib/components/games/MatchPosterStep.svelte";
import PlayerLobbyStep from "$lib/components/games/PlayerLobbyStep.svelte";
import LiveMatchStep from "$lib/components/liveMatch/LiveMatchStep.svelte";
import PenaltyStep from "$lib/components/penaltyShootout/PenaltyStep.svelte";
import ConfirmDialog from "$lib/components/ui/ConfirmDialog.svelte";
import { ROUTES } from "$lib/constants/routes.constants.js";
import { get, post } from "$lib/services/api.services.js";
import {
	fetchRecordingStatus,
	requestRecordingAbort,
	requestRecordingStart,
	requestRecordingStop,
} from "$lib/services/recording.services.js";
import {
	isOnboardingDone,
	ONBOARDING_KEYS,
	runOnboardingTour,
} from "$lib/utils/onboarding.utils.js";
import { parseRematchParams } from "$lib/utils/rematch.utils.js";

const { t } = getTranslate();

const GUEST_ID = "__guest__";

// Wizard step. 1 = Lobby, 2 = Match poster, 3 = Live-match event entry,
// 4 = Penalty shootout. The visible stepper stops at "Anpfiff" —
// step 3 + 4 are linear follow-ups, and step 4 only fires when the
// user taps the 11m button in the live step.
let step = $state(1);

let homePlayers = $state([]);
let awayPlayers = $state([]);

let homeTeam = $state("");
let awayTeam = $state("");

let saving = $state(false);

// Office capture: provisional recording id, generated once on kickoff.
// The real game id only exists after saving (see saveGame). Plain lets —
// never rendered. `recordingClosed` marks that the final stop command
// went out, so the unmount cleanup below must not send another one.
let recordingId = null;
let recordingClosed = false;
// User chose "play without recording" — don't auto-restart on step re-entry.
let recordingDeclined = false;
// Live recording status for the UI: idle | starting | recording | failed.
let recordingStatus = $state("idle");
let showCancelConfirm = $state(false);
let showRecordingError = $state(false);
// Status poll handle + the window after which silence counts as failure
// (agent offline / wedged). The agent confirms within ~grace + one poll.
let pollTimer = null;
let pollStartedAt = 0;
const RECORDING_POLL_MS = 2000;
const RECORDING_TIMEOUT_MS = 12000;

/**
 * Snapshot captured at the moment the user taps "11m" in the live
 * step. The penalty step renders against this, and we forward it
 * verbatim into `saveGame` once the shootout completes — the
 * regular-time score never changes.
 */
let preShootout = $state(
	/** @type {{ scoreHome: number, scoreAway: number, scoreTimeline: object[] } | null} */ (
		null
	),
);

let allPlayers = $state([]);
let loading = $state(true);

const mode = $derived.by(() => {
	const h = homePlayers.length;
	const a = awayPlayers.length;
	if (h === 1 && a === 1) return "1v1";
	if (h === 2 && a === 2) return "2v2";
	return `${h}v${a}`;
});

const isRematch = $derived(page.url.searchParams.has("hp"));

// Seed wizard state synchronously from the URL *before* loadData
// fires — this way the onboarding effect (gated by `loading`) only
// sees the final `step` value and avoids a brief LOBBY-onboarding
// flash before jumping to LIVE on the rematch path.
$effect(() => {
	const rematch = parseRematchParams(page.url.searchParams);
	if (rematch) {
		homePlayers = rematch.homePlayers;
		awayPlayers = rematch.awayPlayers;
		homeTeam = rematch.homeTeam;
		awayTeam = rematch.awayTeam;
		step = 3;
	}
	loadData();
});

async function loadData() {
	try {
		const res = await get("/v1/players");
		allPlayers = res.data || [];
	} catch (err) {
		console.error("Failed to load players:", err);
	} finally {
		loading = false;
	}
}

function goToStep(n) {
	step = n;
}

function goBack() {
	step = Math.max(1, step - 1);
}

/**
 * Generates the provisional recording id, sends the start command and begins
 * polling the agent's status — once per recording. Guarded so re-entering the
 * live step (back from poster, return from the penalty step) keeps the running
 * recording, and so "play without recording" is not undone on re-entry.
 */
function ensureRecordingStarted() {
	if (recordingId || recordingDeclined) return;
	recordingId = crypto.randomUUID();
	recordingClosed = false; // fresh recording — re-arm the abandon cleanup
	recordingStatus = "starting";
	requestRecordingStart(recordingId);
	startStatusPolling();
}

function startStatusPolling() {
	stopStatusPolling();
	pollStartedAt = Date.now();
	pollTimer = setInterval(pollRecordingStatus, RECORDING_POLL_MS);
}

function stopStatusPolling() {
	if (pollTimer) {
		clearInterval(pollTimer);
		pollTimer = null;
	}
}

/**
 * One status poll: confirms capture, surfaces a failure, or — after the
 * timeout window with no answer (agent offline / wedged) — treats the
 * silence as a failure so the user is never left waiting forever.
 */
async function pollRecordingStatus() {
	if (!recordingId) return stopStatusPolling();
	const status = await fetchRecordingStatus(recordingId);
	if (!recordingId) return stopStatusPolling(); // cleared mid-request (cancel)
	if (status === "recording") {
		recordingStatus = "recording";
		stopStatusPolling(); // start confirmed
	} else if (status === "failed") {
		failRecording();
	} else if (Date.now() - pollStartedAt > RECORDING_TIMEOUT_MS) {
		failRecording();
	}
}

function failRecording() {
	recordingStatus = "failed";
	stopStatusPolling();
	showRecordingError = true;
}

/** Live-step back button: confirm before discarding match + recording. */
function requestCancel() {
	showCancelConfirm = true;
}

/**
 * Discard the running recording (abort = stop + delete on the agent), drop the
 * provisional id and return to the poster step. Shared by the cancel
 * confirmation and the recording-error "try again" action.
 */
function discardRecordingAndLeave() {
	showCancelConfirm = false;
	showRecordingError = false;
	recordingDeclined = false; // a fresh kickoff from the poster may record again
	stopStatusPolling();
	if (recordingId) {
		requestRecordingAbort(recordingId);
		recordingId = null;
	}
	recordingClosed = true;
	recordingStatus = "idle";
	goBack();
}

/**
 * Recording-error "play without recording": discard any partial capture but
 * stay in the live step so the match can be finished without a video.
 */
function playWithoutRecording() {
	showRecordingError = false;
	recordingDeclined = true;
	stopStatusPolling();
	if (recordingId) {
		requestRecordingAbort(recordingId);
		recordingId = null;
	}
	recordingClosed = true;
	recordingStatus = "idle";
}

// Kickoff trigger: fires on every path into the live step — "Anpfiff"
// from the poster, the rematch shortcut, and the penalty-abort return.
$effect(() => {
	if (step === 3) ensureRecordingStarted();
});

// Abandon cleanup: the user left /games/new without saving (back to
// dashboard, navigation away). Abort the recording under the provisional
// id — leaving without saving discards the capture (stop + delete).
$effect(() => {
	return () => {
		stopStatusPolling();
		if (recordingId && !recordingClosed) {
			requestRecordingAbort(recordingId);
		}
	};
});

/**
 * User tapped "11m" in the live step. Capture the regular-time
 * snapshot and advance to the penalty step. The shootout itself is
 * driven by `PenaltyStep` — see `handlePenaltyComplete` for the
 * exit path back into `saveGame`.
 *
 * @param {{ scoreHome: number, scoreAway: number, scoreTimeline: object[] }} payload
 */
function handleStartPenaltyShootout(payload) {
	preShootout = payload;
	step = 4;
}

/**
 * Translate a single shot from the in-component camelCase shape into
 * the snake-case wire format the backend stores in `penalty_shootout`.
 *
 * @param {{ order: number, round: number, team: string, shooterId: string, result: string, keeperId: string | null }} shot
 * @returns {object}
 */
function shotToWire(shot) {
	return {
		order: shot.order,
		round: shot.round,
		team: shot.team,
		shooter_id: shot.shooterId,
		result: shot.result,
		keeper_id: shot.keeperId ?? null,
	};
}

/**
 * Project the converted shoot-by-shoot record into the regular
 * `score_timeline` shape so the timeline view, the per-player goals
 * tally and the AI match-report prompt all see the shootout as
 * first-class goal events. Only converted shots become entries —
 * misses stay in the `penalty_shootout` JSONB only.
 *
 * `home` / `away` track the SHOOTOUT score (not combined with
 * regular time), and `period: "penalty"` disambiguates the entries
 * from in-game penalties (which keep `period: "regular"` /
 * `"extra_time"`). The schema already supports this shape — see
 * `goalEntrySchema` in the backend's games schema.
 *
 * @param {Array<{ team: string, result: string, shooterId: string }>} shots
 * @returns {Array<object>}
 */
function buildPenaltyTimelineEntries(shots) {
	const entries = [];
	let home = 0;
	let away = 0;
	for (const shot of shots) {
		if (shot.result !== "goal") continue;
		if (shot.team === "home") home += 1;
		else if (shot.team === "away") away += 1;
		entries.push({
			event_type: "goal",
			home,
			away,
			period: "penalty",
			scored_by: shot.shooterId,
			goal_type: "penalty",
		});
	}
	return entries;
}

/**
 * Hand the shootout result back to `saveGame`. Regular-time score
 * stays the source of truth on `score_home` / `score_away`; the
 * shoot-by-shoot record + winner side ride along in the new
 * `penalty_shootout` payload and the match-level `result_type`
 * flips to "penalty" so downstream consumers (history badge,
 * match-detail hero) can render the i.E. decoration.
 *
 * Converted shootout goals are also appended to `score_timeline`
 * with `period: "penalty"` so the timeline view and the reporter
 * prompt pick them up alongside the regular goals — without this
 * the reporter narrates the match as if it had ended in a draw.
 *
 * @param {{ shots: object[], finalPenaltyScore: { home: number, away: number }, winnerSide: 'home' | 'away' }} result
 */
function handlePenaltyComplete(result) {
	if (!preShootout) return;
	const penaltyTimelineEntries = buildPenaltyTimelineEntries(result.shots);
	saveGame({
		scoreHome: preShootout.scoreHome,
		scoreAway: preShootout.scoreAway,
		scoreTimeline: [...preShootout.scoreTimeline, ...penaltyTimelineEntries],
		resultType: "penalty",
		penaltyShootout: {
			triggered_at: new Date().toISOString(),
			score_before: {
				home: preShootout.scoreHome,
				away: preShootout.scoreAway,
			},
			final_score: result.finalPenaltyScore,
			winner_side: result.winnerSide,
			shots: result.shots.map(shotToWire),
		},
	});
}

/**
 * Aborting from the penalty step drops the shootout state and goes
 * back to the live match — same as the in-step "letzten Schuss
 * korrigieren" but for the whole sequence.
 */
function handlePenaltyAbort() {
	preShootout = null;
	step = 3;
}

function cancel() {
	goto(ROUTES.DASHBOARD);
}

/**
 * Derive the match-level `result_type` from the timeline + penalty
 * payload. Replaces the old explicit "Verlängerung starten" button —
 * a goal recorded with `minute > 90` (which already lands with
 * `period: "extra_time"` from the live-match state machine) is now
 * enough to flag the match as having gone into extra time.
 *
 * Priority order: penalty > extra_time > regular. A shootout always
 * implies extra time was played, so we don't need to also check the
 * timeline in that case.
 *
 * @param {object[]} timeline - score_timeline entries (snake_case)
 * @param {object|null} penaltyShootout - present iff a shootout happened
 * @returns {"regular" | "extra_time" | "penalty"}
 */
function deriveResultType(timeline, penaltyShootout) {
	if (penaltyShootout) return "penalty";
	const hasExtraTimeEvent = (timeline ?? []).some(
		(e) => e?.period === "extra_time",
	);
	return hasExtraTimeEvent ? "extra_time" : "regular";
}

async function saveGame({
	scoreHome,
	scoreAway,
	scoreTimeline,
	resultType,
	penaltyShootout = null,
}) {
	saving = true;
	const effectiveResultType =
		resultType ?? deriveResultType(scoreTimeline, penaltyShootout);
	try {
		const players = [
			...homePlayers
				.filter((id) => !id.startsWith(GUEST_ID))
				.map((id) => ({
					id,
					team: "home",
					team_name: homeTeam || undefined,
				})),
			...awayPlayers
				.filter((id) => !id.startsWith(GUEST_ID))
				.map((id) => ({
					id,
					team: "away",
					team_name: awayTeam || undefined,
				})),
		];

		const res = await post("/v1/games", {
			mode,
			score_home: scoreHome,
			score_away: scoreAway,
			players,
			score_timeline: scoreTimeline.length > 0 ? scoreTimeline : undefined,
			result_type: effectiveResultType,
			...(penaltyShootout && { penalty_shootout: penaltyShootout }),
			...(recordingId && { recording_id: recordingId }),
			// Zero-tracking: nobody tapped, but a recording ran — save as
			// PENDING (0:0, no ELO). The capture pipeline extracts the real
			// timeline from the recording and finalizes the game.
			...(recordingId && scoreTimeline.length === 0 && { pending: true }),
			// Both poster-step teams travel with the game — the only carrier
			// for sides without players (CPU opponents), where
			// game_players.team_name does not exist.
			...(homeTeam && { home_team_name: homeTeam }),
			...(awayTeam && { away_team_name: awayTeam }),
		});

		const gameId = res.data?.id;

		// Stop the office recording under the REAL game id — the agent
		// uploads and reports video_status against this row. Fire-and-
		// forget: a failed stop must never block the save flow.
		stopStatusPolling();
		if (recordingId) {
			recordingClosed = true;
			requestRecordingStop(gameId || recordingId);
		}

		if (gameId) {
			goto(`/app/games/${gameId}`);
		} else {
			goto(ROUTES.DASHBOARD);
		}
	} catch (err) {
		console.error("Failed to save game:", err);
	} finally {
		saving = false;
	}
}

/** Index of the active stepper dot. Step 3 still highlights "Anpfiff". */
const visibleStep = $derived(step >= 2 ? 2 : 1);

/**
 * Per-step onboarding tour driven by intro.js. Each wizard step has
 * its own storage flag (lobby / poster / live), so a user who lands
 * directly on the live step via the rematch shortcut still sees the
 * lobby + poster tours the next time they go through the regular
 * flow. The tour helper imports intro.js + its CSS lazily so the
 * bundle stays slim for return visits where nothing fires.
 */
const ONBOARDING_BY_STEP = {
	1: ONBOARDING_KEYS.NEW_GAME_LOBBY,
	2: ONBOARDING_KEYS.NEW_GAME_POSTER,
	3: ONBOARDING_KEYS.NEW_GAME_LIVE,
};
const triggeredTours = new Set();

$effect(() => {
	if (loading) return;
	const key = ONBOARDING_BY_STEP[step];
	if (!key || triggeredTours.has(key) || isOnboardingDone(key)) return;
	triggeredTours.add(key);
	// Two rAFs: the first lets Svelte commit the step swap, the second
	// gives the freshly mounted step's children (e.g. the live pitch's
	// team logos) a tick to layout before intro.js measures anchors.
	requestAnimationFrame(() => {
		requestAnimationFrame(() => {
			runOnboardingTour(key);
		});
	});
});

/**
 * Manually re-trigger the current step's onboarding tour. Useful when
 * someone comes back to the app after a longer break and wants to
 * see the explanation again — the persisted "done" flag would
 * otherwise suppress the auto-trigger. We bypass `isOnboardingDone`
 * by calling `runOnboardingTour` directly, and drop the per-session
 * `triggeredTours` guard so the auto-effect could fire it again if
 * the user navigates back to this step later.
 */
function replayTourForCurrentStep() {
	const key = ONBOARDING_BY_STEP[step];
	if (!key) return;
	triggeredTours.delete(key);
	runOnboardingTour(key);
}
</script>

<svelte:head>
	<title>RasenBürosport - {isRematch ? $t("rematch.title") : $t("new_game.title")}</title>
</svelte:head>

{#snippet stepItem(n, label)}
	{@const stepState = visibleStep === n ? "current" : visibleStep > n ? "done" : "todo"}
	<li class="step" data-state={stepState} aria-current={stepState === "current" ? "step" : undefined}>
		<span class="step-num">
			{#if stepState === "done"}
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" width="14" height="14" aria-hidden="true">
					<polyline points="20 6 9 17 4 12" />
				</svg>
			{:else}
				{n}
			{/if}
		</span>
		<span class="step-name">{label}</span>
	</li>
{/snippet}

<div class="wizard step-{step}">
	{#if step === 1 || step === 2 || step === 3}
		<!-- The wizard runs without the app header ("immersive"), so this
		     bar takes the status-bar inset and shows the step plus the
		     button that replays the step's onboarding tour. -->
		<header class="step-bar bleed">
			<span class="step-label">
				{step === 1
					? $t("new_game.banner.step_1")
					: step === 2
						? $t("new_game.banner.step_2")
						: $t("new_game.banner.step_3")}
			</span>
			<button
				type="button"
				class="help"
				onclick={replayTourForCurrentStep}
				aria-label={$t("new_game.replay_tour")}
				title={$t("new_game.replay_tour")}
			>
				<svg
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					width="20"
					height="20"
					aria-hidden="true"
				>
					<circle cx="12" cy="12" r="10" />
					<path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.7-2.5 2-2.5 4" />
					<line x1="12" y1="17" x2="12" y2="17.01" />
				</svg>
			</button>
			<img src="/logo.png" alt="" class="crest" width="56" height="56" />
		</header>
	{/if}

	{#if step === 1 || step === 2}
		<!-- Hero: red band in A, white text on the pitch in B. The stepper
		     stops at "Anpfiff"; the live step keeps the bar only. -->
		<section class="wizard-hero hero bleed">
			<h1 class="page-title hero-title">
				{step === 1
					? $t("new_game.lobby.page_title")
					: $t("new_game.poster.page_title")}
			</h1>
			<p class="hero-subtitle">
				{step === 1
					? $t("new_game.lobby.page_subtitle")
					: $t("new_game.poster.page_subtitle")}
			</p>
			<ol class="stepper">
				{@render stepItem(1, $t("new_game.lobby.step_label"))}
				<li class="step-line" class:done={visibleStep > 1} aria-hidden="true"></li>
				{@render stepItem(2, $t("new_game.poster.step_label"))}
			</ol>
		</section>
	{/if}

	<div class="wizard-body">
		{#if loading}
			<div class="flex justify-center py-10">
				<span class="spinner" role="status" aria-label={$t("common.loading")}></span>
			</div>
		{:else if step === 1}
			<PlayerLobbyStep
				{allPlayers}
				bind:homePlayers
				bind:awayPlayers
				onNext={() => goToStep(2)}
				onCancel={cancel}
			/>
		{:else if step === 2}
			<MatchPosterStep
				{homePlayers}
				{awayPlayers}
				{allPlayers}
				bind:homeTeam
				bind:awayTeam
				onAnpfiff={() => goToStep(3)}
				onBack={goBack}
			/>
		{:else if step === 3}
			<LiveMatchStep
				{homePlayers}
				{awayPlayers}
				{allPlayers}
				{homeTeam}
				{awayTeam}
				ending={saving}
				onEndMatch={saveGame}
				onStartPenaltyShootout={handleStartPenaltyShootout}
				onBack={requestCancel}
			/>
		{:else if step === 4 && preShootout}
			<PenaltyStep
				{homeTeam}
				{awayTeam}
				{homePlayers}
				{awayPlayers}
				{allPlayers}
				scoreHome={preShootout.scoreHome}
				scoreAway={preShootout.scoreAway}
				ending={saving}
				onComplete={handlePenaltyComplete}
				onAbort={handlePenaltyAbort}
			/>
		{/if}
	</div>

	{#if recordingStatus === "starting"}
		<!-- Blocking connect overlay: stops players from logging goals before we
		     know the capture box is actually recording. Clears itself once the
		     agent confirms 'recording'; on failure/timeout the error dialog takes
		     over. The skip button avoids having to wait out the offline timeout. -->
		<div class="scrim connect-overlay" transition:fade role="status" aria-live="polite">
			<div class="card connect-card">
				<span class="spinner" aria-hidden="true"></span>
				<div>
					<p class="connect-title">{$t("new_game.recording_connecting")}</p>
					<p class="connect-hint">{$t("new_game.recording_connecting_hint")}</p>
				</div>
				<button type="button" onclick={playWithoutRecording} class="btn btn-ghost btn-sm connect-skip">
					{$t("new_game.recording_skip")}
				</button>
			</div>
		</div>
	{/if}

	<ConfirmDialog
		open={showCancelConfirm}
		title={$t("new_game.cancel_match_title")}
		message={$t("new_game.cancel_match_message")}
		actions={[
			{ label: $t("new_game.cancel_match_keep"), variant: "primary", onClick: () => (showCancelConfirm = false) },
			{ label: $t("new_game.cancel_match_discard"), variant: "ghost", onClick: discardRecordingAndLeave },
		]}
		onDismiss={() => (showCancelConfirm = false)}
	/>

	<ConfirmDialog
		open={showRecordingError}
		title={$t("new_game.recording_error_title")}
		message={$t("new_game.recording_error_message")}
		actions={[
			{ label: $t("new_game.recording_error_retry"), variant: "primary", onClick: discardRecordingAndLeave },
			{ label: $t("new_game.recording_error_continue"), variant: "ghost", onClick: playWithoutRecording },
		]}
	/>
</div>

<style>
/* Width of the wizard column on desktop, per step: the lobby and poster
 * put home and away side by side, the live step puts the pitch next to
 * its controls, the shootout stays a single column. */
.wizard {
	--wizard-width: 56rem;
	display: flex;
	flex-direction: column;
	padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 16px);
}

.wizard.step-3 {
	--wizard-width: 76rem;
}

.wizard.step-4 {
	--wizard-width: 42rem;
}

/* ── Step bar ───────────────────────────────────────────────────────── */
/* A: a white bar like the app header, flush with the top edge (the
 * negative margin cancels the main area's top padding). */
.step-bar {
	position: relative;
	display: flex;
	align-items: center;
	gap: 4px;
	min-height: 64px;
	margin-top: -0.5rem;
	padding-top: env(safe-area-inset-top, 0px);
	background: var(--header-bg);
	color: var(--color-ink);
}

.step-label {
	min-width: 0;
	overflow: hidden;
	font-family: var(--font-cond);
	font-weight: 700;
	font-size: 15px;
	letter-spacing: 0.02em;
	text-overflow: ellipsis;
	text-transform: uppercase;
	white-space: nowrap;
	color: var(--color-brand);
}

.help {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 40px;
	height: 40px;
	flex-shrink: 0;
	border: 0;
	border-radius: 999px;
	background: transparent;
	color: var(--color-ink);
	cursor: pointer;
}

.help:hover {
	background: var(--color-sunken);
}

.crest {
	width: 56px;
	height: 56px;
	margin: -4px -6px -4px auto;
	flex-shrink: 0;
	object-fit: contain;
}

/* ── Hero ───────────────────────────────────────────────────────────── */
.wizard-hero {
	display: flex;
	flex-direction: column;
	gap: 8px;
	/* Under the step bar, which already cancels the top padding. */
	margin-top: 0;
	padding-top: 22px;
	padding-bottom: 24px;
	text-shadow: var(--on-page-shadow);
}

.hero-title {
	margin: 0;
	font-size: 36px;
	text-wrap: balance;
}

.hero-subtitle {
	margin: 0;
	font-size: 15px;
	line-height: 1.35;
}

/* Two-step indicator; the current step carries aria-current. A: white
 * squares on the red band, filled for the current step. */
.stepper {
	display: flex;
	align-items: center;
	gap: 10px;
	margin: 12px 0 0;
	padding: 0;
	list-style: none;
}

.step {
	display: flex;
	align-items: center;
	gap: 8px;
}

.step-num {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 32px;
	height: 32px;
	flex-shrink: 0;
	border: 1px solid currentColor;
	border-radius: var(--radius-badge);
	font-family: var(--font-cond);
	font-weight: 700;
	font-size: 16px;
}

.step[data-state="current"] .step-num {
	border-color: var(--color-surface);
	background: var(--color-surface);
	color: var(--color-brand);
}

.step-name {
	font-family: var(--font-cond);
	font-weight: 700;
	font-size: 13px;
	letter-spacing: 0.02em;
	text-transform: uppercase;
}

.step-line {
	flex: 1;
	height: 1px;
	background: currentColor;
}

.step-line.done {
	height: 3px;
}

/* ── Body ───────────────────────────────────────────────────────────── */
.wizard-body {
	padding-top: 16px;
}

/* A: the live scoreboard's red band sits flush under the step bar; the
 * shootout has no step bar, its scoreboard starts the page. */
.wizard.step-3 .wizard-body,
.wizard.step-4 .wizard-body {
	padding-top: 0;
}

/* ── Recording connect overlay ──────────────────────────────────────── */
.connect-overlay {
	position: fixed;
	inset: 0;
	z-index: 90;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 24px;
}

.connect-card {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 16px;
	width: min(100%, 22rem);
	padding: 28px 24px 18px;
	text-align: center;
}

.connect-title {
	margin: 0;
	font-weight: 700;
	font-size: 16px;
}

.connect-hint {
	margin: 6px 0 0;
	color: var(--color-muted);
	font-size: 14px;
}

.connect-skip {
	color: var(--color-muted);
	font-weight: 500;
	text-decoration: underline;
	text-underline-offset: 4px;
}

/* ── Design B: everything stands on the pitch ───────────────────────── */
:global([data-variant="b"]) .step-bar {
	justify-content: center;
	min-height: 60px;
}

:global([data-variant="b"]) .step-label {
	padding: 6px 14px;
	border-radius: 999px;
	background: var(--color-surface);
	color: var(--color-ink);
	font-size: 14px;
	letter-spacing: 0;
	text-transform: none;
	box-shadow: var(--shadow-control);
}

:global([data-variant="b"]) .help {
	position: absolute;
	right: 0;
	bottom: 10px;
	width: 38px;
	height: 38px;
	background: var(--color-surface);
	box-shadow: var(--shadow-control);
}

:global([data-variant="b"]) .help:hover {
	background: var(--color-sunken);
}

:global([data-variant="b"]) .crest {
	display: none;
}

:global([data-variant="b"]) .wizard-hero {
	align-items: center;
	gap: 4px;
	padding-top: 4px;
	padding-bottom: 0;
	text-align: center;
}

:global([data-variant="b"]) .hero-title {
	font-size: 34px;
}

:global([data-variant="b"]) .hero-subtitle {
	font-weight: 700;
	font-size: 16px;
}

/* B: the stepper is a white pill: red current step, green done step. */
:global([data-variant="b"]) .stepper {
	align-self: stretch;
	margin-top: 12px;
	padding: 8px 14px;
	border-radius: 999px;
	background: var(--color-surface);
	color: var(--color-ink);
	text-shadow: none;
	box-shadow: var(--shadow-control);
}

:global([data-variant="b"]) .step-num {
	width: 30px;
	height: 30px;
	border: 0;
	background: var(--color-line);
	color: var(--color-muted);
	font-weight: 800;
	font-size: 15px;
}

:global([data-variant="b"]) .step[data-state="current"] .step-num {
	background: var(--color-brand);
	color: var(--color-on-brand);
}

:global([data-variant="b"]) .step[data-state="done"] .step-num {
	background: var(--color-win);
	color: var(--color-on-win);
}

:global([data-variant="b"]) .step-name {
	font-family: var(--font-sans);
	letter-spacing: 0;
	text-transform: none;
	color: var(--color-muted);
}

:global([data-variant="b"]) .step[data-state="current"] .step-name {
	color: var(--color-brand);
}

:global([data-variant="b"]) .step[data-state="done"] .step-name {
	color: var(--color-win);
}

:global([data-variant="b"]) .step-line {
	height: 3px;
	border-radius: 999px;
	background: var(--color-line);
}

:global([data-variant="b"]) .step-line.done {
	background: var(--color-win);
}

:global([data-variant="b"]) .wizard-body {
	padding-top: 14px;
}

:global([data-variant="b"]) .wizard.step-3 .wizard-body {
	padding-top: 4px;
}

:global([data-variant="b"]) .wizard.step-4 .wizard-body {
	padding-top: 8px;
}

/* ── Desktop: a centred column; the bar loses its background ───────── */
@media (min-width: 1024px) {
	.step-bar,
	.wizard-hero,
	.wizard-body {
		width: 100%;
		max-width: var(--wizard-width);
		margin-inline: auto;
	}

	.step-bar {
		min-height: 44px;
		margin-top: 0;
		padding: 0;
		background: transparent;
	}

	.crest {
		display: none;
	}

	.wizard-hero {
		margin-top: 12px;
		padding: 28px 32px;
		border-radius: var(--radius-card);
	}

	.wizard-body,
	.wizard.step-3 .wizard-body {
		padding-top: 24px;
	}

	.wizard.step-4 .wizard-body,
	:global([data-variant="b"]) .wizard.step-4 .wizard-body {
		padding-top: 0;
	}

	:global([data-variant="b"]) .step-bar {
		min-height: 48px;
	}

	:global([data-variant="b"]) .help {
		bottom: 5px;
	}

	:global([data-variant="b"]) .wizard-hero {
		margin-top: 4px;
		padding: 8px 0 0;
	}

	:global([data-variant="b"]) .stepper {
		align-self: center;
		width: min(100%, 30rem);
	}

	:global([data-variant="b"]) .wizard-body,
	:global([data-variant="b"]) .wizard.step-3 .wizard-body {
		padding-top: 20px;
	}
}
</style>
