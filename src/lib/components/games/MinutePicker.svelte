<script>
import { getTranslate } from "@tolgee/svelte";
import { formatMinute } from "$lib/utils/minute.utils.js";

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
 * @property {Array<{minute?: number}>} [previousGoals=[]]
 * @property {(minute: number, stoppage: number) => void} [onChange]
 */
let {
	minute = $bindable(1),
	stoppage = $bindable(0),
	showExtraTime = $bindable(false),
	previousGoals = [],
	onChange,
} = $props();

const { t } = getTranslate();

const STOPPAGE_ENDPOINTS = [45, 90, 105, 120];
const STOPPAGE_VALUES = [1, 2, 3, 4, 5];

const maxMinute = $derived(showExtraTime ? 120 : 90);
const halfBoundary = 45;
const fullTimeBoundary = 90;

/** @type {HTMLDivElement|null} */
let trackEl = $state(null);
let dragging = $state(false);
let initialized = false;

// Smart default: if previous goals exist and minute is the default 1, jump
// near the last event (typical 5-minute spacing in football).
$effect(() => {
	if (initialized) return;
	initialized = true;
	if (minute !== 1) return;
	const lastWithMinute = [...previousGoals]
		.reverse()
		.find((g) => typeof g.minute === "number");
	if (!lastWithMinute) return;
	const next = Math.min(lastWithMinute.minute + 5, maxMinute);
	if (next > 1) minute = next;
});

// Auto-reset stoppage when minute moves off a half-end endpoint.
$effect(() => {
	if (!STOPPAGE_ENDPOINTS.includes(minute) && stoppage !== 0) {
		stoppage = 0;
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
 * Compute minute from a clientX coordinate over the track element.
 * @param {number} clientX
 * @returns {number}
 */
function minuteFromX(clientX) {
	if (!trackEl) return minute;
	const rect = trackEl.getBoundingClientRect();
	const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
	const m = Math.round(ratio * (maxMinute - 1)) + 1;
	return Math.min(maxMinute, Math.max(1, m));
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
 * Toggle stoppage offset (deselect if same value clicked).
 * @param {number} value
 */
function selectStoppage(value) {
	if (!STOPPAGE_ENDPOINTS.includes(minute)) return;
	stoppage = stoppage === value ? 0 : value;
}

const stoppageEnabled = $derived(STOPPAGE_ENDPOINTS.includes(minute));

const halfBoundaryPct = $derived((halfBoundary / maxMinute) * 100);
const fullTimePct = $derived((fullTimeBoundary / maxMinute) * 100);
const minutePct = $derived(((minute - 1) / (maxMinute - 1)) * 100);
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
				<button
					type="button"
					onclick={() => selectStoppage(value)}
					disabled={!stoppageEnabled}
					class="w-9 h-9 rounded-full text-xs font-bold tabular-nums border transition-all {stoppage === value
						? 'bg-accent-red text-white border-accent-red'
						: 'bg-bg-input text-text-primary border-border'} {stoppageEnabled
						? 'hover:border-accent-red'
						: 'opacity-40 cursor-not-allowed pointer-events-none'}"
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
