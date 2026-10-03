<script>
import { getTranslate } from "@tolgee/svelte";
import { fly } from "svelte/transition";
import PitchBackground from "$lib/components/layout/PitchBackground.svelte";
import { tolgee } from "$lib/config/i18n.config.js";
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
 * Design A: the story frame alternates between brand red and navy from
 * slide to slide, white type on both. Design B: the frame is the pitch,
 * the content white sticker cards. From `lg` the frame becomes a
 * phone-shaped card in the middle of the page colour, with previous /
 * next buttons beside it; taps left or right of it step back or on.
 * Every slide gets the recap, the reduced-motion flag and the locale.
 *
 * @type {{ recap: object, onClose: () => void }}
 */
let { recap, onClose } = $props();

const { t } = getTranslate();

let currentLanguage = $state(tolgee.getLanguage());

$effect(() => {
	const update = () => {
		currentLanguage = tolgee.getLanguage();
	};
	tolgee.on("language", update);
});

const currentLocale = $derived(currentLanguage === "de" ? "de-DE" : "en-US");

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
let frameEl = $state(null);

const activeSlide = $derived(slides[slideIndex] ?? null);
const progressRatios = $derived(
	slideProgressRatios(slides.length, slideIndex, elapsedMs / SLIDE_DURATION_MS),
);

/** Design A alternates the frame colour per slide; B ignores it. */
const tone = $derived(slideIndex % 2 === 0 ? "brand" : "navy");

const storyTag = $derived(
	[recap?.season?.game_version, $t("season_recap.title")]
		.filter(Boolean)
		.join(" · "),
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

/**
 * The left and right thirds of the story frame step back and on. On
 * phones the frame is the whole screen; on desktop a tap beside the
 * frame counts as its nearer side.
 */
function stepForTap(clientX) {
	const rect = frameEl?.getBoundingClientRect();
	const left = rect?.width ? rect.left : 0;
	const width = rect?.width || window.innerWidth;
	const third = width / 3;
	const x = clientX - left;
	if (x < third) goPrev();
	else if (x > third * 2) goNext();
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
	if (heldMs < TAP_MAX_MS) stepForTap(event.clientX);
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
	class="story"
	role="dialog"
	aria-modal="true"
	aria-label={$t("season_recap.dialog_label")}
	tabindex="-1"
	bind:this={dialogEl}
	onpointerdown={handlePointerDown}
	onpointerup={handlePointerUp}
>
	<div class="frame tone-{tone}" bind:this={frameEl}>
		<!-- The pitch of design B, scoped to the frame (hidden in A). -->
		<PitchBackground />

		<div class="frame-top">
			<RecapProgressBars ratios={progressRatios} />
			<div class="frame-head">
				<span class="story-tag">
					<img src="/logo.png" alt="" width="22" height="22" />
					{storyTag}
				</span>
				<button
					type="button"
					class="round-btn close"
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
			</div>
		</div>

		<div class="stage">
			{#key activeSlide?.id}
				<div
					class="slide-wrap"
					in:fly={{ y: reducedMotion ? 0 : 24, duration: reducedMotion ? 0 : 350 }}
				>
					{#if activeSlide}
						{@const SlideComponent = SLIDE_COMPONENTS[activeSlide.id]}
						<SlideComponent {recap} {reducedMotion} locale={currentLocale} />
					{/if}
				</div>
			{/key}
		</div>
	</div>

	<!-- Desktop only: the same steps as the tap zones, as real buttons.
	     aria-disabled, not disabled, at either end: a disabled button would
	     drop the keyboard focus out of the dialog (the steps clamp anyway). -->
	<button
		type="button"
		class="round-btn step step-prev"
		onclick={goPrev}
		aria-disabled={slideIndex === 0}
		aria-label={$t("season_recap.previous_slide")}
	>
		<svg
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2.4"
			stroke-linecap="round"
			stroke-linejoin="round"
			width="22"
			height="22"
			aria-hidden="true"
		>
			<polyline points="15 18 9 12 15 6" />
		</svg>
	</button>
	<button
		type="button"
		class="round-btn step"
		onclick={goNext}
		aria-disabled={isLastSlide(slideIndex, slides.length)}
		aria-label={$t("season_recap.next_slide")}
	>
		<svg
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2.4"
			stroke-linecap="round"
			stroke-linejoin="round"
			width="22"
			height="22"
			aria-hidden="true"
		>
			<polyline points="9 18 15 12 9 6" />
		</svg>
	</button>
</div>

<style>
/* ── Overlay: the page colour around the frame (visible from lg) ────── */
.story {
	position: fixed;
	inset: 0;
	z-index: 50;
	display: flex;
	align-items: center;
	justify-content: center;
	background: var(--page-bg);
	user-select: none;
	-webkit-user-select: none;
}

/* ── Frame: the story itself, full screen on phones ─────────────────── */
.frame {
	position: relative;
	display: flex;
	flex-direction: column;
	width: 100%;
	height: 100%;
	overflow: hidden;
	/* Paint containment makes the frame the containing block of its fixed
	 * descendants: the pitch and the awards confetti fill the frame. */
	contain: paint;
	background: var(--frame-bg, var(--color-brand));
	color: var(--frame-ink, var(--color-on-brand));
	--focus-ring: var(--frame-ink, var(--color-on-brand));
	transition: background-color 300ms ease;
}

.tone-brand {
	--frame-bg: var(--color-brand);
	--frame-ink: var(--color-on-brand);
}

.tone-navy {
	--frame-bg: var(--color-navy);
	--frame-ink: var(--color-on-navy);
}

/* The pitch layer belongs to B only; keep it off the A frame even before
 * <html data-variant> is set. */
.frame :global(.pitch) {
	display: none;
}

:global([data-variant="b"]) .frame :global(.pitch) {
	display: block;
}

/* Focus rings follow the surface: white on the frame (red, navy, pitch),
 * navy on the page around it and inside white cards (RecapCard sets
 * --focus-ring there). */
.story :global(:focus-visible) {
	outline-color: var(--focus-ring, var(--color-ink));
}

.frame-top {
	display: flex;
	flex-direction: column;
	gap: 10px;
	padding: calc(env(safe-area-inset-top) + 10px) 12px 0;
}

.frame-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
}

.story-tag {
	display: inline-flex;
	align-items: center;
	gap: 8px;
	min-width: 0;
	font-family: var(--font-cond);
	font-weight: 700;
	font-size: 13px;
	letter-spacing: 0.03em;
	text-transform: uppercase;
	white-space: nowrap;
}

.story-tag img {
	flex-shrink: 0;
	width: 22px;
	height: 22px;
	object-fit: contain;
}

.round-btn {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	width: 40px;
	height: 40px;
	padding: 0;
	border: 0;
	border-radius: 999px;
	cursor: pointer;
}

.close {
	background: transparent;
	color: inherit;
	box-shadow: inset 0 0 0 1px currentColor;
}

.close:hover {
	background: color-mix(in srgb, currentColor 15%, transparent);
}

.stage {
	flex: 1;
	min-height: 0;
	display: flex;
	flex-direction: column;
	overflow-y: auto;
	padding: 20px 24px calc(env(safe-area-inset-bottom) + 28px);
	container-type: inline-size;
}

/* Auto margins centre the slide and still let a tall one scroll from its
 * top (justify-content: center would clip it). */
.slide-wrap {
	width: 100%;
	max-width: 28rem;
	margin: auto;
}

.step {
	display: none;
	width: 52px;
	height: 52px;
	background: var(--color-surface);
	color: var(--color-ink);
	box-shadow: var(--shadow-card);
}

.step:hover:not([aria-disabled="true"]) {
	background: var(--color-sunken);
}

.step[aria-disabled="true"] {
	opacity: 0.4;
	cursor: default;
}

/* ── Design B: the pitch, white stickers ────────────────────────────── */
:global([data-variant="b"]) .frame {
	--frame-bg: var(--color-page);
	--frame-ink: var(--color-on-page);
	transition: none;
}

:global([data-variant="b"]) .story-tag {
	padding: 4px 12px 4px 6px;
	border-radius: 999px;
	background: var(--color-surface);
	color: var(--color-ink);
	box-shadow: var(--shadow-control);
	font-size: 14px;
	letter-spacing: 0;
	text-transform: none;
}

:global([data-variant="b"]) .close {
	background: var(--color-surface);
	color: var(--color-ink);
	box-shadow: var(--shadow-control);
}

:global([data-variant="b"]) .close:hover {
	background: var(--color-sunken);
}

:global([data-variant="b"]) .step {
	box-shadow: var(--shadow-control);
}

/* ── Desktop: a phone-shaped frame in the middle of the page ────────── */
@media (min-width: 1024px) {
	.story {
		gap: 28px;
		padding: 32px;
	}

	.frame {
		flex: none;
		width: auto;
		height: min(880px, 100%);
		aspect-ratio: 9 / 19;
		border-radius: var(--radius-sheet);
		box-shadow: var(--shadow-raised);
	}

	.frame-top {
		padding-top: 12px;
	}

	.stage {
		padding-bottom: 28px;
	}

	.step {
		display: inline-flex;
	}

	.step-prev {
		order: -1;
	}

	:global([data-variant="b"]) .frame {
		border: 6px solid var(--color-surface);
	}
}

@media (prefers-reduced-motion: reduce) {
	.frame {
		transition: none;
	}
}
</style>
