<script>
import { getTranslate } from "@tolgee/svelte";
import PlayerAvatar from "$lib/components/ui/PlayerAvatar.svelte";
import { sortPlayersByGamesPlayed } from "$lib/utils/lobbyPlayers.utils.js";

/**
 * Step 1 of the new-game wizard — players pick their side in two team
 * cards (home, away; stacked on phones, side by side from `lg`). The
 * same avatar set is rendered in both cards as a two-row strip that
 * scrolls sideways; tapping an avatar toggles assignment to that side,
 * and once a player is picked on one side they are dimmed/disabled on
 * the other. A picked tile shows a red bar under the name (design A)
 * or a ring and a check mark in the team colour (design B).
 *
 * Players are ordered by games played, so the regulars fill the tiles
 * that are visible without scrolling.
 *
 * Each half also exposes a single "Gast"-tile at the end of the row
 * (id `__guest__home` or `__guest__away`) so users can record a
 * one-off guest player without prior signup. Max one guest per side.
 *
 * @type {{
 *   allPlayers: Array<{ id: string, username: string, avatar_url?: string|null, games_played?: number }>,
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
const uid = $props.id();

const MAX_PER_SIDE = 5;
const GUEST_HOME_ID = "__guest__home";
const GUEST_AWAY_ID = "__guest__away";

const isValid = $derived(homePlayers.length >= 1 && awayPlayers.length >= 1);
const orderedPlayers = $derived(sortPlayersByGamesPlayed(allPlayers));

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

{#snippet avatarTile(id, name, side, avatarUrl, onboardingId)}
	{@const currentSide = getPlayerSide(id)}
	{@const onThisSide = currentSide === side}
	{@const onOtherSide = currentSide !== null && currentSide !== side}
	<button
		type="button"
		disabled={onOtherSide}
		onclick={() => toggleOnSide(id, side)}
		data-onboarding={onboardingId ?? null}
		class="tile"
		class:guest={id === GUEST_HOME_ID || id === GUEST_AWAY_ID}
		aria-pressed={onThisSide}
		aria-label={name}
	>
		<span class="tile-avatar">
			<PlayerAvatar player={{ id, name, avatarUrl }} size={48} />
			<span class="tile-check" aria-hidden="true">
				<svg viewBox="0 0 10 10" width="10" height="10"><path d="M1.5 5.2l2.3 2.3 4.7-5" /></svg>
			</span>
		</span>
		<span class="tile-name">{name}</span>
		<span class="tile-bar" aria-hidden="true"></span>
	</button>
{/snippet}

{#snippet pickerSide(side)}
	{@const guestId = side === "home" ? GUEST_HOME_ID : GUEST_AWAY_ID}
	{@const picked = side === "home" ? homePlayers.length : awayPlayers.length}
	{@const overflow = side === "home" ? homePickerOverflow : awayPickerOverflow}
	<section class="card team-card team-{side}" aria-labelledby="{uid}-{side}">
		<header class="team-head">
			<span class="team-dot" aria-hidden="true"></span>
			<h2 id="{uid}-{side}" class="section-title team-title">
				{side === "home" ? $t("new_game.home") : $t("new_game.away")}
			</h2>
			<span class="team-count">{picked} {$t("new_game.lobby.of")} {MAX_PER_SIDE}</span>
		</header>

		<div class="strip-wrap">
			<!--
				Two rows that fill column by column and scroll sideways.
				Columns are sized just under 1/3 of the visible width so a
				7th-player column peeks into view — a stronger swipe cue
				than relying on the scroll hint alone.
			-->
			<div
				data-onboarding={side === "home" ? "lobby-home" : "lobby-away"}
				use:trackHorizontalOverflow={(can) => {
					if (side === "home") homePickerOverflow = can;
					else awayPickerOverflow = can;
				}}
				class="strip"
			>
				{#each orderedPlayers as player (player.id)}
					{@render avatarTile(
						player.id,
						player.username,
						side,
						player.avatar_url ?? null,
						null,
					)}
				{/each}

				<!-- Guest tile comes LAST: it is the least-used slot, so the
				     visible tiles go to the regulars. The onboarding tour
				     scrolls it into view for its tip (see runOnboardingTour).
				     The home guest doubles as the onboarding anchor; the away
				     copy passes `null` so the tour has a single, unambiguous
				     target. -->
				{@render avatarTile(
					guestId,
					$t("new_game.guest"),
					side,
					null,
					side === "home" ? "lobby-guest" : null,
				)}
			</div>

			{#if overflow}
				<span class="scroll-hint" aria-hidden="true">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
						<polyline points="9 18 15 12 9 6" />
					</svg>
				</span>
			{/if}
		</div>
	</section>
{/snippet}

<div class="lobby">
	{@render pickerSide("home")}

	<p class="center-hint">{$t("new_game.lobby.center_hint")}</p>

	{@render pickerSide("away")}

	<div class="actions">
		<button type="button" onclick={onCancel} class="btn btn-secondary btn-lg">
			{$t("new_game.cancel")}
		</button>
		<button
			type="button"
			onclick={onNext}
			disabled={!isValid}
			data-onboarding="lobby-next"
			class="btn btn-primary btn-lg"
		>
			{$t("new_game.next")}
			<span aria-hidden="true">→</span>
		</button>
	</div>
</div>

<style>
.lobby {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

/* ── Team card ──────────────────────────────────────────────────────── */
.team-card {
	--team: var(--color-home);
	--on-team: var(--color-on-home);
	display: flex;
	flex-direction: column;
	gap: 10px;
	min-width: 0;
	padding: 14px 0 8px;
}

.team-away {
	--team: var(--color-away);
	--on-team: var(--color-on-away);
}

.team-head {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 0 14px;
}

.team-title {
	flex: 1;
	min-width: 0;
	margin: 0;
}

.team-count {
	flex-shrink: 0;
	color: var(--color-muted);
	font-size: 12px;
	font-variant-numeric: tabular-nums;
}

.team-dot {
	display: none;
	width: 12px;
	height: 12px;
	flex-shrink: 0;
	border-radius: 999px;
	background: var(--team);
}

/* ── Avatar strip ───────────────────────────────────────────────────── */
.strip-wrap {
	position: relative;
}

.strip {
	display: grid;
	grid-template-rows: auto auto;
	grid-auto-flow: column;
	grid-auto-columns: calc((100% - 2 * 10px) / 3.3);
	gap: 14px 10px;
	padding: 8px 14px 6px;
	overflow-x: auto;
	scroll-padding-inline: 14px;
	scrollbar-width: none;
}

.strip::-webkit-scrollbar {
	display: none;
}

.tile {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 6px;
	min-width: 0;
	padding: 0;
	border: 0;
	background: none;
	color: var(--color-ink);
	user-select: none;
	cursor: pointer;
	transition: transform 120ms;
}

.tile:active:not(:disabled) {
	transform: scale(0.95);
}

.tile:disabled {
	opacity: 0.35;
	cursor: not-allowed;
}

.tile-avatar {
	position: relative;
	display: inline-flex;
}

.tile-name {
	max-width: 100%;
	overflow: hidden;
	font-size: 13px;
	font-weight: 700;
	line-height: 1.25;
	text-overflow: ellipsis;
	white-space: nowrap;
}

/* A: picked tiles turn red — avatar, name and the bar under it. */
.tile-bar {
	width: 24px;
	height: 3px;
	background: transparent;
}

.tile[aria-pressed="true"] .tile-name {
	color: var(--color-brand);
}

.tile[aria-pressed="true"] .tile-bar {
	background: var(--color-brand);
}

.tile.guest :global(.avatar) {
	--avatar-bg: var(--color-muted);
	--avatar-fg: var(--color-surface);
}

:global(:root:not([data-variant="b"])) .tile[aria-pressed="true"] :global(.avatar) {
	--avatar-bg: var(--color-brand);
	--avatar-fg: var(--color-on-brand);
}

.tile-check {
	position: absolute;
	top: -6px;
	right: -10px;
	display: none;
	align-items: center;
	justify-content: center;
	width: 22px;
	height: 22px;
	border: 2px solid var(--color-surface);
	border-radius: 999px;
	background: var(--team);
	color: var(--on-team);
}

.tile-check path {
	fill: none;
	stroke: currentColor;
	stroke-width: 2;
	stroke-linecap: round;
	stroke-linejoin: round;
}

/* Right-edge swipe cue, only while the strip actually overflows
 * (toggled from the `trackHorizontalOverflow` action). */
.scroll-hint {
	position: absolute;
	right: 8px;
	top: 50%;
	z-index: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 30px;
	height: 30px;
	margin-top: -15px;
	border: 1px solid var(--color-line);
	border-radius: 999px;
	background: var(--color-surface);
	color: var(--color-ink);
	box-shadow: var(--shadow-raised);
	pointer-events: none;
	animation: scroll-hint-bob 1.8s ease-in-out infinite;
}

@keyframes scroll-hint-bob {
	50% {
		transform: translateX(3px);
	}
}

/* ── Hint + actions ─────────────────────────────────────────────────── */
.center-hint {
	margin: 0;
	color: var(--color-on-page);
	text-shadow: var(--on-page-shadow);
	font-size: 14px;
	text-align: center;
}

.actions {
	display: grid;
	grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
	gap: 10px;
	margin-top: 4px;
}

/* ── Design B: sticker cards, round avatars with a team ring ────────── */
:global([data-variant="b"]) .team-card {
	padding-top: 16px;
}

:global([data-variant="b"]) .team-dot {
	display: inline-block;
}

:global([data-variant="b"]) .team-title {
	flex: 0 1 auto;
	font-size: 20px;
}

:global([data-variant="b"]) .team-count {
	margin-left: auto;
	padding: 3px 10px;
	border-radius: 999px;
	background: var(--color-win-soft);
	color: var(--color-win);
	font-weight: 700;
}

:global([data-variant="b"]) .tile-bar {
	display: none;
}

:global([data-variant="b"]) .tile[aria-pressed="true"] .tile-name {
	color: var(--color-ink);
}

:global([data-variant="b"]) .tile[aria-pressed="true"] :global(.avatar) {
	box-shadow:
		0 0 0 2px var(--color-surface),
		0 0 0 5px var(--team);
}

:global([data-variant="b"]) .tile[aria-pressed="true"] .tile-check {
	display: flex;
}

:global([data-variant="b"]) .center-hint {
	align-self: center;
	padding: 7px 14px;
	border-radius: 999px;
	background: var(--color-surface);
	color: var(--color-ink);
	text-shadow: none;
	font-size: 13px;
	font-weight: 700;
	box-shadow: var(--shadow-control);
}

/* ── Desktop: home and away side by side ────────────────────────────── */
@media (min-width: 1024px) {
	.lobby {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		grid-template-areas:
			"hint hint"
			"home away"
			"actions actions";
		gap: 16px 20px;
	}

	.team-home {
		grid-area: home;
	}

	.team-away {
		grid-area: away;
	}

	.center-hint {
		grid-area: hint;
	}

	:global([data-variant="b"]) .center-hint {
		justify-self: center;
	}

	.actions {
		grid-area: actions;
		justify-self: end;
		width: min(100%, 28rem);
	}

	/* Fixed tile width: as many columns as the card has room for. */
	.strip {
		grid-auto-columns: 96px;
	}
}
</style>
