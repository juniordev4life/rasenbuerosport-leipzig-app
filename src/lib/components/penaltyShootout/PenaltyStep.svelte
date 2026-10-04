<script>
import { getTranslate } from "@tolgee/svelte";
import MatchHeader from "$lib/components/liveMatch/MatchHeader.svelte";
import ConfirmDialog from "$lib/components/ui/ConfirmDialog.svelte";
import PlayerAvatar from "$lib/components/ui/PlayerAvatar.svelte";
import { getTeamByName } from "$lib/services/teams.services.js";
import {
	computeRunningScore,
	getCurrentRound,
	getNextShootingTeam,
	isPenaltyShootoutDecided,
} from "$lib/utils/penaltyShootout.utils.js";
import SequenceBoard from "./SequenceBoard.svelte";

/**
 * Penalty-shootout wizard step. Mounts after the live match goes to
 * extra time and the user taps "11m" in the action row.
 *
 * State is held locally for Etappe 2 — the persistence call lands in
 * Etappe 3 (POST /v1/games/:id/penalty-shootout/{start,shot,end}).
 * For now the component emits an `onComplete` callback with the full
 * shootout payload so the parent wizard can fold it into its existing
 * `saveGame` flow.
 *
 * Inner state machine for the active shot:
 *   pickShooter → pickResult → (if missed) pickKeeper → next shot
 *                            → (if goal)                next shot
 *
 * Layout: the live scoreboard (MatchHeader) with the shootout score,
 * the sequence board, then one card for the active shot (or the end
 * card once decided). Abort asks first via ConfirmDialog.
 *
 * @type {{
 *   homeTeam: string,
 *   awayTeam: string,
 *   homePlayers: string[],
 *   awayPlayers: string[],
 *   allPlayers: Array<{ id: string, username: string, avatar_url?: string | null }>,
 *   scoreHome: number,
 *   scoreAway: number,
 *   onComplete: (payload: { shots: object[], finalPenaltyScore: { home: number, away: number }, winnerSide: 'home' | 'away' }) => void,
 *   onAbort: () => void,
 *   ending?: boolean,
 * }}
 */
let {
	homeTeam,
	awayTeam,
	homePlayers: homePlayerIds,
	awayPlayers: awayPlayerIds,
	allPlayers,
	scoreHome,
	scoreAway,
	onComplete,
	onAbort,
	ending = false,
} = $props();

const GUEST_ID = "__guest__";

/**
 * Resolves a player ID (real or guest) to the `{ id, username,
 * avatar_url }` shape the rest of the component renders against.
 *
 * @param {string} id
 * @returns {{ id: string, username: string, avatar_url: string | null }}
 */
function resolvePlayer(id) {
	if (id.startsWith(GUEST_ID)) {
		return { id, username: $t("new_game.guest"), avatar_url: null };
	}
	const found = allPlayers.find((p) => p.id === id);
	return {
		id,
		username: found?.username ?? "?",
		avatar_url: found?.avatar_url ?? null,
	};
}

const homePlayers = $derived(homePlayerIds.map(resolvePlayer));
const awayPlayers = $derived(awayPlayerIds.map(resolvePlayer));

const { t } = getTranslate();

/** Shots taken so far, in order. */
let shots = $state([]);

/** Inner state machine for the active shot. */
let activePhase = $state("pickShooter");
let pendingShooterId = $state(null);
let confirmAbort = $state(false);

const runningScore = $derived(computeRunningScore(shots));
const currentRound = $derived(getCurrentRound(shots));
const nextTeam = $derived(getNextShootingTeam(shots));
const decision = $derived(isPenaltyShootoutDecided(shots));
const decided = $derived(decision.decided);
const canCorrectLast = $derived(shots.length > 0 && !ending);

const nextTeamLabel = $derived(nextTeam === "home" ? homeTeam : awayTeam);
const nextTeamPlayers = $derived(
	nextTeam === "home" ? homePlayers : awayPlayers,
);
const keeperTeamPlayers = $derived(
	nextTeam === "home" ? awayPlayers : homePlayers,
);

const pendingShooter = $derived.by(() => {
	if (!pendingShooterId) return null;
	const pool = nextTeam === "home" ? homePlayers : awayPlayers;
	return pool.find((p) => p.id === pendingShooterId) ?? null;
});

/** @type {import('$lib/services/teams.services.js').TeamData|null} */
let homeTeamData = $state(null);
/** @type {import('$lib/services/teams.services.js').TeamData|null} */
let awayTeamData = $state(null);

// Crests for the scoreboard; the live step already filled the cache.
// They are decoration only, so a failed lookup keeps the plain names.
$effect(() => {
	if (homeTeam) {
		getTeamByName(homeTeam)
			.then((td) => {
				homeTeamData = td || null;
			})
			.catch(() => {});
	}
});
$effect(() => {
	if (awayTeam) {
		getTeamByName(awayTeam)
			.then((td) => {
				awayTeamData = td || null;
			})
			.catch(() => {});
	}
});

const homeTeamView = $derived(
	homeTeamData ?? { name: homeTeam, logo_url: null },
);
const awayTeamView = $derived(
	awayTeamData ?? { name: awayTeam, logo_url: null },
);

function pickShooter(id) {
	pendingShooterId = id;
	activePhase = "pickResult";
}

function resetActiveShot() {
	pendingShooterId = null;
	activePhase = "pickShooter";
}

/**
 * Commit a shot to the sequence and advance the state machine.
 * Splits goal vs. missed because the latter needs the keeper picker.
 */
function commitShot({ result, keeperId = null }) {
	if (!pendingShooterId) return;
	const shot = {
		order: shots.length + 1,
		round: currentRound,
		team: nextTeam,
		shooterId: pendingShooterId,
		result,
		keeperId,
	};
	shots = [...shots, shot];
	resetActiveShot();
}

function chooseGoal() {
	commitShot({ result: "goal" });
}

function chooseMissed() {
	activePhase = "pickKeeper";
}

function chooseKeeper(id) {
	commitShot({ result: "missed", keeperId: id });
}

function chooseNoKeeper() {
	commitShot({ result: "missed", keeperId: null });
}

function correctLastShot() {
	if (!canCorrectLast) return;
	shots = shots.slice(0, -1);
	resetActiveShot();
}

function handleFinish() {
	if (!decision.decided) return;
	onComplete?.({
		shots,
		finalPenaltyScore: runningScore,
		winnerSide: decision.winnerSide,
	});
}

function handleAbort() {
	if (shots.length === 0) {
		onAbort?.();
		return;
	}
	confirmAbort = true;
}

function confirmAbortYes() {
	confirmAbort = false;
	onAbort?.();
}

function confirmAbortNo() {
	confirmAbort = false;
}
</script>

{#snippet playerPicker(players, onPick, keeper)}
	<div class="picker-grid">
		{#each players as player (player.id)}
			<button
				type="button"
				class="picker-button"
				class:keeper
				onclick={() => onPick(player.id)}
			>
				<PlayerAvatar {player} size={36} />
				<span class="picker-name">{player.username}</span>
			</button>
		{/each}
	</div>
{/snippet}

{#snippet shootoutBadge()}
	{#if decided}
		<span class="chip shootout-chip decided">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" width="11" height="11" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
			{$t("penalty_shootout.hero.decided")}
		</span>
	{:else}
		<span class="chip shootout-chip">
			<svg viewBox="0 0 24 24" fill="currentColor" width="11" height="11" aria-hidden="true"><path d="M12 2.8l2.8 5.7 6.3.9-4.55 4.43 1.07 6.27L12 17.1l-5.62 2.96 1.07-6.27L2.9 9.4l6.3-.9z" /></svg>
			{$t("penalty_shootout.hero.title")}
		</span>
	{/if}
{/snippet}

<div class="penalty-step">
	<div class="penalty-head">
		<MatchHeader
			homeTeam={homeTeamView}
			awayTeam={awayTeamView}
			scoreHome={runningScore.home}
			scoreAway={runningScore.away}
			badge={shootoutBadge}
			subtitle={$t("penalty_shootout.hero.subtitle_after_extra", {
				scoreHome,
				scoreAway,
			})}
		/>
	</div>

	<SequenceBoard
		{shots}
		homeLabel={homeTeam.slice(0, 3).toUpperCase()}
		awayLabel={awayTeam.slice(0, 3).toUpperCase()}
		{homePlayers}
		{awayPlayers}
		pendingShooter={pendingShooter}
		{decided}
	/>

	{#if decided}
		<div class="card end-card">
			<p class="end-title">{$t("penalty_shootout.end.title")}</p>
			<p class="end-subtitle">
				{$t("penalty_shootout.end.subtitle", {
					winner: decision.winnerSide === "home" ? homeTeam : awayTeam,
					penaltyHome: runningScore.home,
					penaltyAway: runningScore.away,
				})}
			</p>
			<button
				type="button"
				class="btn btn-lg btn-confirm w-full finish"
				disabled={ending}
				onclick={handleFinish}
			>
				{#if ending}
					<span class="spinner spinner-sm finish-spinner" aria-hidden="true"></span>
				{:else}
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
				{/if}
				<span>{$t("penalty_shootout.end.cta")}</span>
			</button>
		</div>
	{:else}
		<div class="card active-card">
			{#if activePhase === "pickShooter"}
				<div class="active-header">
					<span class="active-title">
						{$t("penalty_shootout.active.shot_header", {
							shotNumber: shots.length + 1,
							team: nextTeamLabel,
						})}
					</span>
					<span class="active-prompt">
						{$t("penalty_shootout.active.who_shoots")}
					</span>
				</div>
				{@render playerPicker(nextTeamPlayers, pickShooter, false)}
			{:else if activePhase === "pickResult"}
				<div class="active-header">
					<span class="active-title">
						{$t("penalty_shootout.active.shot_header_with_name", {
							shotNumber: shots.length + 1,
							shooter: pendingShooter?.username ?? "—",
						})}
					</span>
					<span class="active-prompt">
						{$t("penalty_shootout.active.result_prompt")}
					</span>
				</div>
				<div class="result-row">
					<button type="button" class="result-button goal" onclick={chooseGoal}>
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
						{$t("penalty_shootout.active.goal")}
					</button>
					<button type="button" class="result-button miss" onclick={chooseMissed}>
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
						{$t("penalty_shootout.active.missed")}
					</button>
				</div>
				<button type="button" class="text-action" onclick={resetActiveShot}>
					<span aria-hidden="true">←</span>
					{$t("penalty_shootout.active.change_shooter")}
				</button>
			{:else if activePhase === "pickKeeper"}
				<div class="active-header">
					<span class="active-title">
						{$t("penalty_shootout.keeper.title")}
					</span>
					<span class="active-prompt">
						{$t("penalty_shootout.keeper.subtitle", {
							shooter: pendingShooter?.username ?? "—",
						})}
					</span>
				</div>
				{@render playerPicker(keeperTeamPlayers, chooseKeeper, true)}
				<button type="button" class="no-keeper-button" onclick={chooseNoKeeper}>
					{$t("penalty_shootout.keeper.no_keeper")}
				</button>
				<button type="button" class="text-action" onclick={() => (activePhase = "pickResult")}>
					<span aria-hidden="true">←</span>
					{$t("penalty_shootout.keeper.back_to_result")}
				</button>
			{/if}
		</div>
	{/if}

	<div class="footer-actions">
		{#if canCorrectLast}
			<button type="button" class="page-action" onclick={correctLastShot}>
				<span aria-hidden="true">←</span>
				{$t("penalty_shootout.footer.correct_last")}
			</button>
		{/if}
		<button type="button" class="page-action" onclick={handleAbort}>
			<span aria-hidden="true">←</span>
			{$t("penalty_shootout.footer.abort")}
		</button>
	</div>
</div>

<ConfirmDialog
	open={confirmAbort}
	title={$t("penalty_shootout.abort.title")}
	message={$t("penalty_shootout.abort.body", { scoreHome, scoreAway })}
	actions={[
		{ label: $t("penalty_shootout.abort.cancel"), variant: "primary", onClick: confirmAbortNo },
		{ label: $t("penalty_shootout.abort.confirm"), variant: "ghost", onClick: confirmAbortYes },
	]}
	onDismiss={confirmAbortNo}
/>

<style>
.penalty-step {
	display: flex;
	flex-direction: column;
	gap: 14px;
}

/* The scoreboard is the first block of the page here (the wizard shows
 * no step bar in the shootout): in A its red band runs up to the top
 * edge on phones, in B the card keeps clear of the notch. */
@media (max-width: 1023px) {
	:global(:root:not([data-variant="b"])) .penalty-head {
		margin-top: -0.5rem;
	}

	:global(:root:not([data-variant="b"])) .penalty-head :global(.live-hero) {
		padding-top: calc(env(safe-area-inset-top, 0px) + 18px);
	}

	:global([data-variant="b"]) .penalty-head {
		padding-top: env(safe-area-inset-top, 0px);
	}
}

/* Badge in the scoreboard: gold while shooting, white once decided. */
.shootout-chip {
	gap: 6px;
	padding: 3px 10px;
	background: var(--color-gold);
	color: var(--color-on-gold);
	font-family: var(--font-cond);
	font-size: 13px;
	letter-spacing: 0.03em;
}

.shootout-chip.decided {
	background: var(--color-surface);
	color: var(--color-win);
}

/* ── Active shot ────────────────────────────────────────────────────── */
.active-card,
.end-card {
	padding: 16px;
}

.active-header {
	display: flex;
	flex-direction: column;
	gap: 2px;
	margin-bottom: 12px;
}

.active-title {
	font-family: var(--font-cond);
	font-weight: 700;
	font-size: 18px;
	line-height: 1.15;
	letter-spacing: var(--section-tracking);
	text-transform: var(--section-case);
}

.active-prompt {
	color: var(--color-muted);
	font-size: 14px;
}

.picker-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 8px;
}

.picker-button {
	display: flex;
	align-items: center;
	gap: 10px;
	min-height: 56px;
	padding: 8px 12px 8px 10px;
	border: 1px solid transparent;
	border-radius: var(--radius-tile);
	background: var(--color-sunken);
	color: var(--color-ink);
	font-size: 14px;
	font-weight: 700;
	text-align: left;
	cursor: pointer;
	transition:
		border-color 120ms,
		background-color 120ms,
		transform 120ms;
}

.picker-button:hover {
	border-color: var(--color-gold);
	background: var(--color-surface);
}

.picker-button.keeper:hover {
	border-color: var(--color-aqua);
}

.picker-button:active {
	transform: scale(0.98);
}

.picker-name {
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.result-row {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 10px;
}

/* Goal / missed: colour plus a ✓ / ✕ icon and the word. */
.result-button {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	min-height: 56px;
	padding: 0 8px;
	border: 0;
	border-radius: var(--radius-control);
	font-family: var(--font-cond);
	font-weight: 700;
	font-size: 17px;
	letter-spacing: 0.03em;
	text-transform: uppercase;
	cursor: pointer;
	transition: transform 120ms;
}

.result-button:active {
	transform: scale(0.98);
}

.result-button.goal {
	background: var(--color-win);
	color: var(--color-on-win);
}

.result-button.miss {
	background: var(--color-loss);
	color: var(--color-on-loss);
}

:global([data-variant="b"]) .result-button {
	box-shadow: var(--shadow-control);
}

.no-keeper-button {
	width: 100%;
	min-height: 44px;
	margin-top: 10px;
	padding: 0 12px;
	border: 1.5px dashed var(--color-line);
	border-radius: var(--radius-control);
	background: transparent;
	color: var(--color-muted);
	font-size: 14px;
	font-weight: 700;
	cursor: pointer;
}

.no-keeper-button:hover {
	border-color: var(--color-muted);
	color: var(--color-ink);
}

.text-action {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	min-height: 40px;
	margin-top: 8px;
	padding: 0 4px;
	border: 0;
	background: none;
	color: var(--color-muted);
	font-size: 14px;
	font-weight: 700;
	cursor: pointer;
}

.text-action:hover {
	color: var(--color-ink);
	text-decoration: underline;
}

/* ── End card ───────────────────────────────────────────────────────── */
.end-card {
	display: flex;
	flex-direction: column;
	gap: 10px;
	text-align: center;
}

.end-title {
	margin: 0;
	font-family: var(--font-section);
	font-weight: var(--section-weight);
	font-size: var(--section-size);
	letter-spacing: var(--section-tracking);
	text-transform: var(--section-case);
	color: var(--section-color);
}

.end-subtitle {
	margin: 0 0 4px;
	font-size: 15px;
	line-height: 1.4;
}

/* "Spiel beenden" uses .btn-confirm (red in A, green in B). */
.finish:disabled {
	cursor: wait;
}

.finish-spinner {
	--spinner-color: currentColor;
}

/* ── Footer actions on the page background ──────────────────────────── */
.footer-actions {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 2px;
}

.page-action {
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

.page-action:hover {
	text-decoration: underline;
}

:global([data-variant="b"]) .page-action {
	font-weight: 700;
}
</style>
