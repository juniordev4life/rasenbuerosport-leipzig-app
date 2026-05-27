<script>
import { getTranslate } from "@tolgee/svelte";
import { GOAL_TYPE } from "$lib/constants/liveMatch.constants.js";
import {
	getMinAllowedMinute,
	getMinAllowedStoppage,
	STOPPAGE_TRIGGER_MINUTES,
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

const labelKind = $derived.by(() => {
	if (eventKind === "card") {
		return {
			text:
				cardColor === "red"
					? $t("game_detail.event_red_card")
					: $t("game_detail.event_yellow_card"),
			variant: cardColor === "red" ? "card-red" : "card-yellow",
		};
	}
	if (eventKind === "penalty_missed") {
		return { text: $t("game_detail.event_penalty_missed"), variant: "miss" };
	}
	if (isOwnGoal) {
		return { text: $t("live_match.editor.label_own_goal"), variant: "goal" };
	}
	return { text: $t("live_match.editor.label_goal"), variant: "goal" };
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
</script>

<div class="flex flex-col gap-1.5 h-full">
	<div class="flex items-center justify-between gap-2">
		<span class="inline-flex items-center gap-1.5 text-[11px] tracking-[0.06em] uppercase font-bold text-text-secondary truncate">
			{#if labelKind.variant === "goal"}
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13" aria-hidden="true">
					<circle cx="12" cy="12" r="9" />
					<path d="M12 3v18M3 12h18M5.5 5.5l13 13M18.5 5.5l-13 13" />
				</svg>
			{:else if labelKind.variant === "card-yellow"}
				<span class="inline-block" aria-hidden="true" style="width: 9px; height: 12px; background: #F59E0B; border-radius: 2px;"></span>
			{:else if labelKind.variant === "card-red"}
				<span class="inline-block" aria-hidden="true" style="width: 9px; height: 12px; background: #E24B4A; border-radius: 2px;"></span>
			{:else if labelKind.variant === "miss"}
				<svg viewBox="0 0 24 24" fill="none" stroke="#E24B4A" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="11" height="11" aria-hidden="true">
					<line x1="18" y1="6" x2="6" y2="18" />
					<line x1="6" y1="6" x2="18" y2="18" />
				</svg>
			{/if}
			<span class="truncate">{labelKind.text}</span>
		</span>
		{#if eventKind === "goal"}
			<button
				type="button"
				onclick={onGoalTypeClick}
				data-onboarding="live-goaltype-pill"
				class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-bg-input border border-border text-[11px] font-semibold whitespace-nowrap"
				aria-label={$t("new_game.goal_type_title")}
			>
				{#if goalType === GOAL_TYPE.CORNER}
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="11" height="11" aria-hidden="true">
						<line x1="4" y1="21" x2="4" y2="3" />
						<path d="M4 3h12l-3 4 3 4H4" />
					</svg>
				{:else if goalType === GOAL_TYPE.FREEKICK}
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="11" height="11" aria-hidden="true">
						<circle cx="12" cy="12" r="9" />
						<circle cx="12" cy="12" r="5" />
						<circle cx="12" cy="12" r="1.5" fill="currentColor" />
					</svg>
				{:else if goalType === GOAL_TYPE.PENALTY}
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="11" height="11" aria-hidden="true">
						<rect x="3" y="6" width="18" height="12" rx="1" />
						<line x1="3" y1="10" x2="21" y2="10" />
						<line x1="7" y1="6" x2="7" y2="18" />
						<line x1="12" y1="6" x2="12" y2="18" />
						<line x1="17" y1="6" x2="17" y2="18" />
					</svg>
				{:else}
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="11" height="11" aria-hidden="true">
						<circle cx="12" cy="12" r="9" />
						<path d="M12 3v18M3 12h18M5.5 5.5l13 13M18.5 5.5l-13 13" />
					</svg>
				{/if}
				<span class="truncate max-w-[80px]">{goalTypeLabel}</span>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="8" height="8" aria-hidden="true">
					<polyline points="6 9 12 15 18 9" />
				</svg>
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

	<div class="confirm-row">
		<button type="button" class="confirm-btn cancel" onclick={onCancel}>
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14" aria-hidden="true">
				<line x1="18" y1="6" x2="6" y2="18" />
				<line x1="6" y1="6" x2="18" y2="18" />
			</svg>
			<span>{$t("live_match.editor.cancel")}</span>
		</button>
		<button type="button" class="confirm-btn save" onclick={onConfirm} disabled={saving}>
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" width="14" height="14" aria-hidden="true">
				<polyline points="20 6 9 17 4 12" />
			</svg>
			<span>{$t("live_match.editor.confirm")}</span>
		</button>
	</div>
</div>

<style>
.confirm-row {
	display: flex;
	gap: 8px;
	margin-top: 10px;
	padding-top: 8px;
}
.confirm-btn {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 6px;
	border-radius: 12px;
	padding: 11px;
	font-size: 12px;
	font-weight: 800;
	border: 1px solid transparent;
	cursor: pointer;
	transition: transform 0.1s, opacity 0.15s, background-color 0.15s, border-color 0.15s;
}
.confirm-btn:active:not(:disabled) { transform: scale(0.98); }
.confirm-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.confirm-btn.cancel {
	background: #131822;
	border-color: #1F2937;
	color: #D1D5DB;
}
.confirm-btn.cancel:hover:not(:disabled) {
	background: #1A1F2A;
	border-color: #2A3142;
}
.confirm-btn.save {
	background: linear-gradient(135deg, #84CC16, #65A30D);
	color: white;
	box-shadow: 0 6px 18px rgba(132, 204, 22, 0.4);
}
.confirm-btn.save:hover:not(:disabled) { transform: translateY(-1px); }
</style>
