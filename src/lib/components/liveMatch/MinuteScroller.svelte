<script>
import { onMount, untrack } from "svelte";

/**
 * Horizontal scroll-snap minute picker. The active number sits in the
 * centre of the strip; items snap into place via CSS `scroll-snap` so
 * there is zero JS drag logic. An IntersectionObserver with a thin
 * centre-column root margin tells us which item is currently centred.
 *
 * Two variants:
 * - `primary`: large active digit (32px), 1..120 used for minutes
 * - `secondary`: smaller active digit (18px), 1..10 used for stoppage
 *
 * Items below `min` render in a dim "locked" state and the picker
 * snaps back to `min` if the user inertia-scrolls into the locked
 * range. When `disabled` is set the scroller blocks pointer events
 * and dims to ~30 % opacity (used to gate the stoppage row until the
 * primary minute is 45/90/120).
 *
 * @type {{
 *   value: number,
 *   min?: number,
 *   max?: number,
 *   variant?: "primary"|"secondary",
 *   disabled?: boolean,
 *   onChange?: (value: number) => void,
 * }}
 */
let {
	value = $bindable(1),
	min = 1,
	max = 120,
	variant = "primary",
	disabled = false,
	onChange,
} = $props();

const itemWidth = $derived(variant === "primary" ? 52 : 28);

let scrollerEl = $state(null);
/** Suppress the IntersectionObserver callback while we programmatically
 *  re-centre the strip (otherwise external value changes feed back as
 *  fresh user-driven changes and we get a reactive loop). */
let suppressEvents = $state(false);

const numbers = $derived(
	Array.from({ length: max - 0 }, (_, i) => i + 1).slice(0, max),
);

function classFor(n) {
	if (n < min) return "locked";
	if (n === value) return "active";
	if (Math.abs(n - value) === 1) return "near";
	return "";
}

/**
 * Center a value in the strip. With `padding: 0 50%` the first item
 * already sits in the viewport centre at `scrollLeft = itemWidth / 2`,
 * each subsequent item shifts that anchor by `itemWidth`.
 */
function scrollToValue(target, smooth = true) {
	if (!scrollerEl) return;
	const index = target - 1;
	const left = index * itemWidth + itemWidth / 2;
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
 * sits the first item in the centre; every additional `itemWidth`
 * advances the centred index by one. We round to the nearest index.
 */
function activeValueFromScroll() {
	if (!scrollerEl) return value;
	const index = Math.round((scrollerEl.scrollLeft - itemWidth / 2) / itemWidth);
	const clamped = Math.max(0, Math.min(numbers.length - 1, index));
	return numbers[clamped];
}

let rafId = 0;
function handleScroll() {
	if (suppressEvents) return;
	if (rafId) cancelAnimationFrame(rafId);
	rafId = requestAnimationFrame(() => {
		const next = activeValueFromScroll();
		if (next < min) {
			scrollToValue(min);
			return;
		}
		if (next !== value) {
			value = next;
			onChange?.(next);
		}
	});
}

onMount(() => {
	requestAnimationFrame(() => scrollToValue(value, false));
	return () => {
		if (rafId) cancelAnimationFrame(rafId);
	};
});

// External value changes — keep scroll in sync without re-firing onChange.
$effect(() => {
	const v = value;
	untrack(() => scrollToValue(v));
});

// If `min` rises above the current value (e.g. new event lifted the
// floor), nudge the picker up to the new floor so the user can't see
// an invalid selection sitting in the centre.
$effect(() => {
	const floor = min;
	untrack(() => {
		if (value < floor) {
			value = floor;
			onChange?.(floor);
		}
	});
});

function handleKeydown(event) {
	if (disabled) return;
	if (event.key === "ArrowLeft" && value > min) {
		event.preventDefault();
		value -= 1;
		onChange?.(value);
	} else if (event.key === "ArrowRight" && value < max) {
		event.preventDefault();
		value += 1;
		onChange?.(value);
	}
}
</script>

<div
	class="minute-picker {variant}"
	class:disabled
	role="slider"
	tabindex="0"
	aria-valuemin={min}
	aria-valuemax={max}
	aria-valuenow={value}
	aria-disabled={disabled}
	onkeydown={handleKeydown}
>
	<div class="picker-fade left" aria-hidden="true"></div>
	<div class="picker-fade right" aria-hidden="true"></div>
	<div class="picker-selection-line" aria-hidden="true"></div>
	<div class="picker-scroller" bind:this={scrollerEl} onscroll={handleScroll}>
		{#each numbers as n (n)}
			<div class="picker-number {classFor(n)}" data-value={n}>
				{n}
			</div>
		{/each}
	</div>
</div>

<style>
.minute-picker {
	position: relative;
	background: rgba(0, 0, 0, 0.4);
	border: 1px solid rgba(255, 255, 255, 0.08);
	border-radius: 12px;
	overflow: hidden;
	height: 56px;
}
.minute-picker.secondary {
	height: 36px;
	border-radius: 8px;
}
.minute-picker.disabled {
	opacity: 0.3;
	pointer-events: none;
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
	width: 52px;
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 16px;
	font-weight: 600;
	color: #6B7280;
	scroll-snap-align: center;
	transition: font-size 0.2s, color 0.2s;
	font-variant-numeric: tabular-nums;
	letter-spacing: -0.02em;
}
.minute-picker.secondary .picker-number {
	width: 28px;
	font-size: 11px;
	letter-spacing: 0;
}
.picker-number.active {
	color: #ffffff;
	font-size: 30px;
	font-weight: 800;
	letter-spacing: -0.04em;
}
.minute-picker.secondary .picker-number.active {
	font-size: 18px;
	letter-spacing: 0;
}
.picker-number.near {
	color: #9CA3AF;
	font-size: 20px;
	font-weight: 700;
}
.minute-picker.secondary .picker-number.near {
	font-size: 13px;
}
.picker-number.locked {
	color: #3A3D45;
	opacity: 0.5;
}
</style>
