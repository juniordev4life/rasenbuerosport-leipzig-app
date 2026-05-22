<script>
import { getTranslate } from "@tolgee/svelte";
import { GOAL_TYPE } from "$lib/constants/liveMatch.constants.js";
import {
	STOPPAGE_TRIGGER_MINUTES,
	getMinAllowedMinute,
	getMinAllowedStoppage,
} from "$lib/utils/liveMatchState.utils.js";
import MinuteScroller from "./MinuteScroller.svelte";

/**
 * Compact 4-row event editor that fits inside a 50 % pitch half:
 *   1. Label + goal-type pill        (24 px)
 *   2. Primary minute scroller        (56 px)
 *   3. Stoppage row + secondary       (36 px)
 *   4. Cancel / Save action buttons   (40 px)
 *
 * Uses two `MinuteScroller` instances (primary + secondary). The
 * stoppage scroller is gated on the primary minute landing on a
 * halftime / fulltime boundary (45 / 90 / 120).
 *
 * @type {{
 *   minute: number,
 *   stoppageMinutes: number|null,
 *   goalType: string,
 *   previousEvents: object[],
 *   eventKind: "goal"|"card"|"penalty_missed",
 *   cardColor?: "yellow"|"red"|null,
 *   isOwnGoal?: boolean,
 *   saving?: boolean,
 *   onMinuteChange: (minute: number) => void,
 *   onStoppageChange: (stoppage: number|null) => void,
 *   onGoalTypeClick: () => void,
 *   onCancel: () => void,
 *   onConfirm: () => void,
 * }}
 */
let {
	minute = $bindable(),
	stoppageMinutes = $bindable(),
	goalType,
	previousEvents = [],
	eventKind,
	cardColor = null,
	isOwnGoal = false,
	saving = false,
	onMinuteChange,
	onStoppageChange,
	onGoalTypeClick,
	onCancel,
	onConfirm,
} = $props();

const { t } = getTranslate();

const minAllowed = $derived(getMinAllowedMinute(previousEvents));
const stoppageFloor = $derived(getMinAllowedStoppage(previousEvents, minute));
const stoppageEnabled = $derived(STOPPAGE_TRIGGER_MINUTES.includes(minute));

const inlineLabel = $derived.by(() => {
	if (eventKind === "card") {
		return cardColor === "red"
			? `🟥 ${$t("game_detail.event_red_card")}`
			: `🟨 ${$t("game_detail.event_yellow_card")}`;
	}
	if (eventKind === "penalty_missed")
		return `❌ ${$t("game_detail.event_penalty_missed")}`;
	if (isOwnGoal) return `⚽ ${$t("live_match.editor.label_own_goal")}`;
	return `⚽ ${$t("live_match.editor.label_goal")}`;
});

const goalTypeLabel = $derived.by(() => {
	switch (goalType) {
		case GOAL_TYPE.CORNER:
			return $t("new_game.goal_type_corner");
		case GOAL_TYPE.FREEKICK:
			return $t("new_game.goal_type_freekick");
		case GOAL_TYPE.PENALTY:
			return $t("new_game.goal_type_penalty");
		default:
			return $t("new_game.goal_type_play");
	}
});

const goalTypeIcon = $derived.by(() => {
	switch (goalType) {
		case GOAL_TYPE.CORNER:
			return "🚩";
		case GOAL_TYPE.FREEKICK:
			return "🎯";
		case GOAL_TYPE.PENALTY:
			return "🥅";
		default:
			return "⚽";
	}
});
</script>

<div class="flex flex-col gap-1.5 h-full">
	<div class="flex items-center justify-between gap-2">
		<span class="text-[11px] tracking-[0.06em] uppercase font-bold text-text-secondary truncate">
			{inlineLabel}
		</span>
		{#if eventKind === "goal"}
			<button
				type="button"
				onclick={onGoalTypeClick}
				class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-bg-input border border-border text-[11px] font-semibold whitespace-nowrap"
			>
				<span aria-hidden="true">{goalTypeIcon}</span>
				<span class="truncate max-w-[80px]">{goalTypeLabel}</span>
				<span class="text-text-muted text-[10px]">▾</span>
			</button>
		{/if}
	</div>

	<MinuteScroller
		bind:value={minute}
		min={minAllowed}
		max={120}
		variant="primary"
		onChange={(v) => onMinuteChange?.(v)}
	/>

	<div class="flex items-center gap-2">
		<span class="text-[11px] text-text-secondary shrink-0 transition-opacity {stoppageEnabled ? '' : 'opacity-40'}">
			{$t("live_match.editor.stoppage_label")}
		</span>
		<!-- Nachspielzeit hat nur 10 Werte — halbe Breite reicht. -->
		<div class="w-1/2 max-w-[180px]">
			<MinuteScroller
				value={stoppageMinutes ?? stoppageFloor}
				min={stoppageFloor}
				max={10}
				variant="secondary"
				disabled={!stoppageEnabled}
				onChange={(v) => onStoppageChange?.(stoppageEnabled ? v : null)}
			/>
		</div>
	</div>

	<div class="flex gap-3 mt-3 pt-2 justify-center">
		<button
			type="button"
			onclick={onCancel}
			class="w-10 h-10 inline-flex items-center justify-center rounded-full border border-border bg-bg-input text-text-secondary text-lg hover:bg-bg-card"
			aria-label={$t("new_game.back")}
		>✕</button>
		<button
			type="button"
			onclick={onConfirm}
			disabled={saving}
			class="w-10 h-10 inline-flex items-center justify-center rounded-full bg-gradient-to-br from-success to-success/80 text-white text-lg shadow-md shadow-success/30 disabled:opacity-50"
			aria-label={$t("live_match.editor.confirm")}
		>✓</button>
	</div>
</div>
