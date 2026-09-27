<script>
import { onMount, untrack } from "svelte";

/**
 * Horizontal scroll-snap value picker. The active number sits in the
 * centre of the strip; items snap into place via CSS `scroll-snap` so
 * there is zero JS drag logic. The active value is derived from the
 * scroll offset via the picker's own index math.
 *
 * Renders every value from `min` to `max` in increments of `step`, e.g.
 * the star-range pickers in `RandomTeamPicker` (`step = 0.5`, range
 * 0.5..5). Arrow Left / Right move the value by one step.
 *
 * @type {{
 *   value: number,
 *   min: number,
 *   max: number,
 *   step?: number,
 *   onChange?: (value: number) => void,
 * }}
 */
let { value = $bindable(), min, max, step = 1, onChange } = $props();

/** Width of one item slot in px — keep in sync with `.picker-number`. */
const ITEM_WIDTH = 28;
/** Tolerance for float-safe equality. */
const EPS = 1e-6;

let scrollerEl = $state(null);
/** Suppress the scroll callback while we programmatically re-centre
 *  the strip (otherwise external value changes feed back as fresh
 *  user-driven changes and we get a reactive loop). */
let suppressEvents = $state(false);
/** First-mount instant-positioning latch — flipped once after the
 *  initial layout pass so subsequent external value changes can
 *  smooth-scroll. */
let didInitialPosition = false;

/** Inclusive [min..max] stepped numbers, rounded to absorb float drift. */
const numbers = $derived.by(() => {
	const arr = [];
	const decimals = step < 1 ? 1 : 0;
	const factor = 10 ** decimals;
	for (let v = min; v <= max + EPS; v += step) {
		arr.push(Math.round(v * factor) / factor);
	}
	return arr;
});

/** Format a value for display: drop trailing `.0` so "4" stays "4". */
function fmt(n) {
	return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function classFor(n) {
	if (Math.abs(n - value) < EPS) return "active";
	if (Math.abs(Math.abs(n - value) - step) < EPS) return "near";
	return "";
}

/** Look up the array index of `target`; defaults to 0 when unknown. */
function indexOf(target) {
	for (let i = 0; i < numbers.length; i += 1) {
		if (Math.abs(numbers[i] - target) < EPS) return i;
	}
	return 0;
}

/**
 * Center a value in the strip. With `padding: 0 50%` the first item
 * already sits in the viewport centre at `scrollLeft = ITEM_WIDTH / 2`,
 * each subsequent item shifts that anchor by `ITEM_WIDTH`.
 */
function scrollToValue(target, smooth = true) {
	if (!scrollerEl) return;
	const index = indexOf(target);
	const left = index * ITEM_WIDTH + ITEM_WIDTH / 2;
	suppressEvents = true;
	scrollerEl.scrollTo({ left, behavior: smooth ? "smooth" : "instant" });
	setTimeout(
		() => {
			suppressEvents = false;
		},
		smooth ? 350 : 50,
	);
}

/**
 * Compute the active number from the current scroll offset. The
 * scroller is padded with 50 % on either side so `scrollLeft = 0`
 * sits the first item in the centre; every additional `ITEM_WIDTH`
 * advances the centred index by one. We round to the nearest index.
 */
function activeValueFromScroll() {
	if (!scrollerEl) return value;
	const index = Math.round(
		(scrollerEl.scrollLeft - ITEM_WIDTH / 2) / ITEM_WIDTH,
	);
	const clamped = Math.max(0, Math.min(numbers.length - 1, index));
	return numbers[clamped];
}

let rafId = 0;
function handleScroll() {
	if (suppressEvents) return;
	if (rafId) cancelAnimationFrame(rafId);
	rafId = requestAnimationFrame(() => {
		const next = activeValueFromScroll();
		if (Math.abs(next - value) > EPS) {
			value = next;
			onChange?.(next);
		}
	});
}

onMount(() => {
	return () => {
		if (rafId) cancelAnimationFrame(rafId);
	};
});

// Keep scroll in sync with the bound value.
//
// The guard against `activeValueFromScroll` is what stops the picker
// from "hanging" mid-drag: every onscroll updates `value`, but the
// scroll position is *already* at the new value's slot — re-calling
// `scrollTo` with smooth behaviour would launch a competing animation
// back to that same spot and fight the user's finger. We skip that
// case and only re-centre for genuine external changes (the parent
// overwrites `value`, e.g. to keep a min/max pair in order).
$effect(() => {
	const v = value;
	untrack(() => {
		if (!scrollerEl) return;
		if (!didInitialPosition) {
			didInitialPosition = true;
			// rAF lets the browser lay out the strip (padding: 0 50 %
			// depends on container width) before we measure scrollLeft.
			requestAnimationFrame(() => {
				if (scrollerEl) scrollToValue(v, false);
			});
			return;
		}
		const currentFromScroll = activeValueFromScroll();
		if (Math.abs(currentFromScroll - v) < EPS) return;
		scrollToValue(v);
	});
});

function handleKeydown(event) {
	if (event.key === "ArrowLeft" && value > min + EPS) {
		event.preventDefault();
		value = Math.max(min, value - step);
		onChange?.(value);
	} else if (event.key === "ArrowRight" && value < max - EPS) {
		event.preventDefault();
		value = Math.min(max, value + step);
		onChange?.(value);
	}
}
</script>

<div
	class="step-scroller"
	role="slider"
	tabindex="0"
	aria-valuemin={min}
	aria-valuemax={max}
	aria-valuenow={value}
	onkeydown={handleKeydown}
>
	<div class="picker-fade left" aria-hidden="true"></div>
	<div class="picker-fade right" aria-hidden="true"></div>
	<div class="picker-selection-line" aria-hidden="true"></div>
	<div class="picker-scroller" bind:this={scrollerEl} onscroll={handleScroll}>
		{#each numbers as n (n)}
			<div class="picker-number {classFor(n)}" data-value={n}>
				{fmt(n)}
			</div>
		{/each}
	</div>
</div>

<style>
.step-scroller {
	position: relative;
	background: rgba(0, 0, 0, 0.4);
	border: 1px solid rgba(255, 255, 255, 0.08);
	border-radius: 8px;
	overflow: hidden;
	height: 36px;
}

.picker-selection-line {
	position: absolute;
	top: 6px;
	bottom: 6px;
	left: 50%;
	width: 1px;
	transform: translateX(-50%);
	z-index: 2;
	pointer-events: none;
	background: linear-gradient(180deg,
		transparent,
		rgba(226, 75, 74, 0.5),
		rgba(226, 75, 74, 0.5),
		transparent);
}

.picker-fade {
	position: absolute;
	top: 0;
	bottom: 0;
	width: 60px;
	z-index: 3;
	pointer-events: none;
}
.picker-fade.left {
	left: 0;
	background: linear-gradient(90deg, rgba(0, 0, 0, 0.6), transparent);
}
.picker-fade.right {
	right: 0;
	background: linear-gradient(270deg, rgba(0, 0, 0, 0.6), transparent);
}

.picker-scroller {
	display: flex;
	align-items: center;
	height: 100%;
	overflow-x: auto;
	overflow-y: hidden;
	scroll-snap-type: x mandatory;
	scrollbar-width: none;
	-ms-overflow-style: none;
	padding: 0 50%;
}
.picker-scroller::-webkit-scrollbar {
	display: none;
}

.picker-number {
	flex-shrink: 0;
	width: 28px;
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 11px;
	font-weight: 600;
	color: #6B7280;
	scroll-snap-align: center;
	transition: font-size 0.2s, color 0.2s;
	font-variant-numeric: tabular-nums;
	letter-spacing: 0;
}
.picker-number.active {
	color: #ffffff;
	font-size: 18px;
	font-weight: 800;
}
.picker-number.near {
	color: #9CA3AF;
	font-size: 13px;
	font-weight: 700;
}
</style>
