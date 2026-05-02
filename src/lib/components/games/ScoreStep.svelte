<script>
import { getTranslate } from "@tolgee/svelte";
import { tick } from "svelte";
import Button from "$lib/components/ui/Button.svelte";
import TeamLogo from "$lib/components/ui/TeamLogo.svelte";
import { getTeamByName } from "$lib/services/teams.services.js";
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
let pendingGoal = $state(null);

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
			// Penalty shootout — every goal is a penalty, skip picker
			commitPendingGoal("penalty");
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
 * Handle goal-type selection — finalizes the timeline entry
 * @param {"play"|"corner"|"freekick"|"penalty"} goalType
 */
function selectGoalType(goalType) {
	commitPendingGoal(goalType);
}

/**
 * Append the pending goal to the timeline with the chosen type
 * @param {"play"|"corner"|"freekick"|"penalty"} goalType
 */
function commitPendingGoal(goalType) {
	if (!pendingGoal) return;
	scoreTimeline = [
		...scoreTimeline,
		{
			home: pendingGoal.home,
			away: pendingGoal.away,
			period: pendingGoal.period,
			scored_by: pendingGoal.scored_by,
			goal_type: goalType,
		},
	];
	prevTotal = pendingGoal.home + pendingGoal.away;
	showScorerPicker = false;
	showGoalTypePicker = false;
	pendingGoal = null;
	updateResultType();
}

/** Cancel any picker — reverts the score increment */
function cancelPicker() {
	if (!pendingGoal) return;
	if (pendingGoal.side === "home") {
		scoreHome = Math.max(0, scoreHome - 1);
	} else {
		scoreAway = Math.max(0, scoreAway - 1);
	}
	prevTotal = scoreHome + scoreAway;
	showScorerPicker = false;
	showGoalTypePicker = false;
	pendingGoal = null;
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
	</div>

	<!-- Timeline Preview -->
	{#if scoreTimeline.length > 0}
		<div class="bg-bg-secondary border border-border rounded-lg p-3">
			<p class="text-[10px] text-text-secondary mb-2">{$t("game_detail.timeline_title")}</p>
			<div class="flex flex-wrap gap-1.5">
				{#each scoreTimeline as entry, i (i)}
					{@const scorer = entry.scored_by ? getPlayerProfile(entry.scored_by) : null}
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
						{#if goalIcon && entry.goal_type !== "play"}
							<span class="text-[10px]">{goalIcon}</span>
						{/if}
						{#if entry.period === "extra_time"}
							<span class="text-[8px] opacity-70">{$t("game_detail.extra_time_short")}</span>
						{:else if entry.period === "penalty"}
							<span class="text-[8px] opacity-70">{$t("game_detail.penalty_short")}</span>
						{/if}
					</span>
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
