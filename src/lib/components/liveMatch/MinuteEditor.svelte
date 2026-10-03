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

{#snippet goalTypeIcon(type)}
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13" aria-hidden="true">
		{#if type === GOAL_TYPE.CORNER}
			<line x1="4" y1="21" x2="4" y2="3" />
			<path d="M4 3h12l-3 4 3 4H4" />
		{:else if type === GOAL_TYPE.FREEKICK}
			<circle cx="12" cy="12" r="9" />
			<circle cx="12" cy="12" r="5" />
			<circle cx="12" cy="12" r="1.5" fill="currentColor" />
		{:else if type === GOAL_TYPE.PENALTY}
			<rect x="3" y="6" width="18" height="12" rx="1" />
			<line x1="3" y1="10" x2="21" y2="10" />
			<line x1="7" y1="6" x2="7" y2="18" />
			<line x1="12" y1="6" x2="12" y2="18" />
			<line x1="17" y1="6" x2="17" y2="18" />
		{:else}
			<circle cx="12" cy="12" r="9" />
			<path d="M12 3v18M3 12h18M5.5 5.5l13 13M18.5 5.5l-13 13" />
		{/if}
	</svg>
{/snippet}

<form class="editor" novalidate onsubmit={handleSubmit}>
	<div class="editor-head">
		<span class="kind label">
			{#if labelKind.variant === "goal"}
				{@render goalTypeIcon(GOAL_TYPE.OPEN_PLAY)}
			{:else if labelKind.variant === "card-yellow"}
				<span class="card-shape yellow" aria-hidden="true"></span>
			{:else if labelKind.variant === "card-red"}
				<span class="card-shape red" aria-hidden="true"></span>
			{:else if labelKind.variant === "miss"}
				<svg class="text-brand" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="12" height="12" aria-hidden="true">
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
				class="goal-type"
				aria-label={$t("new_game.goal_type_title")}
			>
				{@render goalTypeIcon(goalType)}
				<span class="truncate max-w-[80px]">{goalTypeLabel}</span>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="10" height="10" aria-hidden="true">
					<polyline points="6 9 12 15 18 9" />
				</svg>
			</button>
		{/if}
	</div>

	<div class="flex items-end gap-2">
		<div class="flex flex-col gap-1 flex-1 min-w-0">
			<label for="{uid}-minute" class="field-label label">
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
					class="field time-input minute"
				/>
				<span class="time-suffix" aria-hidden="true">'</span>
			</div>
		</div>
		<div class="stoppage-col" class:locked={!stoppageEnabled}>
			<label for="{uid}-stoppage" class="field-label label">
				{$t("live_match.editor.stoppage_label")}
			</label>
			<div class="relative">
				<span class="time-prefix" aria-hidden="true">+</span>
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
					class="field time-input stoppage"
				/>
			</div>
		</div>
	</div>

	<p id="{uid}-hint" class="hint" class:error={showError} aria-live="polite">
		{hintText}
	</p>

	<div class="confirm-row">
		<button type="button" class="btn btn-secondary btn-sm" onclick={onCancel}>
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14" aria-hidden="true">
				<line x1="18" y1="6" x2="6" y2="18" />
				<line x1="6" y1="6" x2="18" y2="18" />
			</svg>
			<span>{$t("live_match.editor.cancel")}</span>
		</button>
		<button type="submit" class="btn btn-sm btn-confirm" disabled={saving}>
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" width="14" height="14" aria-hidden="true">
				<polyline points="20 6 9 17 4 12" />
			</svg>
			<span>{$t("live_match.editor.confirm")}</span>
		</button>
	</div>
</form>

<style>
.editor {
	display: flex;
	flex-direction: column;
	gap: 8px;
	height: 100%;
}

.editor-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 8px;
}

.kind {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	min-width: 0;
	color: var(--color-muted);
}

.card-shape {
	display: inline-block;
	flex-shrink: 0;
	width: 9px;
	height: 12px;
	border-radius: 2px;
}

.card-shape.yellow {
	background: var(--color-gold);
}

.card-shape.red {
	background: var(--color-brand);
}

/* Tappable goal-type pill: opens GoalTypeDialog. */
.goal-type {
	display: inline-flex;
	align-items: center;
	gap: 5px;
	min-height: 32px;
	padding: 0 10px;
	border: 1px solid var(--color-line);
	border-radius: var(--radius-control);
	background: var(--color-sunken);
	color: var(--color-ink);
	font-size: 12px;
	font-weight: 700;
	white-space: nowrap;
	cursor: pointer;
}

.goal-type:hover {
	border-color: var(--color-navy);
}

.field-label {
	color: var(--color-muted);
	font-size: 11px;
}

.stoppage-col {
	display: flex;
	flex-direction: column;
	gap: 4px;
	width: 80px;
	flex-shrink: 0;
	transition: opacity 150ms;
}

.stoppage-col.locked {
	opacity: 0.45;
}

/* Big typed numbers on the shared .field. */
.time-input {
	height: 50px;
	text-align: center;
	font-family: var(--font-num);
	font-weight: var(--num-weight);
	font-variant-numeric: tabular-nums;
}

.time-input.minute {
	font-size: 28px;
	padding: 0 26px;
}

.time-input.stoppage {
	font-size: 22px;
	padding: 0 8px 0 20px;
}

.time-input:disabled {
	cursor: not-allowed;
	background: var(--color-sunken);
}

.time-input[aria-invalid="true"] {
	border-color: var(--color-loss);
	box-shadow: 0 0 0 1px var(--color-loss);
}

.time-suffix,
.time-prefix {
	position: absolute;
	top: 50%;
	transform: translateY(-50%);
	color: var(--color-muted);
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

.hint {
	min-height: 15px;
	margin: 0;
	overflow: hidden;
	color: var(--color-muted);
	font-size: 12px;
	line-height: 15px;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.hint.error {
	color: var(--color-loss);
	font-weight: 700;
}

.confirm-row {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 8px;
	margin-top: auto;
}

.confirm-row .btn {
	padding: 0 10px;
}
</style>
