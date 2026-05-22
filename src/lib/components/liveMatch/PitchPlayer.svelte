<script>
import { LIVE_MATCH } from "$lib/constants/liveMatch.constants.js";

/**
 * Live-match player avatar. Single tap dispatches `onSelect`; a press
 * held longer than `LIVE_MATCH.longPressMs` dispatches `onLongPress`
 * (own goal). When `onLongPress` fires the next pointerup is squelched
 * so the tap doesn't double-fire.
 *
 * Visual state combines the active highlight (scorer / assister-hint /
 * card-target / penalty-miss-target) and a subtle "pulse" glow during
 * the awaiting-player modes — the colour is supplied by the parent
 * via `glowColor`.
 *
 * @type {{
 *   playerId: string,
 *   name: string,
 *   avatarUrl?: string|null,
 *   gradient: string,
 *   side: "home"|"away",
 *   isScorer?: boolean,
 *   isAssister?: boolean,
 *   isOwnGoal?: boolean,
 *   assistHint?: boolean,
 *   awaitingTarget?: boolean,
 *   glowColor?: "yellow"|"red"|"orange"|null,
 *   onSelect: () => void,
 *   onLongPress: () => void,
 * }}
 */
let {
	name,
	avatarUrl = null,
	gradient,
	side,
	isScorer = false,
	isAssister = false,
	isKeeper = false,
	isOwnGoal = false,
	assistHint = false,
	awaitingTarget = false,
	disabled = false,
	glowColor = null,
	onSelect,
	onLongPress,
} = $props();

let pressTimer = $state(null);
let longPressFired = $state(false);

function handlePointerDown() {
	if (disabled) return;
	longPressFired = false;
	pressTimer = setTimeout(() => {
		longPressFired = true;
		if (typeof navigator !== "undefined" && "vibrate" in navigator) {
			navigator.vibrate(LIVE_MATCH.hapticDurationMs);
		}
		onLongPress?.();
	}, LIVE_MATCH.longPressMs);
}

function handlePointerUp() {
	if (disabled) return;
	if (pressTimer) {
		clearTimeout(pressTimer);
		pressTimer = null;
	}
	if (longPressFired) return;
	onSelect?.();
}

function handlePointerCancel() {
	if (pressTimer) clearTimeout(pressTimer);
	pressTimer = null;
}

const sideRing = side === "home" ? "ring-accent-red" : "ring-success";
const glowClass = $derived(
	glowColor === "yellow"
		? "shadow-[0_0_0_4px_rgba(251,191,36,0.25)]"
		: glowColor === "red"
			? "shadow-[0_0_0_4px_rgba(226,75,74,0.25)]"
			: glowColor === "orange"
				? "shadow-[0_0_0_4px_rgba(245,158,11,0.25)]"
				: "",
);
const stateRing = $derived(
	isScorer
		? "ring-4 ring-warning"
		: isAssister
			? "ring-4 ring-success"
			: isKeeper
				? "ring-4 ring-blue-400"
				: awaitingTarget && glowColor
					? "ring-2 ring-current animate-pulse"
					: assistHint
						? "ring-2 ring-success/40 animate-pulse"
						: `ring-2 ${sideRing}`,
);
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<button
	type="button"
	onpointerdown={handlePointerDown}
	onpointerup={handlePointerUp}
	onpointerleave={handlePointerCancel}
	onpointercancel={handlePointerCancel}
	class="flex flex-col items-center gap-1.5 select-none transition-all focus:outline-none {disabled ? 'opacity-30 cursor-not-allowed' : 'active:scale-95'}"
	aria-label={name}
	aria-disabled={disabled}
>
	<span
		class="w-14 h-14 sm:w-16 sm:h-16 text-lg sm:text-xl rounded-full flex items-center justify-center font-bold text-white {stateRing} {glowClass} transition-all"
		style={avatarUrl ? "" : `background: ${gradient};`}
	>
		{#if avatarUrl}
			<img src={avatarUrl} alt={name} class="w-full h-full rounded-full object-cover" />
		{:else}
			{name.charAt(0).toUpperCase()}
		{/if}
	</span>
	<span class="text-[11px] font-semibold text-text-primary max-w-[88px] truncate">
		{name}
	</span>
	<!-- Fixed-height slot so the avatar doesn't shift when a role is assigned. -->
	<span class="h-[14px] text-[10px] font-bold uppercase tracking-[0.06em] leading-none">
		{#if isScorer}
			<span class="text-warning">{isOwnGoal ? "Eigentor" : "Schütze"}</span>
		{:else if isAssister}
			<span class="text-success">Vorlage</span>
		{:else if isKeeper}
			<span class="text-blue-400">Keeper</span>
		{/if}
	</span>
</button>
