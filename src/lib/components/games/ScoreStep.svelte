<script>
import { getTranslate } from "@tolgee/svelte";
import { tick } from "svelte";
import Button from "$lib/components/ui/Button.svelte";
import TeamLogo from "$lib/components/ui/TeamLogo.svelte";
import { getTeamByName } from "$lib/services/teams.services.js";
import {
	formatMinute,
	validateMinuteAgainstTimeline,
} from "$lib/utils/minute.utils.js";
import MinutePicker from "./MinutePicker.svelte";
import ScoreCounter from "./ScoreCounter.svelte";

/**
 * ScoreStep - Step 3 of new game wizard
 * Shows team names, score entry, phase toggles, timeline tracking,
 * and scorer picker popup for 2v2 games
 */
let {
	homeTeam = "",
	awayTeam = "",
	homePlayers = [],
	awayPlayers = [],
	allPlayers = [],
	scoreHome = $bindable(0),
	scoreAway = $bindable(0),
	scoreTimeline = $bindable([]),
	resultType = $bindable("regular"),
	statsOverview = $bindable(null),
	statsPasses = $bindable(null),
	statsDefense = $bindable(null),
	saving = false,
	onSave,
	onBack,
} = $props();

const { t } = getTranslate();

/** @type {import('$lib/services/teams.services.js').TeamData|null} */
let homeTeamData = $state(null);
/** @type {import('$lib/services/teams.services.js').TeamData|null} */
let awayTeamData = $state(null);

$effect(() => {
	if (homeTeam)
		getTeamByName(homeTeam).then((t) => {
			homeTeamData = t || null;
		});
});
$effect(() => {
	if (awayTeam)
		getTeamByName(awayTeam).then((t) => {
			awayTeamData = t || null;
		});
});

/** Track previous total score to detect increment vs decrement */
let prevTotal = $state(0);

/** Phase toggles */
let extraTimeActive = $state(false);
let penaltyActive = $state(false);

/** Current period based on active toggles */
const currentPeriod = $derived(
	penaltyActive ? "penalty" : extraTimeActive ? "extra_time" : "regular",
);

/** Scorer picker state */
let showScorerPicker = $state(false);
let showGoalTypePicker = $state(false);
let showAssistPicker = $state(false);
let showMinutePicker = $state(false);
let pendingGoal = $state(null);

/** Card picker state — yellow OR red, shares the MinutePicker via `showMinutePicker`. */
let cardStep = $state(null); // "team" | "player" | "type" | null
let pendingCard = $state(null);

/** Penalty-missed picker state — also shares the MinutePicker. */
let penaltyMissedStep = $state(null); // "team" | "shooter" | "keeper" | null
let pendingPenaltyMissed = $state(null);

/** Shared minute-picker bindings, used by all flows. */
let pickerMinute = $state(1);
let pickerStoppage = $state(0);
let pickerShowExtraTime = $state(false);

/** Period of the event currently being timed (for floor validation). */
const pickerPeriod = $derived(
	pendingGoal?.period ??
		pendingCard?.period ??
		pendingPenaltyMissed?.period ??
		"regular",
);

/** Whichever non-goal flow currently owns the MinutePicker. */
const pickerKind = $derived(
	pendingGoal
		? "goal"
		: pendingPenaltyMissed
			? "penalty_missed"
			: pendingCard
				? "card"
				: null,
);

/**
 * Validity of the current MinutePicker selection against the existing timeline.
 * The picker clamps drags to the floor, but stoppage selections and `et_off`
 * edge cases can still produce a value below the floor — this gate keeps the
 * confirm button honest.
 */
const pickerValidity = $derived(
	pickerKind
		? validateMinuteAgainstTimeline(
				{ minute: pickerMinute, stoppage: pickerStoppage },
				scoreTimeline,
				pickerPeriod,
			)
		: { valid: true, floor: null },
);

const GOAL_TYPES = [
	{ value: "play", labelKey: "new_game.goal_type_play", icon: "⚽" },
	{ value: "corner", labelKey: "new_game.goal_type_corner", icon: "🚩" },
	{ value: "freekick", labelKey: "new_game.goal_type_freekick", icon: "🎯" },
	{ value: "penalty", labelKey: "new_game.goal_type_penalty", icon: "🥅" },
];

/**
 * Resolve player profile objects for a side (excluding guests)
 * @param {"home"|"away"} side
 * @returns {Array<{id: string, username: string, avatar_url: string|null}>}
 */
function getPlayersForSide(side) {
	const ids = side === "home" ? homePlayers : awayPlayers;
	return ids
		.filter((id) => !id.startsWith?.("__guest__"))
		.map((id) => allPlayers.find((p) => p.id === id))
		.filter(Boolean);
}

/**
 * Handle score change after +/- button click
 * Uses tick() to ensure bindable values are updated before reading
 */
async function handleScoreChange() {
	await tick();
	const newTotal = scoreHome + scoreAway;

	if (newTotal > prevTotal) {
		// Goal scored — determine which side
		const lastEntry =
			scoreTimeline.length > 0
				? scoreTimeline[scoreTimeline.length - 1]
				: { home: 0, away: 0 };
		const side = scoreHome > lastEntry.home ? "home" : "away";
		const sidePlayers = getPlayersForSide(side);

		const scoredBy = sidePlayers.length === 1 ? sidePlayers[0].id : undefined;
		pendingGoal = {
			home: scoreHome,
			away: scoreAway,
			period: currentPeriod,
			side,
			scored_by: scoredBy,
		};

		if (currentPeriod === "penalty") {
			// Penalty shootout — every goal is a penalty, no minute, skip pickers
			pendingGoal = { ...pendingGoal, goal_type: "penalty" };
			commitPendingGoal();
		} else if (sidePlayers.length > 1) {
			// Multi-player team: scorer picker first, then goal type
			showScorerPicker = true;
		} else {
			// Single player (or guest-only): straight to goal-type picker
			showGoalTypePicker = true;
		}
	} else if (newTotal < prevTotal && scoreTimeline.length > 0) {
		// Correction (minus) — pop last entry
		scoreTimeline = scoreTimeline.slice(0, -1);
	}

	prevTotal = newTotal;
	updateResultType();
}

/**
 * Handle scorer selection from picker popup — chains to goal-type picker
 * @param {string} playerId
 */
function selectScorer(playerId) {
	if (!pendingGoal) return;
	pendingGoal = { ...pendingGoal, scored_by: playerId };
	showScorerPicker = false;
	showGoalTypePicker = true;
}

/**
 * Handle goal-type selection. Penalty shootout commits immediately;
 * 2v2 goals (other than penalties) advance to the assist picker first;
 * everything else advances to the minute picker for in-game minute entry.
 *
 * @param {"play"|"corner"|"freekick"|"penalty"} goalType
 */
function selectGoalType(goalType) {
	if (!pendingGoal) return;
	pendingGoal = { ...pendingGoal, goal_type: goalType };
	showGoalTypePicker = false;
	if (pendingGoal.period === "penalty") {
		commitPendingGoal();
		return;
	}
	if (shouldShowAssistPicker(goalType, pendingGoal.side)) {
		showAssistPicker = true;
		return;
	}
	openMinutePicker();
}

/**
 * Whether the assist picker should appear for this goal. Assists exist only
 * in multi-player teams and are conventionally not credited on penalty kicks.
 *
 * @param {"play"|"corner"|"freekick"|"penalty"} goalType
 * @param {"home"|"away"} side
 * @returns {boolean}
 */
function shouldShowAssistPicker(goalType, side) {
	if (goalType === "penalty") return false;
	const eligible = getAssistCandidates(side);
	return eligible.length > 0;
}

/**
 * Handle assist selection. `playerId` of `null` records "no assist" and
 * proceeds. Either way, the flow advances to the minute picker.
 *
 * @param {string|null} playerId
 */
function selectAssist(playerId) {
	if (!pendingGoal) return;
	if (playerId) {
		pendingGoal = { ...pendingGoal, assist_by: playerId };
	}
	showAssistPicker = false;
	openMinutePicker();
}

/**
 * Resolve assist candidates for a side: same team minus the scorer and minus
 * any guest entries (guests do not have profiles to credit).
 *
 * @param {"home"|"away"} side
 * @returns {Array<{ id: string, username: string, avatar_url: string|null }>}
 */
function getAssistCandidates(side) {
	const sidePlayers = getPlayersForSide(side);
	const scorerId = pendingGoal?.scored_by;
	return sidePlayers.filter((p) => p.id !== scorerId);
}

/** Initialize MinutePicker state from current phase and reveal it. */
function openMinutePicker() {
	pickerMinute = 1;
	pickerStoppage = 0;
	pickerShowExtraTime = extraTimeActive;
	showMinutePicker = true;
}

/**
 * Confirm minute selection. Routes to whichever flow currently owns the
 * picker — goal, red-card, or penalty-missed commit.
 */
function confirmMinute() {
	if (pendingGoal) {
		pendingGoal = {
			...pendingGoal,
			minute: pickerMinute,
			stoppage: pickerStoppage,
		};
		commitPendingGoal();
		return;
	}
	if (pendingCard) {
		commitPendingCard();
		return;
	}
	if (pendingPenaltyMissed) {
		commitPendingPenaltyMissed();
	}
}

/** Append the pending goal to the timeline. */
function commitPendingGoal() {
	if (!pendingGoal) return;
	const entry = {
		home: pendingGoal.home,
		away: pendingGoal.away,
		period: pendingGoal.period,
		scored_by: pendingGoal.scored_by,
		goal_type: pendingGoal.goal_type,
	};
	if (pendingGoal.assist_by) {
		entry.assist_by = pendingGoal.assist_by;
	}
	if (typeof pendingGoal.minute === "number") {
		entry.minute = pendingGoal.minute;
		entry.stoppage = pendingGoal.stoppage ?? 0;
	}
	scoreTimeline = [...scoreTimeline, entry];
	prevTotal = pendingGoal.home + pendingGoal.away;
	showScorerPicker = false;
	showGoalTypePicker = false;
	showAssistPicker = false;
	showMinutePicker = false;
	pendingGoal = null;
	updateResultType();
}

/**
 * Cancel any picker. For pending goals we must revert the score increment
 * that opened the flow; pending red cards and missed penalties do not touch
 * the score, so we just close the picker.
 */
function cancelPicker() {
	if (pendingGoal) {
		if (pendingGoal.side === "home") {
			scoreHome = Math.max(0, scoreHome - 1);
		} else {
			scoreAway = Math.max(0, scoreAway - 1);
		}
		prevTotal = scoreHome + scoreAway;
	}
	showScorerPicker = false;
	showGoalTypePicker = false;
	showAssistPicker = false;
	showMinutePicker = false;
	pendingGoal = null;
	pendingCard = null;
	cardStep = null;
	pendingPenaltyMissed = null;
	penaltyMissedStep = null;
}

/**
 * Open the card flow (yellow OR red) at the team-pick step. Disabled
 * during the penalty shootout because cards are not modelled there.
 */
function startCard() {
	if (currentPeriod === "penalty") return;
	pendingCard = { period: currentPeriod };
	cardStep = "team";
}

/**
 * Pick which side the offender is on; advances to the player-pick step.
 * @param {"home"|"away"} team
 */
function selectCardTeam(team) {
	if (!pendingCard) return;
	pendingCard = { ...pendingCard, team };
	cardStep = "player";
}

/**
 * Pick the offending player; advances to the card-type step where the
 * user chooses yellow or red — mirrors the goal-type pattern.
 * @param {string} playerId
 */
function selectCardPlayer(playerId) {
	if (!pendingCard) return;
	pendingCard = { ...pendingCard, player_id: playerId };
	cardStep = "type";
}

/**
 * Pick yellow / red and advance to the (shared) minute picker.
 * @param {"yellow"|"red"} cardType
 */
function selectCardType(cardType) {
	if (!pendingCard) return;
	pendingCard = { ...pendingCard, card_type: cardType };
	cardStep = null;
	openSharedMinutePicker();
}

/** Append the pending card event to the timeline and reset the flow. */
function commitPendingCard() {
	if (!pendingCard) return;
	scoreTimeline = [
		...scoreTimeline,
		{
			event_type: "card",
			card_type: pendingCard.card_type,
			player_id: pendingCard.player_id,
			team: pendingCard.team,
			period: pendingCard.period,
			minute: pickerMinute,
			stoppage: pickerStoppage,
		},
	];
	pendingCard = null;
	cardStep = null;
	showMinutePicker = false;
}

/**
 * Open the missed-penalty flow at the team-pick step. Disabled during the
 * penalty shootout — the spec only models in-game misses.
 */
function startPenaltyMissed() {
	if (currentPeriod === "penalty") return;
	pendingPenaltyMissed = { period: currentPeriod };
	penaltyMissedStep = "team";
}

/**
 * Pick which side took the kick. Auto-resolves shooter (and keeper, when
 * possible) based on actual team sizes — a side with exactly one real
 * player skips the corresponding picker step.
 *
 * @param {"home"|"away"} team
 */
function selectPenaltyTeam(team) {
	if (!pendingPenaltyMissed) return;
	pendingPenaltyMissed = { ...pendingPenaltyMissed, team };

	const shooterCandidates = getPlayersForSide(team);
	const keeperCandidates = getPlayersForSide(team === "home" ? "away" : "home");

	if (shooterCandidates.length === 0) {
		// Guest-only side — bail rather than commit a malformed event.
		cancelPicker();
		return;
	}

	if (shooterCandidates.length === 1) {
		pendingPenaltyMissed = {
			...pendingPenaltyMissed,
			shooter_id: shooterCandidates[0].id,
		};
		if (keeperCandidates.length === 1) {
			pendingPenaltyMissed = {
				...pendingPenaltyMissed,
				keeper_id: keeperCandidates[0].id,
			};
			penaltyMissedStep = null;
			openSharedMinutePicker();
			return;
		}
		if (keeperCandidates.length === 0) {
			// Opposing side has no real player; commit without a keeper id.
			penaltyMissedStep = null;
			openSharedMinutePicker();
			return;
		}
		penaltyMissedStep = "keeper";
		return;
	}

	penaltyMissedStep = "shooter";
}

/**
 * Pick the player who took the kick (2v2 only). Advances to the keeper step.
 *
 * @param {string} playerId
 */
function selectPenaltyShooter(playerId) {
	if (!pendingPenaltyMissed) return;
	pendingPenaltyMissed = { ...pendingPenaltyMissed, shooter_id: playerId };
	penaltyMissedStep = "keeper";
}

/**
 * Pick the keeper, or skip with `null` for an unattributed save (e.g. shot
 * over the bar). Advances to the MinutePicker.
 *
 * @param {string|null} playerId
 */
function selectPenaltyKeeper(playerId) {
	if (!pendingPenaltyMissed) return;
	if (playerId) {
		pendingPenaltyMissed = { ...pendingPenaltyMissed, keeper_id: playerId };
	}
	penaltyMissedStep = null;
	openSharedMinutePicker();
}

/** Reset and reveal the MinutePicker for non-goal flows. */
function openSharedMinutePicker() {
	pickerMinute = 1;
	pickerStoppage = 0;
	pickerShowExtraTime = extraTimeActive;
	showMinutePicker = true;
}

/** Append the pending missed penalty to the timeline and reset the flow. */
function commitPendingPenaltyMissed() {
	if (!pendingPenaltyMissed) return;
	const entry = {
		event_type: "penalty_missed",
		shooter_id: pendingPenaltyMissed.shooter_id,
		team: pendingPenaltyMissed.team,
		period: pendingPenaltyMissed.period,
		minute: pickerMinute,
		stoppage: pickerStoppage,
	};
	if (pendingPenaltyMissed.keeper_id) {
		entry.keeper_id = pendingPenaltyMissed.keeper_id;
	}
	scoreTimeline = [...scoreTimeline, entry];
	pendingPenaltyMissed = null;
	penaltyMissedStep = null;
	showMinutePicker = false;
}

/**
 * Resolve keeper candidates for the missed-penalty flow: opposing-team
 * profiles minus guests.
 *
 * @returns {Array<{ id: string, username: string, avatar_url: string|null }>}
 */
function getPenaltyKeeperCandidates() {
	if (!pendingPenaltyMissed) return [];
	const opposing = pendingPenaltyMissed.team === "home" ? "away" : "home";
	return getPlayersForSide(opposing);
}

/**
 * Lookup player profile by ID for timeline display
 * @param {string} playerId
 * @returns {{username: string, avatar_url: string|null}|null}
 */
function getPlayerProfile(playerId) {
	return allPlayers.find((p) => p.id === playerId) || null;
}

/** Set result_type to the highest active phase in the timeline */
function updateResultType() {
	if (scoreTimeline.some((e) => e.period === "penalty")) {
		resultType = "penalty";
	} else if (scoreTimeline.some((e) => e.period === "extra_time")) {
		resultType = "extra_time";
	} else {
		resultType = "regular";
	}
}

/** Toggle extra time phase */
function toggleExtraTime() {
	extraTimeActive = !extraTimeActive;
	if (!extraTimeActive) {
		penaltyActive = false;
	}
}

/** Toggle penalty shootout phase */
function togglePenalty() {
	penaltyActive = !penaltyActive;
}

/** Preview URLs for stats images */
let overviewPreview = $state(null);
let passesPreview = $state(null);
let defensePreview = $state(null);

/** @type {Array<{type: string, labelKey: string, hintKey: string, get: () => any, set: (f: File) => void, preview: () => string|null, setPreview: (url: string|null) => void}>} */
const statsSlots = [
	{
		type: "overview",
		labelKey: "match_stats.upload_overview_title",
		hintKey: "match_stats.upload_overview_hint",
	},
	{
		type: "passes",
		labelKey: "match_stats.upload_passes_title",
		hintKey: "match_stats.upload_passes_hint",
	},
	{
		type: "defense",
		labelKey: "match_stats.upload_defense_title",
		hintKey: "match_stats.upload_defense_hint",
	},
];

/**
 * Get the file for a stats slot type
 * @param {string} type
 */
function getStatsFile(type) {
	if (type === "overview") return statsOverview;
	if (type === "passes") return statsPasses;
	return statsDefense;
}

/**
 * Get the preview URL for a stats slot type
 * @param {string} type
 */
function getPreview(type) {
	if (type === "overview") return overviewPreview;
	if (type === "passes") return passesPreview;
	return defensePreview;
}

/**
 * Handle stats image file selection for a given type
 * @param {string} type
 * @param {Event} e
 */
function handleStatsImageChange(type, e) {
	const file = e.target.files?.[0];
	if (!file) return;
	if (!file.type.startsWith("image/")) return;
	if (file.size > 20 * 1024 * 1024) return;

	const url = URL.createObjectURL(file);
	if (type === "overview") {
		statsOverview = file;
		overviewPreview = url;
	} else if (type === "passes") {
		statsPasses = file;
		passesPreview = url;
	} else {
		statsDefense = file;
		defensePreview = url;
	}
}

/**
 * Remove selected stats image for a given type
 * @param {string} type
 */
function removeStatsImage(type) {
	if (type === "overview") {
		statsOverview = null;
		if (overviewPreview) {
			URL.revokeObjectURL(overviewPreview);
			overviewPreview = null;
		}
	} else if (type === "passes") {
		statsPasses = null;
		if (passesPreview) {
			URL.revokeObjectURL(passesPreview);
			passesPreview = null;
		}
	} else {
		statsDefense = null;
		if (defensePreview) {
			URL.revokeObjectURL(defensePreview);
			defensePreview = null;
		}
	}
}
</script>

<div class="flex flex-col gap-5">
	<!-- Score Entry -->
	<div class="bg-bg-secondary border border-border rounded-lg p-4">
		<h3 class="text-sm font-medium text-text-primary text-center mb-3">
			{$t("new_game.score_title")}
		</h3>
		<div class="flex items-center justify-center gap-6">
			<div class="flex flex-col items-center gap-1">
				{#if homeTeamData?.logo_url}
					<TeamLogo logoUrl={homeTeamData.logo_url} teamName={homeTeamData.name} size="sm" />
				{/if}
				<span class="text-[10px] text-text-secondary">{homeTeam}</span>
				<ScoreCounter bind:value={scoreHome} onchange={handleScoreChange} />
			</div>

			<span class="text-3xl font-bold text-text-secondary mt-4">:</span>

			<div class="flex flex-col items-center gap-1">
				{#if awayTeamData?.logo_url}
					<TeamLogo logoUrl={awayTeamData.logo_url} teamName={awayTeamData.name} size="sm" />
				{/if}
				<span class="text-[10px] text-text-secondary">{awayTeam}</span>
				<ScoreCounter bind:value={scoreAway} onchange={handleScoreChange} />
			</div>
		</div>

		<!-- Phase Toggles -->
		<div class="flex items-center justify-center gap-2 mt-4">
			<span class="text-[10px] text-text-secondary">{$t("new_game.phase_label")}</span>
			<button
				type="button"
				onclick={toggleExtraTime}
				class="px-3 py-1.5 rounded-full text-xs font-medium border transition-colors {extraTimeActive
					? 'bg-accent-red text-white border-accent-red'
					: 'bg-bg-input text-text-secondary border-border hover:border-text-secondary'}"
			>
				{$t("new_game.extra_time")}
			</button>
			<button
				type="button"
				onclick={togglePenalty}
				disabled={!extraTimeActive}
				class="px-3 py-1.5 rounded-full text-xs font-medium border transition-colors {penaltyActive
					? 'bg-accent-red text-white border-accent-red'
					: extraTimeActive
						? 'bg-bg-input text-text-secondary border-border hover:border-text-secondary'
						: 'bg-bg-input text-text-secondary/40 border-border/40 cursor-not-allowed'}"
			>
				{$t("new_game.penalty")}
			</button>
		</div>

		<!-- Event Actions (one button per event type — separate from the score arrows) -->
		<div class="flex flex-wrap items-center justify-center gap-2 mt-2">
			<span class="text-[10px] text-text-secondary">{$t("new_game.event_label")}</span>
			<button
				type="button"
				onclick={startCard}
				disabled={penaltyActive}
				class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors {penaltyActive
					? 'bg-bg-input text-text-secondary/40 border-border/40 cursor-not-allowed'
					: 'bg-bg-input text-text-primary border-border hover:border-accent-red'}"
			>
				<span aria-hidden="true">🟨🟥</span>
				{$t("new_game.add_card")}
			</button>
			<button
				type="button"
				onclick={startPenaltyMissed}
				disabled={penaltyActive}
				class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors {penaltyActive
					? 'bg-bg-input text-text-secondary/40 border-border/40 cursor-not-allowed'
					: 'bg-bg-input text-text-primary border-border hover:border-accent-red'}"
			>
				<span aria-hidden="true">❌</span>
				{$t("new_game.add_penalty_missed")}
			</button>
		</div>
	</div>

	<!-- Timeline Preview -->
	{#if scoreTimeline.length > 0}
		<div class="bg-bg-secondary border border-border rounded-lg p-3">
			<p class="text-[10px] text-text-secondary mb-2">{$t("game_detail.timeline_title")}</p>
			<div class="flex flex-wrap gap-1.5">
				{#each scoreTimeline as entry, i (i)}
					{#if entry.event_type === "red_card" || entry.event_type === "card"}
						{@const offender = getPlayerProfile(entry.player_id)}
						{@const cardIcon = entry.event_type === "card" && entry.card_type === "yellow"
							? "🟨"
							: "🟥"}
						<span
							class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium {entry.period === 'extra_time'
								? 'bg-accent-red/20 text-accent-red'
								: 'bg-bg-input text-text-primary'}"
						>
							<span aria-hidden="true">{cardIcon}</span>
							{#if offender?.avatar_url}
								<img src={offender.avatar_url} alt={offender.username} class="w-3.5 h-3.5 rounded-full object-cover" />
							{/if}
							<span>{offender?.username ?? "?"}</span>
							{#if typeof entry.minute === "number"}
								<span class="text-[10px] tabular-nums opacity-80">{formatMinute({ minute: entry.minute, stoppage: entry.stoppage ?? 0 })}</span>
							{/if}
							{#if entry.period === "extra_time"}
								<span class="text-[8px] opacity-70">{$t("game_detail.extra_time_short")}</span>
							{/if}
						</span>
					{:else if entry.event_type === "penalty_missed"}
						{@const shooter = getPlayerProfile(entry.shooter_id)}
						{@const keeper = entry.keeper_id ? getPlayerProfile(entry.keeper_id) : null}
						<span
							class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium {entry.period === 'extra_time'
								? 'bg-accent-red/20 text-accent-red'
								: 'bg-bg-input text-text-primary'}"
						>
							<span aria-hidden="true">❌</span>
							{#if shooter?.avatar_url}
								<img src={shooter.avatar_url} alt={shooter.username} class="w-3.5 h-3.5 rounded-full object-cover" />
							{/if}
							<span>{shooter?.username ?? "?"}</span>
							{#if keeper}
								<span class="text-[10px] opacity-70">→ 🧤 {keeper.username}</span>
							{/if}
							{#if typeof entry.minute === "number"}
								<span class="text-[10px] tabular-nums opacity-80">{formatMinute({ minute: entry.minute, stoppage: entry.stoppage ?? 0 })}</span>
							{/if}
							{#if entry.period === "extra_time"}
								<span class="text-[8px] opacity-70">{$t("game_detail.extra_time_short")}</span>
							{/if}
						</span>
					{:else}
						{@const scorer = entry.scored_by ? getPlayerProfile(entry.scored_by) : null}
						{@const assist = entry.assist_by ? getPlayerProfile(entry.assist_by) : null}
						{@const goalIcon = GOAL_TYPES.find((g) => g.value === entry.goal_type)?.icon}
						<span
							class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium {entry.period === 'penalty'
								? 'bg-warning/20 text-warning'
								: entry.period === 'extra_time'
									? 'bg-accent-red/20 text-accent-red'
									: 'bg-bg-input text-text-primary'}"
						>
							{#if scorer?.avatar_url}
								<img src={scorer.avatar_url} alt={scorer.username} class="w-3.5 h-3.5 rounded-full object-cover" />
							{/if}
							{entry.home}:{entry.away}
							{#if typeof entry.minute === "number"}
								<span class="text-[10px] tabular-nums opacity-80">{formatMinute({ minute: entry.minute, stoppage: entry.stoppage ?? 0 })}</span>
							{/if}
							{#if goalIcon && entry.goal_type !== "play"}
								<span class="text-[10px]">{goalIcon}</span>
							{/if}
							{#if assist}
								<span class="text-[10px] opacity-70" title={$t("game_detail.assisted_by", { name: assist.username })}>
									↳ {assist.username}
								</span>
							{/if}
							{#if entry.period === "extra_time"}
								<span class="text-[8px] opacity-70">{$t("game_detail.extra_time_short")}</span>
							{:else if entry.period === "penalty"}
								<span class="text-[8px] opacity-70">{$t("game_detail.penalty_short")}</span>
							{/if}
						</span>
					{/if}
				{/each}
			</div>
		</div>
	{/if}

	<!-- Stats Photos (optional) -->
	<div class="bg-bg-secondary border border-border rounded-lg p-3 flex flex-col gap-2">
		{#each statsSlots as slot (slot.type)}
			{@const preview = getPreview(slot.type)}
			{#if preview}
				<div class="flex items-center gap-3">
					<img
						src={preview}
						alt="Stats"
						class="w-12 h-12 object-cover rounded-md border border-border"
					/>
					<div class="flex-1 min-w-0">
						<p class="text-xs text-text-primary truncate">{$t(slot.labelKey)}</p>
						<p class="text-[10px] text-text-secondary">{$t("match_stats.upload_ready")}</p>
					</div>
					<button
						type="button"
						onclick={() => removeStatsImage(slot.type)}
						class="text-text-secondary hover:text-accent-red text-lg shrink-0"
						aria-label="Remove"
					>
						✕
					</button>
				</div>
			{:else}
				<label class="flex items-center gap-3 cursor-pointer">
					<div class="w-10 h-10 rounded-md bg-bg-input border border-border flex items-center justify-center text-lg">
						📸
					</div>
					<div class="flex-1">
						<p class="text-xs text-text-primary">{$t(slot.labelKey)}</p>
						<p class="text-[10px] text-text-secondary">{$t(slot.hintKey)}</p>
					</div>
					<input
						type="file"
						accept="image/*"
						onchange={(e) => handleStatsImageChange(slot.type, e)}
						class="hidden"
					/>
				</label>
			{/if}
		{/each}
	</div>

	<!-- Navigation -->
	<div class="flex gap-3">
		<Button variant="secondary" onclick={onBack} class="flex-1">
			{$t("new_game.back")}
		</Button>
		<Button variant="primary" onclick={onSave} loading={saving} class="flex-1">
			{saving ? $t("new_game.saving") : $t("new_game.end_game")}
		</Button>
	</div>
</div>

<!-- Scorer Picker Popup -->
{#if showScorerPicker && pendingGoal}
	{@const scoringPlayers = getPlayersForSide(pendingGoal.side)}
	<div
		class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6"
		role="dialog"
		aria-label={$t("new_game.who_scored")}
	>
		<div class="bg-bg-secondary border border-border rounded-xl p-6 w-full max-w-xs">
			<h3 class="text-sm font-medium text-text-primary text-center mb-4">
				{$t("new_game.who_scored")}
			</h3>

			<div class="flex flex-col gap-3">
				{#each scoringPlayers as player (player.id)}
					<button
						type="button"
						onclick={() => selectScorer(player.id)}
						class="flex items-center gap-3 p-3 rounded-lg bg-bg-input border border-border hover:border-accent-red hover:bg-accent-red/10 transition-colors"
					>
						{#if player.avatar_url}
							<img
								src={player.avatar_url}
								alt={player.username}
								class="w-10 h-10 rounded-full object-cover ring-2 ring-border"
							/>
						{:else}
							<div class="w-10 h-10 rounded-full bg-accent-red/20 ring-2 ring-border flex items-center justify-center text-sm font-bold text-text-primary">
								{(player.username || "?").charAt(0).toUpperCase()}
							</div>
						{/if}
						<span class="text-sm font-medium text-text-primary">{player.username}</span>
					</button>
				{/each}
			</div>

			<button
				type="button"
				onclick={cancelPicker}
				class="w-full mt-4 py-2 text-xs text-text-secondary hover:text-text-primary transition-colors"
			>
				{$t("common.back")}
			</button>
		</div>
	</div>
{/if}

<!-- Goal Type Picker Popup -->
{#if showGoalTypePicker && pendingGoal}
	<div
		class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6"
		role="dialog"
		aria-label={$t("new_game.goal_type_title")}
	>
		<div class="bg-bg-secondary border border-border rounded-xl p-6 w-full max-w-xs">
			<h3 class="text-sm font-medium text-text-primary text-center mb-4">
				{$t("new_game.goal_type_title")}
			</h3>

			<div class="grid grid-cols-2 gap-2">
				{#each GOAL_TYPES as type (type.value)}
					<button
						type="button"
						onclick={() => selectGoalType(type.value)}
						class="flex flex-col items-center gap-1 p-3 rounded-lg bg-bg-input border border-border hover:border-accent-red hover:bg-accent-red/10 transition-colors"
					>
						<span class="text-2xl">{type.icon}</span>
						<span class="text-xs font-medium text-text-primary">{$t(type.labelKey)}</span>
					</button>
				{/each}
			</div>

			<button
				type="button"
				onclick={cancelPicker}
				class="w-full mt-4 py-2 text-xs text-text-secondary hover:text-text-primary transition-colors"
			>
				{$t("common.back")}
			</button>
		</div>
	</div>
{/if}

<!-- Assist Picker Popup -->
{#if showAssistPicker && pendingGoal}
	{@const assistCandidates = getAssistCandidates(pendingGoal.side)}
	<div
		class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6"
		role="dialog"
		aria-label={$t("new_game.who_assisted")}
	>
		<div class="bg-bg-secondary border border-border rounded-xl p-6 w-full max-w-xs">
			<h3 class="text-sm font-medium text-text-primary text-center mb-4">
				{$t("new_game.who_assisted")}
			</h3>

			<div class="flex flex-col gap-3">
				{#each assistCandidates as player (player.id)}
					<button
						type="button"
						onclick={() => selectAssist(player.id)}
						class="flex items-center gap-3 p-3 rounded-lg bg-bg-input border border-border hover:border-accent-red hover:bg-accent-red/10 transition-colors"
					>
						{#if player.avatar_url}
							<img
								src={player.avatar_url}
								alt={player.username}
								class="w-10 h-10 rounded-full object-cover ring-2 ring-border"
							/>
						{:else}
							<div class="w-10 h-10 rounded-full bg-accent-red/20 ring-2 ring-border flex items-center justify-center text-sm font-bold text-text-primary">
								{(player.username || "?").charAt(0).toUpperCase()}
							</div>
						{/if}
						<span class="text-sm font-medium text-text-primary">{player.username}</span>
					</button>
				{/each}

				<button
					type="button"
					onclick={() => selectAssist(null)}
					class="flex items-center justify-center gap-2 p-3 rounded-lg bg-bg-input border border-border border-dashed text-text-secondary hover:text-text-primary hover:border-text-secondary transition-colors"
				>
					<span class="text-sm font-medium">{$t("new_game.no_assist")}</span>
				</button>
			</div>

			<button
				type="button"
				onclick={cancelPicker}
				class="w-full mt-4 py-2 text-xs text-text-secondary hover:text-text-primary transition-colors"
			>
				{$t("common.back")}
			</button>
		</div>
	</div>
{/if}

<!-- Card: Team Picker Popup -->
{#if cardStep === "team" && pendingCard}
	<div
		class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6"
		role="dialog"
		aria-label={$t("new_game.card_team")}
	>
		<div class="bg-bg-secondary border border-border rounded-xl p-6 w-full max-w-xs">
			<h3 class="text-sm font-medium text-text-primary text-center mb-4">
				🟨🟥 {$t("new_game.card_team")}
			</h3>

			<div class="flex flex-col gap-3">
				<button
					type="button"
					onclick={() => selectCardTeam("home")}
					class="flex items-center gap-3 p-3 rounded-lg bg-bg-input border border-border hover:border-accent-red hover:bg-accent-red/10 transition-colors"
				>
					{#if homeTeamData?.logo_url}
						<TeamLogo logoUrl={homeTeamData.logo_url} teamName={homeTeamData.name} size="sm" />
					{/if}
					<span class="text-sm font-medium text-text-primary">{homeTeam || $t("game_detail.home_team")}</span>
				</button>
				<button
					type="button"
					onclick={() => selectCardTeam("away")}
					class="flex items-center gap-3 p-3 rounded-lg bg-bg-input border border-border hover:border-accent-red hover:bg-accent-red/10 transition-colors"
				>
					{#if awayTeamData?.logo_url}
						<TeamLogo logoUrl={awayTeamData.logo_url} teamName={awayTeamData.name} size="sm" />
					{/if}
					<span class="text-sm font-medium text-text-primary">{awayTeam || $t("game_detail.away_team")}</span>
				</button>
			</div>

			<button
				type="button"
				onclick={cancelPicker}
				class="w-full mt-4 py-2 text-xs text-text-secondary hover:text-text-primary transition-colors"
			>
				{$t("common.back")}
			</button>
		</div>
	</div>
{/if}

<!-- Card: Player Picker Popup -->
{#if cardStep === "player" && pendingCard}
	{@const teamPlayers = getPlayersForSide(pendingCard.team)}
	<div
		class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6"
		role="dialog"
		aria-label={$t("new_game.card_player")}
	>
		<div class="bg-bg-secondary border border-border rounded-xl p-6 w-full max-w-xs">
			<h3 class="text-sm font-medium text-text-primary text-center mb-4">
				🟨🟥 {$t("new_game.card_player")}
			</h3>

			<div class="flex flex-col gap-3">
				{#each teamPlayers as player (player.id)}
					<button
						type="button"
						onclick={() => selectCardPlayer(player.id)}
						class="flex items-center gap-3 p-3 rounded-lg bg-bg-input border border-border hover:border-accent-red hover:bg-accent-red/10 transition-colors"
					>
						{#if player.avatar_url}
							<img
								src={player.avatar_url}
								alt={player.username}
								class="w-10 h-10 rounded-full object-cover ring-2 ring-border"
							/>
						{:else}
							<div class="w-10 h-10 rounded-full bg-accent-red/20 ring-2 ring-border flex items-center justify-center text-sm font-bold text-text-primary">
								{(player.username || "?").charAt(0).toUpperCase()}
							</div>
						{/if}
						<span class="text-sm font-medium text-text-primary">{player.username}</span>
					</button>
				{/each}
			</div>

			<button
				type="button"
				onclick={cancelPicker}
				class="w-full mt-4 py-2 text-xs text-text-secondary hover:text-text-primary transition-colors"
			>
				{$t("common.back")}
			</button>
		</div>
	</div>
{/if}

<!-- Card: Type Picker Popup (yellow vs red, mirrors goal_type) -->
{#if cardStep === "type" && pendingCard}
	<div
		class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6"
		role="dialog"
		aria-label={$t("new_game.card_type_title")}
	>
		<div class="bg-bg-secondary border border-border rounded-xl p-6 w-full max-w-xs">
			<h3 class="text-sm font-medium text-text-primary text-center mb-4">
				{$t("new_game.card_type_title")}
			</h3>

			<div class="grid grid-cols-2 gap-2">
				<button
					type="button"
					onclick={() => selectCardType("yellow")}
					class="flex flex-col items-center gap-1 p-3 rounded-lg bg-bg-input border border-border hover:border-warning hover:bg-warning/10 transition-colors"
				>
					<span class="text-2xl" aria-hidden="true">🟨</span>
					<span class="text-xs font-medium text-text-primary">{$t("new_game.card_type_yellow")}</span>
				</button>
				<button
					type="button"
					onclick={() => selectCardType("red")}
					class="flex flex-col items-center gap-1 p-3 rounded-lg bg-bg-input border border-border hover:border-accent-red hover:bg-accent-red/10 transition-colors"
				>
					<span class="text-2xl" aria-hidden="true">🟥</span>
					<span class="text-xs font-medium text-text-primary">{$t("new_game.card_type_red")}</span>
				</button>
			</div>

			<button
				type="button"
				onclick={cancelPicker}
				class="w-full mt-4 py-2 text-xs text-text-secondary hover:text-text-primary transition-colors"
			>
				{$t("common.back")}
			</button>
		</div>
	</div>
{/if}

<!-- Penalty Missed: Team Picker Popup -->
{#if penaltyMissedStep === "team" && pendingPenaltyMissed}
	<div
		class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6"
		role="dialog"
		aria-label={$t("new_game.penalty_team")}
	>
		<div class="bg-bg-secondary border border-border rounded-xl p-6 w-full max-w-xs">
			<h3 class="text-sm font-medium text-text-primary text-center mb-4">
				❌ {$t("new_game.penalty_team")}
			</h3>

			<div class="flex flex-col gap-3">
				<button
					type="button"
					onclick={() => selectPenaltyTeam("home")}
					class="flex items-center gap-3 p-3 rounded-lg bg-bg-input border border-border hover:border-accent-red hover:bg-accent-red/10 transition-colors"
				>
					{#if homeTeamData?.logo_url}
						<TeamLogo logoUrl={homeTeamData.logo_url} teamName={homeTeamData.name} size="sm" />
					{/if}
					<span class="text-sm font-medium text-text-primary">{homeTeam || $t("game_detail.home_team")}</span>
				</button>
				<button
					type="button"
					onclick={() => selectPenaltyTeam("away")}
					class="flex items-center gap-3 p-3 rounded-lg bg-bg-input border border-border hover:border-accent-red hover:bg-accent-red/10 transition-colors"
				>
					{#if awayTeamData?.logo_url}
						<TeamLogo logoUrl={awayTeamData.logo_url} teamName={awayTeamData.name} size="sm" />
					{/if}
					<span class="text-sm font-medium text-text-primary">{awayTeam || $t("game_detail.away_team")}</span>
				</button>
			</div>

			<button
				type="button"
				onclick={cancelPicker}
				class="w-full mt-4 py-2 text-xs text-text-secondary hover:text-text-primary transition-colors"
			>
				{$t("common.back")}
			</button>
		</div>
	</div>
{/if}

<!-- Penalty Missed: Shooter Picker Popup (2v2 only) -->
{#if penaltyMissedStep === "shooter" && pendingPenaltyMissed}
	{@const shooterCandidates = getPlayersForSide(pendingPenaltyMissed.team)}
	<div
		class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6"
		role="dialog"
		aria-label={$t("new_game.penalty_shooter")}
	>
		<div class="bg-bg-secondary border border-border rounded-xl p-6 w-full max-w-xs">
			<h3 class="text-sm font-medium text-text-primary text-center mb-4">
				❌ {$t("new_game.penalty_shooter")}
			</h3>

			<div class="flex flex-col gap-3">
				{#each shooterCandidates as player (player.id)}
					<button
						type="button"
						onclick={() => selectPenaltyShooter(player.id)}
						class="flex items-center gap-3 p-3 rounded-lg bg-bg-input border border-border hover:border-accent-red hover:bg-accent-red/10 transition-colors"
					>
						{#if player.avatar_url}
							<img
								src={player.avatar_url}
								alt={player.username}
								class="w-10 h-10 rounded-full object-cover ring-2 ring-border"
							/>
						{:else}
							<div class="w-10 h-10 rounded-full bg-accent-red/20 ring-2 ring-border flex items-center justify-center text-sm font-bold text-text-primary">
								{(player.username || "?").charAt(0).toUpperCase()}
							</div>
						{/if}
						<span class="text-sm font-medium text-text-primary">{player.username}</span>
					</button>
				{/each}
			</div>

			<button
				type="button"
				onclick={cancelPicker}
				class="w-full mt-4 py-2 text-xs text-text-secondary hover:text-text-primary transition-colors"
			>
				{$t("common.back")}
			</button>
		</div>
	</div>
{/if}

<!-- Penalty Missed: Keeper Picker Popup -->
{#if penaltyMissedStep === "keeper" && pendingPenaltyMissed}
	{@const keeperCandidates = getPenaltyKeeperCandidates()}
	<div
		class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6"
		role="dialog"
		aria-label={$t("new_game.penalty_keeper")}
	>
		<div class="bg-bg-secondary border border-border rounded-xl p-6 w-full max-w-xs">
			<h3 class="text-sm font-medium text-text-primary text-center mb-4">
				🧤 {$t("new_game.penalty_keeper")}
			</h3>

			<div class="flex flex-col gap-3">
				{#each keeperCandidates as player (player.id)}
					<button
						type="button"
						onclick={() => selectPenaltyKeeper(player.id)}
						class="flex items-center gap-3 p-3 rounded-lg bg-bg-input border border-border hover:border-accent-red hover:bg-accent-red/10 transition-colors"
					>
						{#if player.avatar_url}
							<img
								src={player.avatar_url}
								alt={player.username}
								class="w-10 h-10 rounded-full object-cover ring-2 ring-border"
							/>
						{:else}
							<div class="w-10 h-10 rounded-full bg-accent-red/20 ring-2 ring-border flex items-center justify-center text-sm font-bold text-text-primary">
								{(player.username || "?").charAt(0).toUpperCase()}
							</div>
						{/if}
						<span class="text-sm font-medium text-text-primary">{player.username}</span>
					</button>
				{/each}

				<button
					type="button"
					onclick={() => selectPenaltyKeeper(null)}
					class="flex items-center justify-center gap-2 p-3 rounded-lg bg-bg-input border border-border border-dashed text-text-secondary hover:text-text-primary hover:border-text-secondary transition-colors"
				>
					<span class="text-sm font-medium">{$t("new_game.penalty_no_keeper")}</span>
				</button>
			</div>

			<button
				type="button"
				onclick={cancelPicker}
				class="w-full mt-4 py-2 text-xs text-text-secondary hover:text-text-primary transition-colors"
			>
				{$t("common.back")}
			</button>
		</div>
	</div>
{/if}

<!-- Minute Picker Popup (shared by goal, card and penalty-missed flows) -->
{#if showMinutePicker && (pendingGoal || pendingCard || pendingPenaltyMissed)}
	{@const minuteTitle = pendingPenaltyMissed
		? $t("new_game.penalty_minute_title")
		: pendingCard
			? pendingCard.card_type === "yellow"
				? $t("new_game.yellow_card_minute_title")
				: $t("new_game.red_card_minute_title")
			: $t("minute_picker.title")}
	<div
		class="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-y-auto"
		role="dialog"
		aria-label={minuteTitle}
	>
		<div class="bg-bg-secondary border border-border rounded-xl p-5 w-full max-w-sm mt-8 mb-8">
			<h3 class="text-sm font-medium text-text-primary text-center mb-4">
				{minuteTitle}
			</h3>

			<MinutePicker
				bind:minute={pickerMinute}
				bind:stoppage={pickerStoppage}
				bind:showExtraTime={pickerShowExtraTime}
				previousGoals={scoreTimeline}
				period={pickerPeriod} />

			<div class="flex gap-2 mt-5">
				<button
					type="button"
					onclick={cancelPicker}
					class="flex-1 py-2 text-xs text-text-secondary hover:text-text-primary border border-border rounded-lg transition-colors"
				>
					{$t("common.back")}
				</button>
				<button
					type="button"
					onclick={confirmMinute}
					disabled={!pickerValidity.valid}
					class="flex-1 py-2 text-xs font-medium text-white bg-accent-red border border-accent-red rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
				>
					{$t("minute_picker.confirm")}
				</button>
			</div>
		</div>
	</div>
{/if}
