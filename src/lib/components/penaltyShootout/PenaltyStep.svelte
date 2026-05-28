<script>
import { getTranslate } from "@tolgee/svelte";
import {
	computePenaltyShotEloDeltas,
	computeRunningScore,
	getCurrentRound,
	getNextShootingTeam,
	isPenaltyShootoutDecided,
	PENALTY_ELO_DELTAS,
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

/** Visual gradient generator — same palette as LiveMatchStep. */
function gradientFor(id) {
	if (!id) return null;
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
		eloDeltas: computePenaltyShotEloDeltas({
			shooterId: pendingShooterId,
			result,
			keeperId,
		}),
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

const eloPreview = $derived.by(() => {
	if (activePhase !== "pickKeeper" || !pendingShooterId) return null;
	const shooterName =
		nextTeamPlayers.find((p) => p.id === pendingShooterId)?.username ?? "—";
	return {
		shooterName,
		shooterDelta: PENALTY_ELO_DELTAS.PENALTY_MISSED,
		keeperDelta: PENALTY_ELO_DELTAS.PENALTY_SAVED,
	};
});
</script>

<div class="penalty-step">
	<div class="hero" class:decided>
		<div class="hero-pill-row">
			<span class="hero-pill">
				{#if decided}
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" width="10" height="10" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
					{$t("penalty_shootout.hero.decided")}
				{:else}
					<span class="hero-pill-star" aria-hidden="true">★</span>
					{$t("penalty_shootout.hero.title")}
				{/if}
			</span>
		</div>
		<div class="hero-score-row">
			<div class="hero-team home">
				<span class="hero-team-name">{homeTeam}</span>
			</div>
			<div class="hero-score">
				<span>{runningScore.home}</span>
				<span class="sep">:</span>
				<span>{runningScore.away}</span>
			</div>
			<div class="hero-team away">
				<span class="hero-team-name">{awayTeam}</span>
			</div>
		</div>
		<p class="hero-subtitle">
			{$t("penalty_shootout.hero.subtitle_after_extra", {
				scoreHome,
				scoreAway,
			})}
		</p>
	</div>

	<SequenceBoard
		{shots}
		homeLabel={homeTeam.slice(0, 3).toUpperCase()}
		awayLabel={awayTeam.slice(0, 3).toUpperCase()}
		{homePlayers}
		{awayPlayers}
		pendingShooter={pendingShooter}
		{decided}
		{gradientFor}
	/>

	{#if decided}
		<div class="end-card">
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
				class="primary-btn success"
				disabled={ending}
				onclick={handleFinish}
			>
				{#if ending}
					<span class="spinner" aria-hidden="true"></span>
				{:else}
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
				{/if}
				<span>{$t("penalty_shootout.end.cta")}</span>
			</button>
		</div>
	{:else}
		<div class="active-card">
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
				<div class="picker-grid">
					{#each nextTeamPlayers as player (player.id)}
						<button
							type="button"
							class="picker-button"
							onclick={() => pickShooter(player.id)}
						>
							<span
								class="picker-avatar"
								style:--cell-gradient={gradientFor(player.id)}
							>
								{#if player.avatar_url}
									<img src={player.avatar_url} alt="" />
								{:else}
									{player.username?.charAt(0).toUpperCase() ?? "?"}
								{/if}
							</span>
							<span class="picker-name">{player.username}</span>
						</button>
					{/each}
				</div>
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
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
						{$t("penalty_shootout.active.goal")}
					</button>
					<button type="button" class="result-button miss" onclick={chooseMissed}>
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
						{$t("penalty_shootout.active.missed")}
					</button>
				</div>
				<button type="button" class="link-back" onclick={resetActiveShot}>
					← {$t("penalty_shootout.active.change_shooter")}
				</button>
			{:else if activePhase === "pickKeeper"}
				<div class="active-header keeper">
					<span class="active-title">
						{$t("penalty_shootout.keeper.title")}
					</span>
					<span class="active-prompt">
						{$t("penalty_shootout.keeper.subtitle", {
							shooter: pendingShooter?.username ?? "—",
						})}
					</span>
				</div>
				<div class="picker-grid">
					{#each keeperTeamPlayers as keeper (keeper.id)}
						<button
							type="button"
							class="picker-button keeper"
							onclick={() => chooseKeeper(keeper.id)}
						>
							<span
								class="picker-avatar"
								style:--cell-gradient={gradientFor(keeper.id)}
							>
								{#if keeper.avatar_url}
									<img src={keeper.avatar_url} alt="" />
								{:else}
									{keeper.username?.charAt(0).toUpperCase() ?? "?"}
								{/if}
							</span>
							<span class="picker-name">{keeper.username}</span>
						</button>
					{/each}
				</div>
				<button
					type="button"
					class="no-keeper-button"
					onclick={chooseNoKeeper}
				>
					{$t("penalty_shootout.keeper.no_keeper")}
				</button>
				{#if eloPreview}
					<p class="elo-preview">
						{$t("penalty_shootout.keeper.elo_preview", {
							shooter: eloPreview.shooterName,
							shooterDelta: eloPreview.shooterDelta,
							keeperDelta: eloPreview.keeperDelta,
						})}
					</p>
				{/if}
				<button type="button" class="link-back" onclick={() => (activePhase = "pickResult")}>
					← {$t("penalty_shootout.keeper.back_to_result")}
				</button>
			{/if}
		</div>
	{/if}

	<div class="footer-actions">
		{#if canCorrectLast}
			<button type="button" class="link-back" onclick={correctLastShot}>
				← {$t("penalty_shootout.footer.correct_last")}
			</button>
		{/if}
		<button type="button" class="link-back danger" onclick={handleAbort}>
			← {$t("penalty_shootout.footer.abort")}
		</button>
	</div>
</div>

{#if confirmAbort}
	<div class="abort-overlay" role="dialog" aria-modal="true">
		<div class="abort-card">
			<h3>{$t("penalty_shootout.abort.title")}</h3>
			<p>{$t("penalty_shootout.abort.body", { scoreHome, scoreAway })}</p>
			<div class="abort-buttons">
				<button type="button" class="abort-secondary" onclick={confirmAbortNo}>
					{$t("penalty_shootout.abort.cancel")}
				</button>
				<button type="button" class="abort-danger" onclick={confirmAbortYes}>
					{$t("penalty_shootout.abort.confirm")}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
.penalty-step {
	display: flex;
	flex-direction: column;
	gap: 10px;
	padding-bottom: env(safe-area-inset-bottom, 12px);
}

/* HERO -------------------------------------------------------------- */
.hero {
	background:
		radial-gradient(ellipse at top, rgba(245, 158, 11, 0.22) 0%, transparent 60%),
		linear-gradient(180deg, #1A1F2A 0%, #131822 100%);
	border: 1px solid rgba(245, 158, 11, 0.32);
	border-radius: 16px;
	padding: 14px 16px 12px;
	position: relative;
	overflow: hidden;
}
.hero::before {
	content: '';
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	height: 2px;
	background: linear-gradient(90deg, transparent, #F59E0B 50%, transparent);
}
.hero.decided {
	background:
		radial-gradient(ellipse at top, rgba(132, 204, 22, 0.22) 0%, transparent 60%),
		linear-gradient(180deg, #1A1F2A 0%, #131822 100%);
	border-color: rgba(132, 204, 22, 0.4);
}
.hero.decided::before {
	background: linear-gradient(90deg, transparent, #84CC16 50%, transparent);
}

.hero-pill-row {
	text-align: center;
	margin-bottom: 8px;
}
.hero-pill {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	font-size: 10px;
	font-weight: 800;
	color: #FBBF24;
	background: rgba(245, 158, 11, 0.16);
	border: 1px solid rgba(245, 158, 11, 0.38);
	padding: 4px 12px;
	border-radius: 999px;
	text-transform: uppercase;
	letter-spacing: 0.12em;
}
.hero.decided .hero-pill {
	color: #84CC16;
	background: rgba(132, 204, 22, 0.16);
	border-color: rgba(132, 204, 22, 0.4);
}
.hero-pill-star { font-size: 11px; }

.hero-score-row {
	display: grid;
	grid-template-columns: 1fr auto 1fr;
	align-items: center;
	gap: 10px;
	margin-bottom: 4px;
}
.hero-team {
	display: flex;
	align-items: center;
	min-width: 0;
}
.hero-team.away { justify-content: flex-end; }
.hero-team-name {
	font-size: 12px;
	font-weight: 700;
	color: #E5E7EB;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
.hero-score {
	font-size: 26px;
	font-weight: 800;
	line-height: 1;
	font-variant-numeric: tabular-nums;
	letter-spacing: -0.02em;
	display: flex;
	align-items: center;
	gap: 8px;
	color: #F0F2F5;
}
.hero-score .sep { color: #4B5563; font-size: 20px; }
.hero-subtitle {
	margin: 4px 0 0;
	font-size: 10px;
	color: #9CA3AF;
	text-align: center;
}

/* ACTIVE CARD ------------------------------------------------------- */
.active-card {
	background: #131822;
	border: 1px solid #1F2937;
	border-radius: 14px;
	padding: 14px;
}
.active-header {
	display: flex;
	flex-direction: column;
	gap: 2px;
	margin-bottom: 12px;
}
.active-title {
	font-size: 12px;
	font-weight: 800;
	color: #F0F2F5;
	letter-spacing: 0.02em;
}
.active-prompt {
	font-size: 11px;
	color: #9CA3AF;
}
.active-header.keeper .active-title {
	color: #A5B4FC;
}

.picker-grid {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 8px;
}
.picker-button {
	display: flex;
	align-items: center;
	gap: 10px;
	background: rgba(0, 0, 0, 0.3);
	border: 1px solid rgba(255, 255, 255, 0.08);
	border-radius: 12px;
	padding: 10px 12px;
	color: #F0F2F5;
	font-size: 12px;
	font-weight: 700;
	cursor: pointer;
	transition: transform 0.12s, border-color 0.15s, background-color 0.15s;
}
.picker-button:hover {
	background: rgba(255, 255, 255, 0.04);
	border-color: rgba(245, 158, 11, 0.4);
}
.picker-button:active { transform: scale(0.98); }
.picker-button.keeper:hover {
	border-color: rgba(129, 140, 248, 0.5);
}
.picker-avatar {
	width: 32px;
	height: 32px;
	border-radius: 50%;
	background: var(--cell-gradient);
	display: flex;
	align-items: center;
	justify-content: center;
	color: white;
	font-size: 12px;
	font-weight: 800;
	overflow: hidden;
	flex-shrink: 0;
}
.picker-avatar img { width: 100%; height: 100%; object-fit: cover; }
.picker-name {
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.result-row {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 10px;
}
.result-button {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 6px;
	padding: 14px 8px;
	border-radius: 12px;
	border: 0;
	font-size: 13px;
	font-weight: 800;
	cursor: pointer;
	color: white;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	transition: transform 0.12s;
}
.result-button.goal {
	background: linear-gradient(135deg, #84CC16, #65A30D);
	box-shadow: 0 4px 14px rgba(132, 204, 22, 0.35);
}
.result-button.miss {
	background: linear-gradient(135deg, #E24B4A, #C73E3D);
	box-shadow: 0 4px 14px rgba(226, 75, 74, 0.35);
}
.result-button:active { transform: scale(0.98); }

.no-keeper-button {
	width: 100%;
	margin-top: 10px;
	background: rgba(0, 0, 0, 0.35);
	border: 1px dashed rgba(255, 255, 255, 0.12);
	color: #9CA3AF;
	font-size: 11px;
	font-weight: 700;
	padding: 10px;
	border-radius: 10px;
	cursor: pointer;
	transition: color 0.15s, border-color 0.15s;
}
.no-keeper-button:hover {
	color: #E5E7EB;
	border-color: rgba(255, 255, 255, 0.25);
}

.elo-preview {
	font-size: 10px;
	color: #9CA3AF;
	margin: 10px 0 0;
	text-align: center;
}

/* END CARD ---------------------------------------------------------- */
.end-card {
	background:
		radial-gradient(ellipse at top, rgba(132, 204, 22, 0.18) 0%, transparent 70%),
		#131822;
	border: 1px solid rgba(132, 204, 22, 0.35);
	border-radius: 14px;
	padding: 14px;
	display: flex;
	flex-direction: column;
	gap: 10px;
	text-align: center;
}
.end-title {
	font-size: 11px;
	font-weight: 800;
	color: #84CC16;
	letter-spacing: 0.12em;
	text-transform: uppercase;
	margin: 0;
}
.end-subtitle {
	font-size: 12px;
	color: #D1D5DB;
	margin: 0;
	line-height: 1.4;
}

.primary-btn {
	width: 100%;
	border: 0;
	border-radius: 12px;
	padding: 14px;
	font-size: 14px;
	font-weight: 800;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	color: white;
	transition: transform 0.15s, opacity 0.15s;
}
.primary-btn.success {
	background: linear-gradient(135deg, #84CC16, #65A30D);
	box-shadow: 0 6px 18px rgba(132, 204, 22, 0.4);
}
.primary-btn:disabled { opacity: 0.6; cursor: wait; }
.primary-btn:not(:disabled):hover { transform: translateY(-1px); }
.spinner {
	width: 14px;
	height: 14px;
	border: 2px solid currentColor;
	border-right-color: transparent;
	border-radius: 50%;
	animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* FOOTER ACTIONS ---------------------------------------------------- */
.footer-actions {
	display: flex;
	flex-direction: column;
	gap: 4px;
	align-items: center;
	margin-top: 6px;
}
.link-back {
	background: none;
	border: 0;
	color: #6B7280;
	font-size: 11px;
	font-weight: 600;
	padding: 8px 12px;
	cursor: pointer;
	transition: color 0.15s;
}
.link-back:hover { color: #E5E7EB; }
.link-back.danger:hover { color: #E24B4A; }

/* ABORT CONFIRMATION ------------------------------------------------ */
.abort-overlay {
	position: fixed;
	inset: 0;
	background: rgba(0, 0, 0, 0.65);
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 16px;
	z-index: 80;
}
.abort-card {
	background: #131822;
	border: 1px solid #1F2937;
	border-radius: 16px;
	padding: 18px;
	max-width: 360px;
	width: 100%;
}
.abort-card h3 {
	margin: 0 0 6px;
	font-size: 14px;
	font-weight: 800;
	color: #F0F2F5;
}
.abort-card p {
	margin: 0 0 12px;
	font-size: 12px;
	color: #9CA3AF;
	line-height: 1.5;
}
.abort-buttons {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 8px;
}
.abort-secondary,
.abort-danger {
	border: 0;
	border-radius: 10px;
	padding: 10px;
	font-size: 12px;
	font-weight: 700;
	cursor: pointer;
	transition: transform 0.12s, opacity 0.15s;
}
.abort-secondary {
	background: rgba(255, 255, 255, 0.06);
	color: #E5E7EB;
}
.abort-danger {
	background: linear-gradient(135deg, #E24B4A, #C73E3D);
	color: white;
}
.abort-secondary:active,
.abort-danger:active { transform: scale(0.98); }
</style>
