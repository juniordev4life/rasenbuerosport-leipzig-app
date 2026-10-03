<script>
import { getTranslate } from "@tolgee/svelte";
import { untrack } from "svelte";
import { GOAL_TYPE } from "$lib/constants/liveMatch.constants.js";
import {
	getEventTimeError,
	MAX_MINUTE,
	MAX_STOPPAGE,
	STOPPAGE_TRIGGER_MINUTES,
} from "$lib/utils/liveMatchState.utils.js";

/**
 * Compact 4-row event editor that fits inside a 50 % pitch half:
 *   1. Label + goal-type pill
 *   2. Minute + stoppage number fields
 *   3. Hint / validation line
 *   4. Cancel / Save action buttons
 *
 * The minute is typed, not scrolled: tap the field, type, save. Every
 * valid keystroke is reported upwards, so the parent state always holds
 * the last valid time. The stoppage field only unlocks at 45 / 90 / 120.
 * Save checks the typed time against the events so far (they are
 * logged in order) and shows the reason instead of saving when it is
 * out of range or before the last event.
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
const uid = $props.id();

/** "" → NaN, so an empty minute field fails validation. */
const toMinute = (text) => (text === "" ? Number.NaN : Number(text));
/** "" and "0" both mean "no stoppage". */
const toStoppage = (text) => (Number(text) > 0 ? Number(text) : null);
const digitsOnly = (text) => text.replace(/\D/g, "");

let minuteText = $state(String(minute ?? ""));
let stoppageText = $state(stoppageMinutes ? String(stoppageMinutes) : "");
/** Errors stay hidden while typing until the first save attempt. */
let attempted = $state(false);
let minuteInput = $state(null);
let stoppageInput = $state(null);

const typedMinute = $derived(toMinute(minuteText));
const stoppageEnabled = $derived(
	STOPPAGE_TRIGGER_MINUTES.includes(typedMinute),
);
const typedStoppage = $derived(
	stoppageEnabled ? toStoppage(stoppageText) : null,
);
const timeError = $derived(
	getEventTimeError(previousEvents, typedMinute, typedStoppage),
);
const showError = $derived(attempted && timeError !== null);

const hintText = $derived.by(() => {
	if (showError) {
		if (timeError.reason === "floor") {
			return $t("live_match.editor.error_floor", {
				earliest: timeError.earliest,
			});
		}
		if (timeError.reason === "stoppage_range") {
			return $t("live_match.editor.error_stoppage_range", {
				max: MAX_STOPPAGE,
			});
		}
		return $t("live_match.editor.error_range", { max: MAX_MINUTE });
	}
	return stoppageEnabled ? "" : $t("live_match.editor.stoppage_hint");
});

// Follow changes made outside the fields (the tour's demo actions,
// the stoppage being dropped when the minute leaves 45 / 90 / 120).
// Only overwrite when the number differs, so a half-typed "13" on the
// way to "130" is not reset.
$effect(() => {
	const next = minute;
	untrack(() => {
		if (toMinute(minuteText) !== next) minuteText = String(next ?? "");
	});
});
$effect(() => {
	const next = stoppageMinutes ?? null;
	untrack(() => {
		if (toStoppage(stoppageText) !== next) {
			stoppageText = next ? String(next) : "";
		}
	});
});

/** Select the value on focus so typing replaces the pre-filled minute. */
function selectAll(event) {
	const input = event.currentTarget;
	requestAnimationFrame(() => input.select());
}

function handleMinuteInput(event) {
	minuteText = digitsOnly(event.currentTarget.value);
	event.currentTarget.value = minuteText;
	const next = toMinute(minuteText);
	if (next >= 1 && next <= MAX_MINUTE) onMinuteChange?.(next);
}

function handleStoppageInput(event) {
	stoppageText = digitsOnly(event.currentTarget.value);
	event.currentTarget.value = stoppageText;
	const next = toStoppage(stoppageText);
	if (next === null || next <= MAX_STOPPAGE) onStoppageChange?.(next);
}

function handleSubmit(event) {
	event.preventDefault();
	if (saving) return;
	if (timeError) {
		attempted = true;
		const target =
			timeError.reason === "stoppage_range" ? stoppageInput : minuteInput;
		target?.focus();
		return;
	}
	onConfirm?.();
}

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

<form class="flex flex-col gap-1.5 h-full" novalidate onsubmit={handleSubmit}>
	<div class="flex items-center justify-between gap-2">
		<span class="inline-flex items-center gap-1.5 text-[11px] tracking-[0.06em] uppercase font-bold text-muted truncate">
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
				class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sunken border border-line text-[11px] font-semibold whitespace-nowrap"
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

	<div class="flex items-end gap-2">
		<div class="flex flex-col gap-1 flex-1 min-w-0">
			<label for="{uid}-minute" class="field-label">
				{$t("live_match.editor.minute_label")}
			</label>
			<div class="relative">
				<input
					bind:this={minuteInput}
					id="{uid}-minute"
					type="text"
					inputmode="numeric"
					pattern="[0-9]*"
					maxlength="3"
					autocomplete="off"
					enterkeyhint="done"
					value={minuteText}
					oninput={handleMinuteInput}
					onfocus={selectAll}
					aria-invalid={showError && timeError.reason !== "stoppage_range"}
					aria-describedby="{uid}-hint"
					class="time-input minute bg-sunken text-ink {showError && timeError.reason !== 'stoppage_range' ? 'border-loss' : 'border-line'}"
				/>
				<span class="time-suffix text-muted" aria-hidden="true">'</span>
			</div>
		</div>
		<div class="flex flex-col gap-1 w-[76px] shrink-0 transition-opacity {stoppageEnabled ? '' : 'opacity-40'}">
			<label for="{uid}-stoppage" class="field-label">
				{$t("live_match.editor.stoppage_label")}
			</label>
			<div class="relative">
				<span class="time-prefix text-muted" aria-hidden="true">+</span>
				<input
					bind:this={stoppageInput}
					id="{uid}-stoppage"
					type="text"
					inputmode="numeric"
					pattern="[0-9]*"
					maxlength="2"
					autocomplete="off"
					enterkeyhint="done"
					disabled={!stoppageEnabled}
					value={stoppageText}
					oninput={handleStoppageInput}
					onfocus={selectAll}
					aria-invalid={showError && timeError.reason === "stoppage_range"}
					aria-describedby="{uid}-hint"
					class="time-input stoppage bg-sunken text-ink {showError && timeError.reason === 'stoppage_range' ? 'border-loss' : 'border-line'}"
				/>
			</div>
		</div>
	</div>

	<p
		id="{uid}-hint"
		class="min-h-[14px] text-[11px] leading-[14px] truncate {showError ? 'text-loss font-semibold' : 'text-muted'}"
		aria-live="polite"
	>
		{hintText}
	</p>

	<div class="confirm-row">
		<button type="button" class="confirm-btn cancel" onclick={onCancel}>
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14" aria-hidden="true">
				<line x1="18" y1="6" x2="6" y2="18" />
				<line x1="6" y1="6" x2="18" y2="18" />
			</svg>
			<span>{$t("live_match.editor.cancel")}</span>
		</button>
		<button type="submit" class="confirm-btn save" disabled={saving}>
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" width="14" height="14" aria-hidden="true">
				<polyline points="20 6 9 17 4 12" />
			</svg>
			<span>{$t("live_match.editor.confirm")}</span>
		</button>
	</div>
</form>

<style>
.field-label {
	font-size: 10px;
	line-height: 12px;
	font-weight: 700;
	letter-spacing: 0.06em;
	text-transform: uppercase;
	color: var(--color-muted);
}
.time-input {
	width: 100%;
	height: 48px;
	border-width: 1px;
	border-radius: 12px;
	text-align: center;
	font-weight: 800;
	font-variant-numeric: tabular-nums;
}
.time-input.minute {
	font-size: 26px;
	padding: 0 24px;
}
.time-input.stoppage {
	font-size: 20px;
	padding: 0 8px 0 20px;
}
.time-input:disabled {
	cursor: not-allowed;
}
.time-suffix,
.time-prefix {
	position: absolute;
	top: 50%;
	transform: translateY(-50%);
	font-weight: 700;
	pointer-events: none;
}
.time-suffix {
	right: 14px;
	font-size: 22px;
}
.time-prefix {
	left: 10px;
	font-size: 16px;
}
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
