<script>
import { getTranslate } from "@tolgee/svelte";

/**
 * Step 1 of the new-game wizard — players pick their side directly on
 * the pitch. The same avatar set is rendered in both halves; tapping
 * an avatar on a side toggles assignment there, and once a player is
 * picked on one side they are dimmed/disabled on the other.
 *
 * Each half also exposes a single "Gast"-tile at the end of the row
 * (id `__guest__home` or `__guest__away`) so users can record a
 * one-off guest player without prior signup. Max one guest per side.
 *
 * @type {{
 *   allPlayers: Array<{ id: string, username: string, avatar_url?: string|null }>,
 *   homePlayers: string[],
 *   awayPlayers: string[],
 *   onNext: () => void,
 *   onCancel: () => void,
 * }}
 */
let {
	allPlayers = [],
	homePlayers = $bindable([]),
	awayPlayers = $bindable([]),
	onNext,
	onCancel,
} = $props();

const { t } = getTranslate();

const MAX_PER_SIDE = 5;
const GUEST_HOME_ID = "__guest__home";
const GUEST_AWAY_ID = "__guest__away";

const isValid = $derived(homePlayers.length >= 1 && awayPlayers.length >= 1);

function getPlayerSide(id) {
	if (homePlayers.includes(id)) return "home";
	if (awayPlayers.includes(id)) return "away";
	return null;
}

/**
 * Toggle the player's assignment for the side that was tapped.
 * - Unassigned → add to this side (if room)
 * - Already on this side → remove
 * - On the OTHER side → ignored (the avatar is rendered disabled there)
 */
function toggleOnSide(id, side) {
	const current = getPlayerSide(id);
	if (current === side) {
		if (side === "home") homePlayers = homePlayers.filter((p) => p !== id);
		else awayPlayers = awayPlayers.filter((p) => p !== id);
		return;
	}
	if (current !== null) return;
	if (side === "home" && homePlayers.length < MAX_PER_SIDE) {
		homePlayers = [...homePlayers, id];
	} else if (side === "away" && awayPlayers.length < MAX_PER_SIDE) {
		awayPlayers = [...awayPlayers, id];
	}
}

/** Deterministic gradient so the same user always gets the same colour. */
function avatarGradient(id) {
	const palette = [
		["#84CC16", "#65A30D"],
		["#E24B4A", "#C73E3D"],
		["#6366F1", "#4338CA"],
		["#F59E0B", "#D97706"],
		["#06B6D4", "#0891B2"],
		["#A78BFA", "#7C3AED"],
		["#EC4899", "#BE185D"],
		["#14B8A6", "#0F766E"],
	];
	let hash = 0;
	for (let i = 0; i < id.length; i += 1) {
		hash = (hash * 31 + id.charCodeAt(i)) | 0;
	}
	const [a, b] = palette[Math.abs(hash) % palette.length];
	return `linear-gradient(135deg, ${a}, ${b})`;
}

const GUEST_GRADIENT = "linear-gradient(135deg, #6B7280, #4B5563)";

/**
 * Whether each side's avatar strip is currently overflowing its
 * viewport horizontally. Drives the right-edge swipe hint — we only
 * show it when there's actually more to scroll to, so 4–6 player
 * cases stay free of misleading indicators.
 */
let homePickerOverflow = $state(false);
let awayPickerOverflow = $state(false);

/**
 * Svelte action: reports whether `node` has horizontal overflow via
 * the supplied callback. Watches geometry (ResizeObserver) and
 * child-list changes (MutationObserver) so the hint stays in sync
 * with viewport rotation, new players landing, and the like.
 *
 * @param {HTMLElement} node
 * @param {(canScroll: boolean) => void} onChange
 * @returns {{ destroy: () => void }}
 * @example
 * <div use:trackHorizontalOverflow={(can) => (overflow = can)}>…</div>
 */
function trackHorizontalOverflow(node, onChange) {
	const check = () => onChange(node.scrollWidth - node.clientWidth > 1);
	const ro = new ResizeObserver(check);
	const mo = new MutationObserver(check);
	ro.observe(node);
	mo.observe(node, { childList: true, subtree: false });
	check();
	return {
		destroy() {
			ro.disconnect();
			mo.disconnect();
		},
	};
}
</script>

{#snippet avatarTile(id, name, gradient, side, avatarUrl, onboardingId)}
	{@const currentSide = getPlayerSide(id)}
	{@const onThisSide = currentSide === side}
	{@const onOtherSide = currentSide !== null && currentSide !== side}
	{@const accent = side === "home" ? "ring-accent-red" : "ring-success"}
	<button
		type="button"
		disabled={onOtherSide}
		onclick={() => toggleOnSide(id, side)}
		data-onboarding={onboardingId ?? null}
		class="flex flex-col items-center justify-end gap-1.5 h-full select-none transition-all focus:outline-none {onOtherSide
			? 'opacity-25 cursor-not-allowed'
			: 'active:scale-95'}"
		aria-pressed={onThisSide}
		aria-label={name}
	>
		<span
			class="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-base sm:text-lg font-bold text-white overflow-hidden {onThisSide
				? `ring-4 ${accent} shadow-lg`
				: `ring-2 ring-border`} transition-all"
			style={avatarUrl ? "" : `background: ${gradient};`}
		>
			{#if avatarUrl}
				<img src={avatarUrl} alt={name} class="w-full h-full rounded-full object-cover" />
			{:else}
				{name.charAt(0).toUpperCase()}
			{/if}
		</span>
		<span class="text-[10px] sm:text-[11px] font-semibold text-text-primary max-w-[80px] truncate">
			{name}
		</span>
	</button>
{/snippet}

{#snippet pickerSide(side)}
	{@const guestId = side === "home" ? GUEST_HOME_ID : GUEST_AWAY_ID}
	{@const contentAlign = side === "home"
		? "content-start lg:content-center"
		: "content-end lg:content-center"}
	<!--
		`grid-template-rows: auto auto` lets the two rows shrink to
		content height; the leftover vertical space goes to `align-
		content` (`content-start` on home, `content-end` on away) so
		the avatar block hugs the outer pitch edge instead of sitting
		next to the centre-line hint.

		`auto-cols` is sized just under 1/3 of the visible width so a
		7th-player column peeks ~10 % into the viewport — a stronger
		swipe cue than relying on the scroll-hint alone.
	-->
	<div
		data-onboarding={side === "home" ? "lobby-home" : "lobby-away"}
		use:trackHorizontalOverflow={(can) => {
			if (side === "home") homePickerOverflow = can;
			else awayPickerOverflow = can;
		}}
		class="relative h-full grid [grid-template-rows:auto_auto] grid-flow-col auto-cols-[calc((100%-2rem)/3.3)] gap-x-3 gap-y-4 overflow-x-auto px-3 py-4 {contentAlign} [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
	>
		<!-- Guest tile is rendered FIRST so it always sits in the
		     visible viewport, even when the roster overflows on
		     mobile. Pinning it to the front guarantees the onboarding
		     hint can attach to it without being scrolled out of view,
		     and matches the mental model of "ad-hoc guest slot before
		     the real squad". The home guest doubles as the onboarding
		     anchor; the away copy passes `null` so the tour has a
		     single, unambiguous target. -->
		{@render avatarTile(
			guestId,
			$t("new_game.guest"),
			GUEST_GRADIENT,
			side,
			null,
			side === "home" ? "lobby-guest" : null,
		)}

		{#each allPlayers as player (player.id)}
			{@render avatarTile(
				player.id,
				player.username,
				avatarGradient(player.id),
				side,
				player.avatar_url ?? null,
				null,
			)}
		{/each}
	</div>
{/snippet}

<div class="flex flex-col gap-4">
	<div
		class="relative rounded-2xl border-2 border-border overflow-hidden"
		style="background: linear-gradient(135deg, #0d3320 0%, #0a2516 100%);"
	>
		<!-- Pitch markings -->
		<svg
			viewBox="0 0 200 280"
			preserveAspectRatio="none"
			class="absolute inset-0 w-full h-full opacity-40 pointer-events-none lg:hidden"
			aria-hidden="true"
		>
			<line x1="0" y1="140" x2="200" y2="140" stroke="#84CC16" stroke-width="0.5" />
			<circle cx="100" cy="140" r="22" fill="none" stroke="#84CC16" stroke-width="0.5" />
			<circle cx="100" cy="140" r="1.5" fill="#84CC16" />
			<rect x="60" y="0" width="80" height="32" fill="none" stroke="#84CC16" stroke-width="0.5" />
			<rect x="60" y="248" width="80" height="32" fill="none" stroke="#84CC16" stroke-width="0.5" />
		</svg>
		<svg
			viewBox="0 0 320 200"
			preserveAspectRatio="none"
			class="absolute inset-0 w-full h-full opacity-40 pointer-events-none hidden lg:block"
			aria-hidden="true"
		>
			<line x1="160" y1="0" x2="160" y2="200" stroke="#84CC16" stroke-width="0.5" />
			<circle cx="160" cy="100" r="22" fill="none" stroke="#84CC16" stroke-width="0.5" />
			<circle cx="160" cy="100" r="1.5" fill="#84CC16" />
			<rect x="0" y="60" width="36" height="80" fill="none" stroke="#84CC16" stroke-width="0.5" />
			<rect x="284" y="60" width="36" height="80" fill="none" stroke="#84CC16" stroke-width="0.5" />
		</svg>

		<div class="relative grid grid-cols-1 lg:grid-cols-2 grid-rows-2 lg:grid-rows-1 h-[460px] lg:h-[440px]">
			<div class="relative min-h-0 overflow-hidden">
				{@render pickerSide("home")}
				{#if homePickerOverflow}
					<span class="scroll-hint" aria-hidden="true">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
							<polyline points="9 18 15 12 9 6" />
						</svg>
					</span>
				{/if}
			</div>
			<div class="absolute inset-x-0 top-1/2 h-px bg-white/10 lg:hidden" aria-hidden="true"></div>
			<div class="hidden lg:block absolute inset-y-0 left-1/2 w-px bg-white/10" aria-hidden="true"></div>
			<div class="relative min-h-0 overflow-hidden">
				{@render pickerSide("away")}
				{#if awayPickerOverflow}
					<span class="scroll-hint" aria-hidden="true">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
							<polyline points="9 18 15 12 9 6" />
						</svg>
					</span>
				{/if}
			</div>

			<!--
				Centre-line hint, identical pattern to the live-match
				screen. Sits on top of the divider and gently pushes the
				avatar rows in each half away from the middle.
			-->
			<div class="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center pointer-events-none z-20">
				<span class="bg-black/60 border border-border/40 text-[10px] text-text-secondary font-medium px-2.5 py-1 rounded-full">
					{$t("new_game.lobby.center_hint")}
				</span>
			</div>
		</div>
	</div>

	<div class="flex gap-3">
		<button
			type="button"
			onclick={onCancel}
			class="flex-shrink-0 px-5 py-3 rounded-xl bg-bg-input border border-border text-sm font-semibold text-text-secondary hover:bg-bg-secondary"
		>
			{$t("new_game.cancel")}
		</button>
		<button
			type="button"
			onclick={onNext}
			disabled={!isValid}
			data-onboarding="lobby-next"
			class="flex-1 px-5 py-3 rounded-xl bg-accent-red text-white text-sm font-semibold shadow-lg shadow-accent-red/25 disabled:opacity-40 disabled:shadow-none hover:bg-accent-red-hover transition-all"
		>
			{$t("new_game.next")} →
		</button>
	</div>
</div>

<style>
/* Right-edge swipe hint shown only when the picker strip is actually
 * scrollable (toggled from the `trackHorizontalOverflow` action). The
 * gradient softens the cut-off avatar peeking in from the right, the
 * chevron tells the user the gesture is horizontal, and the gentle
 * bob keeps the cue alive without being noisy. */
.scroll-hint {
	position: absolute;
	right: 0;
	top: 0;
	bottom: 0;
	width: 36px;
	display: flex;
	align-items: center;
	justify-content: flex-end;
	padding-right: 6px;
	pointer-events: none;
	z-index: 10;
	background: linear-gradient(90deg, transparent, rgba(0, 0, 0, 0.55));
	color: rgba(255, 255, 255, 0.9);
	animation: scroll-hint-bob 1.8s ease-in-out infinite;
}
.scroll-hint :global(svg) {
	filter: drop-shadow(0 0 4px rgba(0, 0, 0, 0.7));
}
@keyframes scroll-hint-bob {
	0%, 100% {
		opacity: 0.55;
		transform: translateX(0);
	}
	50% {
		opacity: 1;
		transform: translateX(3px);
	}
}
</style>
