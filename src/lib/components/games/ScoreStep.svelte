<script>
	import { getTranslate } from "@tolgee/svelte";
	import { tick } from "svelte";
	import ScoreCounter from "./ScoreCounter.svelte";
	import Button from "$lib/components/ui/Button.svelte";

	/**
	 * ScoreStep - Step 3 of new game wizard
	 * Shows team names, score entry, phase toggles, and timeline tracking
	 */
	let {
		homeTeam = "",
		awayTeam = "",
		scoreHome = $bindable(0),
		scoreAway = $bindable(0),
		scoreTimeline = $bindable([]),
		resultType = $bindable("regular"),
		saving = false,
		onSave,
		onBack,
	} = $props();

	const { t } = getTranslate();

	/** Track previous total score to detect increment vs decrement */
	let prevTotal = $state(0);

	/** Phase toggles */
	let extraTimeActive = $state(false);
	let penaltyActive = $state(false);

	/** Current period based on active toggles */
	const currentPeriod = $derived(
		penaltyActive ? "penalty" : extraTimeActive ? "extra_time" : "regular",
	);

	/**
	 * Handle score change after +/- button click
	 * Uses tick() to ensure bindable values are updated before reading
	 */
	async function handleScoreChange() {
		await tick();
		const newTotal = scoreHome + scoreAway;

		if (newTotal > prevTotal) {
			// Goal scored — push new timeline entry
			scoreTimeline = [
				...scoreTimeline,
				{ home: scoreHome, away: scoreAway, period: currentPeriod },
			];
		} else if (newTotal < prevTotal && scoreTimeline.length > 0) {
			// Correction (minus) — pop last entry
			scoreTimeline = scoreTimeline.slice(0, -1);
		}

		prevTotal = newTotal;
		updateResultType();
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
</script>

<div class="flex flex-col gap-5">
	<!-- Score Entry -->
	<div class="bg-bg-secondary border border-border rounded-lg p-4">
		<h3 class="text-sm font-medium text-text-primary text-center mb-3">
			{$t("new_game.score_title")}
		</h3>
		<div class="flex items-center justify-center gap-6">
			<div class="flex flex-col items-center gap-1">
				<span class="text-[10px] text-text-secondary">{homeTeam}</span>
				<ScoreCounter bind:value={scoreHome} onchange={handleScoreChange} />
			</div>

			<span class="text-3xl font-bold text-text-secondary mt-4">:</span>

			<div class="flex flex-col items-center gap-1">
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
					<span
						class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium {entry.period === 'penalty'
							? 'bg-warning/20 text-warning'
							: entry.period === 'extra_time'
								? 'bg-accent-red/20 text-accent-red'
								: 'bg-bg-input text-text-primary'}"
					>
						{entry.home}:{entry.away}
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
