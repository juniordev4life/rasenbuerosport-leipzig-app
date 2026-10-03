<script>
import { getTranslate } from "@tolgee/svelte";
import { MediaQuery } from "svelte/reactivity";
import PlayerAvatar from "$lib/components/ui/PlayerAvatar.svelte";
import { LIVE_MATCH } from "$lib/constants/liveMatch.constants.js";

/**
 * Live-match player avatar. Single tap dispatches `onSelect`; a press
 * held longer than `LIVE_MATCH.longPressMs` dispatches `onLongPress`
 * (own goal). When `onLongPress` fires the next pointerup is squelched
 * so the tap doesn't double-fire. Keyboard activation (Enter / Space,
 * a click without a pointer) selects as well.
 *
 * Design A: a square avatar in the team colour (home red, away navy).
 * Design B: the player's own avatar colour inside a white ring and a
 * team-coloured ring, the name on a white pill. A role (scorer /
 * assister / keeper) swaps the ring colour and adds a labelled chip,
 * so the role never rests on colour alone; the awaiting-player modes
 * pulse the ring in the colour supplied via `glowColor`.
 *
 * @type {{
 *   playerId: string,
 *   name: string,
 *   avatarUrl?: string|null,
 *   side: "home"|"away",
 *   isScorer?: boolean,
 *   isAssister?: boolean,
 *   isKeeper?: boolean,
 *   isOwnGoal?: boolean,
 *   assistHint?: boolean,
 *   awaitingTarget?: boolean,
 *   disabled?: boolean,
 *   glowColor?: "yellow"|"red"|"orange"|null,
 *   onSelect: () => void,
 *   onLongPress: () => void,
 * }}
 */
let {
	playerId,
	name,
	avatarUrl = null,
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

const { t } = getTranslate();

let pressTimer = $state(null);
let longPressFired = $state(false);

/** Bigger avatars from `sm` up, where the pitch halves have room. */
const roomy = new MediaQuery("min-width: 640px");

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

/**
 * Enter / Space on the focused button fire a click with `detail === 0`
 * and no pointer events. Pointer taps already selected in pointerup,
 * so only the keyboard click is handled here.
 *
 * @param {MouseEvent} event
 */
function handleKeyboardClick(event) {
	if (disabled || event.detail !== 0) return;
	onSelect?.();
}

/** The role shown under the name, or null. */
const role = $derived(
	isScorer
		? {
				labelKey: isOwnGoal
					? "live_match.role.own_goal"
					: "live_match.role.scorer",
				tone: "scorer",
			}
		: isAssister
			? { labelKey: "live_match.role.assister", tone: "assister" }
			: isKeeper
				? { labelKey: "live_match.role.keeper", tone: "keeper" }
				: null,
);

/** Chip colour per role: shared chips for scorer and keeper. */
const ROLE_CHIP = {
	scorer: "chip-gold",
	assister: "role-assister",
	keeper: "chip-aqua",
};

/** Ring state, read by the CSS through `data-ring`. */
const ring = $derived(
	role
		? role.tone
		: awaitingTarget && glowColor
			? "awaiting"
			: assistHint
				? "assist-hint"
				: "team",
);
</script>

<button
	type="button"
	onpointerdown={handlePointerDown}
	onpointerup={handlePointerUp}
	onpointerleave={handlePointerCancel}
	onpointercancel={handlePointerCancel}
	onclick={handleKeyboardClick}
	class="pitch-player"
	data-side={side}
	data-ring={ring}
	data-glow={glowColor}
	aria-label={name}
	aria-disabled={disabled}
>
	<PlayerAvatar
		player={{ id: playerId, name, avatarUrl }}
		size={roomy.current ? 64 : 56}
		class="pp-avatar"
	/>
	<span class="pp-name">{name}</span>
	<!-- Fixed-height slot so the avatar doesn't shift when a role is assigned. -->
	<span class="pp-role">
		{#if role}
			<span class="chip {ROLE_CHIP[role.tone]}">{$t(role.labelKey)}</span>
		{/if}
	</span>
</button>

<style>
.pitch-player {
	--team: var(--color-home);
	--on-team: var(--color-on-home);
	--ring-color: transparent;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8px;
	padding: 6px 2px 0;
	border: 0;
	background: none;
	color: inherit;
	user-select: none;
	-webkit-user-select: none;
	-webkit-touch-callout: none;
	touch-action: manipulation;
	cursor: pointer;
	transition: transform 120ms;
}

.pitch-player[data-side="away"] {
	--team: var(--color-away);
	--on-team: var(--color-on-away);
}

.pitch-player:active:not([aria-disabled="true"]) {
	transform: scale(0.95);
}

.pitch-player[aria-disabled="true"] {
	opacity: 0.3;
	cursor: not-allowed;
}

/* ── Avatar + state ring ────────────────────────────────────────────── */
.pitch-player :global(.pp-avatar) {
	outline: 3px solid var(--ring-color);
	outline-offset: 3px;
	transition: outline-color 150ms;
}

/* A: the avatar itself carries the team colour (home red, away navy). */
:global(:root:not([data-variant="b"])) .pitch-player :global(.pp-avatar) {
	--avatar-bg: var(--team);
	--avatar-fg: var(--on-team);
}

.pitch-player[data-ring="scorer"] {
	--ring-color: var(--color-gold);
}

.pitch-player[data-ring="assister"] {
	--ring-color: var(--color-win);
}

.pitch-player[data-ring="keeper"] {
	--ring-color: var(--color-aqua);
}

.pitch-player[data-ring="assist-hint"] {
	--ring-color: color-mix(in srgb, var(--color-win) 50%, transparent);
}

.pitch-player[data-ring="awaiting"] {
	--ring-color: var(--color-brand);
}

.pitch-player[data-ring="awaiting"][data-glow="yellow"],
.pitch-player[data-ring="awaiting"][data-glow="orange"] {
	--ring-color: var(--color-gold);
}

.pitch-player[data-ring="awaiting"] :global(.pp-avatar),
.pitch-player[data-ring="assist-hint"] :global(.pp-avatar) {
	animation: ring-pulse 1.6s ease-in-out infinite;
}

@keyframes ring-pulse {
	50% {
		outline-color: transparent;
	}
}

/* ── Name + role ────────────────────────────────────────────────────── */
.pp-name {
	max-width: 88px;
	overflow: hidden;
	font-size: 13px;
	font-weight: 700;
	line-height: 1.25;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.pp-role {
	display: flex;
	align-items: center;
	justify-content: center;
	height: 18px;
}

.role-assister {
	background: var(--color-win);
	color: var(--color-on-win);
}

/* ── Design B: own avatar colour in a white ring, team ring around it,
 *    the name on a white pill. ─────────────────────────────────────── */
:global([data-variant="b"]) .pitch-player :global(.pp-avatar) {
	box-shadow:
		0 0 0 3px var(--color-surface),
		var(--shadow-raised);
	outline-offset: 3px;
}

:global([data-variant="b"]) .pitch-player[data-ring="team"] {
	--ring-color: var(--team);
}

:global([data-variant="b"]) .pp-name {
	max-width: 96px;
	padding: 2px 9px;
	border-radius: 999px;
	background: var(--color-surface);
	color: var(--color-ink);
	font-size: 12px;
	box-shadow: var(--shadow-control);
}
</style>
