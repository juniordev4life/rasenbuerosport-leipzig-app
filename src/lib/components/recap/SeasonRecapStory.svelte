<script>
import { getTranslate } from "@tolgee/svelte";
import { fly } from "svelte/transition";
import {
	availableSlides,
	isLastSlide,
	nextSlideIndex,
	RECAP_SLIDE_DEFS,
	slideProgressRatios,
} from "$lib/utils/recapStory.utils.js";
import RecapProgressBars from "./RecapProgressBars.svelte";
import AwardsSlide from "./slides/AwardsSlide.svelte";
import EloJourneySlide from "./slides/EloJourneySlide.svelte";
import FinaleSlide from "./slides/FinaleSlide.svelte";
import GoalsSlide from "./slides/GoalsSlide.svelte";
import IntroSlide from "./slides/IntroSlide.svelte";
import MatchOfSeasonSlide from "./slides/MatchOfSeasonSlide.svelte";
import NewEloSlide from "./slides/NewEloSlide.svelte";
import NumbersSlide from "./slides/NumbersSlide.svelte";
import RelationsSlide from "./slides/RelationsSlide.svelte";
import TimingSlide from "./slides/TimingSlide.svelte";

/**
 * Full-screen, Instagram-story-style recap of a closed league season
 * for the signed-in player. Auto-advances through whichever slides
 * have data (~7s each, pausing while pressed), and supports tap-third,
 * swipe and arrow-key navigation. Rendered as a modal dialog with its
 * own focus trap — the caller (the `/app/recap/[season]` route) owns
 * where to go once it's closed.
 *
 * @type {{ recap: object, onClose: () => void }}
 */
let { recap, onClose } = $props();

const { t } = getTranslate();

const SLIDE_DURATION_MS = 7000;

const SLIDE_COMPONENTS = {
	intro: IntroSlide,
	numbers: NumbersSlide,
	goals: GoalsSlide,
	timing: TimingSlide,
	relations: RelationsSlide,
	match_of_season: MatchOfSeasonSlide,
	elo_journey: EloJourneySlide,
	new_elo: NewEloSlide,
	awards: AwardsSlide,
	finale: FinaleSlide,
};

const slides = $derived(availableSlides(RECAP_SLIDE_DEFS, recap));

let slideIndex = $state(0);
let elapsedMs = $state(0);
let paused = $state(false);
let reducedMotion = $state(false);
let dialogEl = $state(null);

const activeSlide = $derived(slides[slideIndex] ?? null);
const progressRatios = $derived(
	slideProgressRatios(slides.length, slideIndex, elapsedMs / SLIDE_DURATION_MS),
);

// --- reduced motion ----------------------------------------------------
$effect(() => {
	if (typeof window === "undefined") return;
	const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
	reducedMotion = mq.matches;
	const handleChange = (event) => {
		reducedMotion = event.matches;
	};
	mq.addEventListener("change", handleChange);
	return () => mq.removeEventListener("change", handleChange);
});

// --- focus management ----------------------------------------------------
$effect(() => {
	const previouslyFocused = document.activeElement;
	dialogEl?.focus();
	return () => {
		if (previouslyFocused && typeof previouslyFocused.focus === "function") {
			previouslyFocused.focus();
		}
	};
});

// --- auto-advance timer --------------------------------------------------
$effect(() => {
	const _active = slideIndex;
	void _active;
	elapsedMs = 0;
	let rafId = null;
	let last = null;
	function frame(ts) {
		if (last == null) last = ts;
		const dt = ts - last;
		last = ts;
		if (!paused) {
			elapsedMs += dt;
			if (elapsedMs >= SLIDE_DURATION_MS) {
				if (isLastSlide(slideIndex, slides.length)) {
					elapsedMs = SLIDE_DURATION_MS;
				} else {
					goNext();
					return;
				}
			}
		}
		rafId = requestAnimationFrame(frame);
	}
	rafId = requestAnimationFrame(frame);
	return () => {
		if (rafId) cancelAnimationFrame(rafId);
	};
});

function goNext() {
	slideIndex = nextSlideIndex(slideIndex, slides.length, 1);
}
function goPrev() {
	slideIndex = nextSlideIndex(slideIndex, slides.length, -1);
}
function close() {
	onClose?.();
}

// --- pointer navigation (tap third / swipe / hold-to-pause) -------------
let pressStartTs = 0;
let pressStartX = 0;

/** Interactive elements (links, buttons, the audio player) drive
 *  themselves — taps/holds on them must not also be read as story
 *  navigation. */
function isInteractiveTarget(event) {
	return !!event.target.closest?.('a, button, audio, input, [role="button"]');
}

function handlePointerDown(event) {
	if (isInteractiveTarget(event)) return;
	paused = true;
	pressStartTs = performance.now();
	pressStartX = event.clientX;
}

function handlePointerUp(event) {
	if (isInteractiveTarget(event)) {
		paused = false;
		return;
	}
	paused = false;
	const heldMs = performance.now() - pressStartTs;
	const dx = event.clientX - pressStartX;
	const SWIPE_MIN_PX = 40;
	const TAP_MAX_MS = 250;
	if (Math.abs(dx) >= SWIPE_MIN_PX) {
		if (dx < 0) goNext();
		else goPrev();
		return;
	}
	if (heldMs < TAP_MAX_MS) {
		const third = window.innerWidth / 3;
		if (event.clientX < third) goPrev();
		else if (event.clientX > third * 2) goNext();
	}
}

// --- keyboard: Escape/arrows + a Tab focus trap -------------------------
function getFocusable(container) {
	if (!container) return [];
	return Array.from(
		container.querySelectorAll(
			'a[href], button:not([disabled]), audio[controls], [tabindex]:not([tabindex="-1"])',
		),
	).filter((el) => el.offsetParent !== null);
}

function handleKeydown(event) {
	if (event.key === "Escape") {
		event.preventDefault();
		close();
		return;
	}
	if (event.key === "ArrowRight" || event.key === "ArrowDown") {
		event.preventDefault();
		goNext();
		return;
	}
	if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
		event.preventDefault();
		goPrev();
		return;
	}
	if (event.key === "Tab") {
		const focusable = getFocusable(dialogEl);
		if (focusable.length === 0) return;
		const first = focusable[0];
		const last = focusable[focusable.length - 1];
		if (event.shiftKey && document.activeElement === first) {
			event.preventDefault();
			last.focus();
		} else if (!event.shiftKey && document.activeElement === last) {
			event.preventDefault();
			first.focus();
		}
	}
}
</script>

<svelte:window onkeydown={handleKeydown} />

<div
	class="fixed inset-0 z-50 bg-[#0B0F17] text-white select-none flex flex-col"
	role="dialog"
	aria-modal="true"
	aria-label={$t("season_recap.dialog_label")}
	tabindex="-1"
	bind:this={dialogEl}
	onpointerdown={handlePointerDown}
	onpointerup={handlePointerUp}
>
	<RecapProgressBars ratios={progressRatios} />

	<button
		type="button"
		class="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
		onclick={close}
		aria-label={$t("season_recap.close")}
	>
		<svg
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2.5"
			stroke-linecap="round"
			width="16"
			height="16"
			aria-hidden="true"
		>
			<line x1="18" y1="6" x2="6" y2="18" />
			<line x1="6" y1="6" x2="18" y2="18" />
		</svg>
	</button>

	<div class="flex-1 w-full flex items-center justify-center px-6 py-14 overflow-y-auto">
		{#key activeSlide?.id}
			<div
				class="w-full max-w-md"
				in:fly={{ y: reducedMotion ? 0 : 24, duration: reducedMotion ? 0 : 350 }}
			>
				{#if activeSlide}
					{@const SlideComponent = SLIDE_COMPONENTS[activeSlide.id]}
					<SlideComponent {recap} {reducedMotion} />
				{/if}
			</div>
		{/key}
	</div>
</div>
