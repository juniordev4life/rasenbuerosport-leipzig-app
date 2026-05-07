<script>
import { getTranslate } from "@tolgee/svelte";
import {
	compareMinute,
	formatMinute,
	getMinMinuteForNextEvent,
} from "$lib/utils/minute.utils.js";

/**
 * MinutePicker — mobile-first timeline control for in-match minute entry.
 * Tap or drag the track to set the minute; use stoppage buttons at half-end
 * minutes (45/90/105/120). Default range 1–90, expandable to 1–120 via the
 * extra-time toggle. See docs/MinutePicker.md for full spec.
 *
 * @typedef {Object} MinutePickerProps
 * @property {number} [minute=1]
 * @property {number} [stoppage=0]
 * @property {boolean} [showExtraTime=false]
 * @property {Array<{minute?: number, stoppage?: number, period?: string}>} [previousGoals=[]]
 * @property {"regular"|"extra_time"|"penalty"} [period="regular"]
 *   Period of the event being entered. The picker enforces that the chosen
 *   minute is strictly after every previous event of the same period.
 * @property {(minute: number, stoppage: number) => void} [onChange]
 */
let {
	minute = $bindable(1),
	stoppage = $bindable(0),
	showExtraTime = $bindable(false),
	previousGoals = [],
	period = "regular",
	onChange,
} = $props();

const { t } = getTranslate();

const STOPPAGE_ENDPOINTS = [45, 90, 105, 120];
const STOPPAGE_VALUES = [1, 2, 3, 4, 5];

const maxMinute = $derived(showExtraTime ? 120 : 90);
const halfBoundary = 45;
const fullTimeBoundary = 90;

/**
 * Floor that any new event must respect. `null` for the penalty shootout.
 * @type {{ minute: number, stoppage: number }|null}
 */
const floor = $derived(getMinMinuteForNextEvent(previousGoals, period));

/** True when the floor falls inside the currently visible track. */
const floorWithinRange = $derived(!floor || floor.minute <= maxMinute);

/** @type {HTMLDivElement|null} */
let trackEl = $state(null);
let dragging = $state(false);
let initialized = false;

// Smart default: if previous goals exist in the current period and minute is
// the default 1, jump near the last event (5-minute spacing is typical for
// football). Always clamped to the floor and to the visible range.
$effect(() => {
	if (initialized) return;
	initialized = true;
	if (minute !== 1) return;

	if (!floor) return;

	const lastInPeriod = [...previousGoals]
		.reverse()
		.find(
			(g) =>
				(g?.period ?? "regular") === period && typeof g?.minute === "number",
		);

	let next = floor.minute;
	if (lastInPeriod) {
		next = Math.max(next, lastInPeriod.minute + 5);
	}
	next = Math.min(next, maxMinute);

	if (next > 1) minute = next;

	// If the floor demands a non-zero stoppage at this minute, mirror it.
	if (
		floor.minute === minute &&
		floor.stoppage > 0 &&
		STOPPAGE_ENDPOINTS.includes(minute)
	) {
		stoppage = floor.stoppage;
	}
});

// Auto-reset stoppage when minute moves off a half-end endpoint.
$effect(() => {
	if (!STOPPAGE_ENDPOINTS.includes(minute) && stoppage !== 0) {
		stoppage = 0;
	}
});

// Auto-bump stoppage if the current value sinks below the floor.
$effect(() => {
	if (!floor) return;
	if (minute === floor.minute && stoppage < floor.stoppage) {
		stoppage = floor.stoppage;
	}
});

// When ET is toggled off, clamp minute and clear stoppage.
$effect(() => {
	if (!showExtraTime && minute > 90) {
		minute = 90;
		stoppage = 0;
	}
});

// Notify parent on any change.
$effect(() => {
	onChange?.(minute, stoppage);
});

/**
 * Compute minute from a clientX coordinate over the track element. Clamps
 * the result to `[floor.minute, maxMinute]` so drags below the floor snap up.
 *
 * @param {number} clientX
 * @returns {number}
 */
function minuteFromX(clientX) {
	if (!trackEl) return minute;
	const rect = trackEl.getBoundingClientRect();
	const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
	let m = Math.round(ratio * (maxMinute - 1)) + 1;
	m = Math.min(maxMinute, Math.max(1, m));
	if (floor && floorWithinRange && m < floor.minute) m = floor.minute;
	return m;
}

/**
 * Handle pointer down on the track — sets minute and starts drag.
 * @param {PointerEvent} e
 */
function onPointerDown(e) {
	if (!trackEl) return;
	dragging = true;
	trackEl.setPointerCapture?.(e.pointerId);
	const next = minuteFromX(e.clientX);
	if (next !== minute) {
		minute = next;
		navigator.vibrate?.(8);
	}
}

/**
 * Handle pointer move while dragging the track.
 * @param {PointerEvent} e
 */
function onPointerMove(e) {
	if (!dragging) return;
	const next = minuteFromX(e.clientX);
	if (next !== minute) {
		minute = next;
		navigator.vibrate?.(4);
	}
}

/**
 * Handle pointer up / cancel — releases drag.
 * @param {PointerEvent} e
 */
function onPointerUp(e) {
	if (!trackEl) return;
	dragging = false;
	trackEl.releasePointerCapture?.(e.pointerId);
}

/**
 * Toggle stoppage offset (deselect if same value clicked). Refuses values
 * that would push (minute, stoppage) below the floor.
 *
 * @param {number} value
 */
function selectStoppage(value) {
	if (!STOPPAGE_ENDPOINTS.includes(minute)) return;
	if (
		floor &&
		minute === floor.minute &&
		value < floor.stoppage &&
		value !== 0
	) {
		return;
	}
	if (
		floor &&
		minute === floor.minute &&
		stoppage === value &&
		value === floor.stoppage
	) {
		// Cannot deselect to 0 if 0 would violate the floor.
		return;
	}
	stoppage = stoppage === value ? 0 : value;
}

/**
 * Whether a given stoppage value is selectable at the current minute.
 * @param {number} value
 * @returns {boolean}
 */
function isStoppageDisabled(value) {
	if (!STOPPAGE_ENDPOINTS.includes(minute)) return true;
	if (!floor) return false;
	if (minute !== floor.minute) return false;
	return value < floor.stoppage;
}

const stoppageEnabled = $derived(STOPPAGE_ENDPOINTS.includes(minute));

const halfBoundaryPct = $derived((halfBoundary / maxMinute) * 100);
const fullTimePct = $derived((fullTimeBoundary / maxMinute) * 100);
const minutePct = $derived(((minute - 1) / (maxMinute - 1)) * 100);

const isBelowFloor = $derived(
	floor ? compareMinute({ minute, stoppage }, floor) < 0 : false,
);

const floorOutOfRange = $derived(floor && floor.minute > maxMinute);
</script>

<div class="flex flex-col gap-4 select-none">
	<!-- Big minute display -->
	<div class="flex items-baseline justify-center gap-1 mt-1">
		<span class="text-5xl font-bold tabular-nums text-text-primary">{minute}</span>
		{#if stoppage > 0}
			<span class="text-3xl font-bold tabular-nums text-accent-red">+{stoppage}</span>
		{/if}
		<span class="text-2xl font-bold text-text-secondary">'</span>
	</div>
	<p class="text-[10px] text-text-secondary text-center -mt-3">
		{formatMinute({ minute, stoppage })}
	</p>

	{#if floor && (isBelowFloor || floorOutOfRange)}
		<p class="text-[11px] font-medium text-accent-red text-center -mt-2">
			{floorOutOfRange
				? $t("minute_picker.error_too_early")
				: $t("minute_picker.hint_floor", { minute: formatMinute(floor) })}
		</p>
	{/if}

	<!-- Timeline track -->
	<div class="px-1">
		<div
			bind:this={trackEl}
			role="slider"
			tabindex="0"
			aria-label={$t("minute_picker.track_label")}
			aria-valuemin={1}
			aria-valuemax={maxMinute}
			aria-valuenow={minute}
			onpointerdown={onPointerDown}
			onpointermove={onPointerMove}
			onpointerup={onPointerUp}
			onpointercancel={onPointerUp}
			class="relative h-12 rounded-full bg-bg-input border border-border touch-none cursor-pointer overflow-hidden"
		>
			<!-- Locked region (everything below floor) -->
			{#if floor && floorWithinRange && floor.minute > 1}
				<div
					class="absolute inset-y-0 left-0 bg-text-secondary/15"
					style="width: {((floor.minute - 1) / (maxMinute - 1)) * 100}%;"
					aria-hidden="true"
				></div>
			{/if}

			<!-- Extra-time section background -->
			{#if showExtraTime}
				<div
					class="absolute inset-y-0 bg-warning/15"
					style="left: {fullTimePct}%; right: 0;"
				></div>
			{/if}

			<!-- Halftime divider -->
			<div
				class="absolute inset-y-0 w-px bg-text-secondary/40"
				style="left: {halfBoundaryPct}%;"
			></div>

			<!-- Full-time divider (only visible in ET mode) -->
			{#if showExtraTime}
				<div
					class="absolute inset-y-0 w-px bg-text-secondary/40"
					style="left: {fullTimePct}%;"
				></div>
			{/if}

			<!-- Active fill -->
			<div
				class="absolute inset-y-0 left-0 bg-accent-red/25"
				style="width: {minutePct}%;"
			></div>

			<!-- Thumb -->
			<div
				class="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-accent-red border-2 border-white shadow-md"
				style="left: {minutePct}%;"
			></div>
		</div>

		<!-- Range labels -->
		<div class="flex justify-between mt-1.5 text-[10px] text-text-secondary tabular-nums px-1">
			<span>1'</span>
			<span style="margin-left: calc({halfBoundaryPct}% - 12px);">45'</span>
			<span>{showExtraTime ? "90'" : "90'"}</span>
			{#if showExtraTime}
				<span>120'</span>
			{/if}
		</div>
	</div>

	<!-- Stoppage buttons -->
	<div class="flex flex-col items-center gap-1.5">
		<p class="text-[10px] text-text-secondary">
			{stoppageEnabled
				? $t("minute_picker.stoppage_label")
				: $t("minute_picker.stoppage_hint")}
		</p>
		<div class="flex items-center justify-center gap-1.5">
			{#each STOPPAGE_VALUES as value (value)}
				{@const disabled = isStoppageDisabled(value)}
				<button
					type="button"
					onclick={() => selectStoppage(value)}
					{disabled}
					class="w-9 h-9 rounded-full text-xs font-bold tabular-nums border transition-all {stoppage === value
						? 'bg-accent-red text-white border-accent-red'
						: 'bg-bg-input text-text-primary border-border'} {disabled
						? 'opacity-40 cursor-not-allowed pointer-events-none'
						: 'hover:border-accent-red'}"
					aria-label={`+${value}`}
				>
					+{value}
				</button>
			{/each}
		</div>
	</div>

	<!-- Extra-time toggle -->
	<div class="flex items-center justify-center">
		<button
			type="button"
			onclick={() => (showExtraTime = !showExtraTime)}
			class="px-3 py-1.5 rounded-full text-xs font-medium border transition-colors {showExtraTime
				? 'bg-warning text-bg-primary border-warning'
				: 'bg-bg-input text-text-secondary border-border hover:border-text-secondary'}"
		>
			{showExtraTime
				? $t("minute_picker.et_on")
				: $t("minute_picker.et_off")}
		</button>
	</div>
</div>
