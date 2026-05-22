<script>
import { getTranslate } from "@tolgee/svelte";
import { isEntryMode } from "$lib/utils/liveMatchState.utils.js";
import { MODE } from "$lib/constants/liveMatch.constants.js";
import MinuteEditor from "./MinuteEditor.svelte";
import PitchPlayer from "./PitchPlayer.svelte";

/**
 * Pitch wrapper that places the two halves side-by-side on desktop
 * and stacked on mobile, with subtle SVG markings (centre circle,
 * penalty boxes, goals). The half opposite the active player turns
 * into the minute editor — see `MinuteEditor`. Awaiting-player modes
 * surface a centred hint text instead of opening the editor.
 *
 * @type {{
 *   homePlayers: Array<{ id: string, name: string, avatar_url?: string|null }>,
 *   awayPlayers: Array<{ id: string, name: string, avatar_url?: string|null }>,
 *   homeTeam?: { name: string, logo_url?: string|null }|null,
 *   awayTeam?: { name: string, logo_url?: string|null }|null,
 *   state: import('$lib/utils/liveMatchState.utils.js').LiveMatchState,
 *   saving?: boolean,
 *   gradientFor: (id: string) => string,
 *   onSelectPlayer: (playerId: string, side: "home"|"away") => void,
 *   onLongPressPlayer: (playerId: string, side: "home"|"away") => void,
 *   onMinuteChange: (minute: number) => void,
 *   onStoppageChange: (stoppage: number|null) => void,
 *   onGoalTypeClick: () => void,
 *   onCancel: () => void,
 *   onConfirm: () => void,
 * }}
 */
let {
	homePlayers,
	awayPlayers,
	homeTeam = null,
	awayTeam = null,
	state,
	saving = false,
	gradientFor,
	onSelectPlayer,
	onLongPressPlayer,
	onMinuteChange,
	onStoppageChange,
	onGoalTypeClick,
	onCancel,
	onConfirm,
} = $props();

const { t } = getTranslate();

const entryActive = $derived(isEntryMode(state.mode));
/** Side that hosts the editor — opposite of the active player. */
const editorSide = $derived(
	entryActive ? (state.playerSide === "home" ? "away" : "home") : null,
);

const eventKind = $derived(
	state.mode === MODE.GOAL_ENTRY
		? "goal"
		: state.mode === MODE.CARD_ENTRY
			? "card"
			: state.mode === MODE.PENALTY_MISS_ENTRY
				? "penalty_missed"
				: null,
);

const awaitingHint = $derived.by(() => {
	if (state.mode === MODE.CARD_AWAITING_PLAYER) {
		return state.pendingCardColor === "red"
			? $t("live_match.hint.card_red")
			: $t("live_match.hint.card_yellow");
	}
	if (state.mode === MODE.PENALTY_MISS_AWAITING_PLAYER) {
		return $t("live_match.hint.penalty_miss");
	}
	if (state.mode === MODE.PENALTY_MISS_AWAITING_KEEPER) {
		return $t("live_match.hint.penalty_keeper");
	}
	return null;
});

const glowColor = $derived(
	state.mode === MODE.CARD_AWAITING_PLAYER
		? state.pendingCardColor === "red"
			? "red"
			: "yellow"
		: state.mode === MODE.PENALTY_MISS_AWAITING_PLAYER ||
				state.mode === MODE.PENALTY_MISS_AWAITING_KEEPER
			? "orange"
			: null,
);

const borderClass = $derived(
	state.mode === MODE.CARD_AWAITING_PLAYER
		? state.pendingCardColor === "red"
			? "border-accent-red/60"
			: "border-warning/60"
		: state.mode === MODE.PENALTY_MISS_AWAITING_PLAYER ||
				state.mode === MODE.PENALTY_MISS_AWAITING_KEEPER
			? "border-warning/60"
			: "border-border",
);

function isPlayerScorer(id) {
	if (state.mode === MODE.PENALTY_MISS_AWAITING_KEEPER) {
		// During keeper selection the shooter stays visually flagged.
		return state.playerId === id;
	}
	return state.playerId === id && entryActive;
}
function isPlayerAssister(id) {
	return state.assisterId === id && state.mode === MODE.GOAL_ENTRY;
}
function isPlayerKeeper(id) {
	return state.keeperId === id && state.mode === MODE.PENALTY_MISS_ENTRY;
}
/** Dim players that are not legal targets in the current mode. Used
 *  for the missed-penalty keeper step: only the opposing team can
 *  catch, so the shooter's own teammates are disabled. */
function isPlayerDisabled(id, side) {
	if (state.mode === MODE.PENALTY_MISS_AWAITING_KEEPER) {
		// Same side as shooter → not allowed; shooter itself stays
		// highlighted but not tappable as keeper.
		return side === state.playerSide;
	}
	return false;
}
/** Highlight the other home/away teammate when a scorer is selected. */
function isPlayerAssistHint(id, side) {
	if (state.mode !== MODE.GOAL_ENTRY) return false;
	if (state.isOwnGoal) return false;
	if (side !== state.playerSide) return false;
	if (state.playerId === id) return false;
	if (state.assisterId) return false;
	return true;
}
</script>

{#snippet halfPlayers(players, side)}
	<!-- 3-col grid for consistent spacing:
	     1 player  → centre column,
	     2 players → outer columns,
	     3 players → all three. -->
	{@const slotCols = players.length === 1
		? ["2"]
		: players.length === 2
			? ["1", "3"]
			: players.length === 3
				? ["1", "2", "3"]
				: players.map((_, i) => String(i + 1))}
	<div class="relative z-10 grid grid-cols-3 items-center w-full px-2 sm:px-4">
		{#each players as p, i (p.id)}
			<div class="flex justify-center" style="grid-column-start: {slotCols[i] ?? '2'};">
				<PitchPlayer
					playerId={p.id}
					name={p.name}
					avatarUrl={p.avatar_url}
					gradient={gradientFor(p.id)}
					{side}
					isScorer={isPlayerScorer(p.id)}
					isAssister={isPlayerAssister(p.id)}
					isKeeper={isPlayerKeeper(p.id)}
					isOwnGoal={state.isOwnGoal && isPlayerScorer(p.id)}
					assistHint={isPlayerAssistHint(p.id, side)}
					awaitingTarget={glowColor !== null && !isPlayerDisabled(p.id, side)}
					disabled={isPlayerDisabled(p.id, side)}
					{glowColor}
					onSelect={() => onSelectPlayer(p.id, side)}
					onLongPress={() => onLongPressPlayer(p.id, side)}
				/>
			</div>
		{/each}
	</div>
{/snippet}

<div
	class="relative rounded-2xl border-2 {borderClass} overflow-hidden transition-colors"
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

	<!--
		Two halves, asymmetric when the editor is active so the avatar
		half stays visible without scrolling. Mobile vertical:
		- idle           → 1fr | 1fr
		- editor in home → 2fr | 1fr   (avatars below stay compact)
		- editor in away → 1fr | 2fr
		Desktop horizontal: always 50 / 50, the editor fits sideways.
	-->
	<!-- Both halves keep a strict 50/50 share even when the editor is
	     open. `overflow-hidden` on each half stops the editor from
	     spilling past the centre line. -->
	<div class="relative grid grid-cols-1 lg:grid-cols-2 grid-rows-2 lg:grid-rows-1 h-[460px] lg:h-[440px]">
		<!-- Home half -->
		<div
			class="relative flex flex-col items-center justify-center p-3 lg:p-4 min-h-0 overflow-hidden"
		>
			{#if homeTeam?.logo_url}
				<img
					src={homeTeam.logo_url}
					alt=""
					class="absolute inset-0 m-auto w-44 h-44 object-contain opacity-[0.08] pointer-events-none select-none"
					aria-hidden="true"
				/>
			{/if}
			<!-- Avatars always mount; only the editor overlay toggles, so
			     PitchPlayer instances keep their state and don't trigger
			     image reloads when the user closes the editor. -->
			<div class="w-full" class:invisible={editorSide === "home"}>
				{@render halfPlayers(homePlayers, "home")}
			</div>
			{#if editorSide === "home"}
				<div class="absolute inset-2 z-10 overflow-hidden rounded-xl bg-bg-card border border-border p-3 shadow-xl">
					<MinuteEditor
						minute={state.minute}
						stoppageMinutes={state.stoppageMinutes}
						goalType={state.goalType}
						previousEvents={state.events}
						eventKind={eventKind}
						cardColor={state.pendingCardColor}
						isOwnGoal={state.isOwnGoal}
						{saving}
						onMinuteChange={(m) => onMinuteChange(m)}
						onStoppageChange={(s) => onStoppageChange(s)}
						{onGoalTypeClick}
						{onCancel}
						{onConfirm}
					/>
				</div>
			{/if}
		</div>

		<!-- Center divider -->
		<div class="absolute inset-x-0 top-1/2 h-px bg-white/10 lg:hidden" aria-hidden="true"></div>
		<div class="hidden lg:block absolute inset-y-0 left-1/2 w-px bg-white/10" aria-hidden="true"></div>

		<!-- Away half -->
		<div
			class="relative flex flex-col items-center justify-center p-3 lg:p-4 min-h-0 overflow-hidden"
		>
			{#if awayTeam?.logo_url}
				<img
					src={awayTeam.logo_url}
					alt=""
					class="absolute inset-0 m-auto w-44 h-44 object-contain opacity-[0.08] pointer-events-none select-none"
					aria-hidden="true"
				/>
			{/if}
			<div class="w-full" class:invisible={editorSide === "away"}>
				{@render halfPlayers(awayPlayers, "away")}
			</div>
			{#if editorSide === "away"}
				<div class="absolute inset-2 z-10 overflow-hidden rounded-xl bg-bg-card border border-border p-3 shadow-xl">
					<MinuteEditor
						minute={state.minute}
						stoppageMinutes={state.stoppageMinutes}
						goalType={state.goalType}
						previousEvents={state.events}
						eventKind={eventKind}
						cardColor={state.pendingCardColor}
						isOwnGoal={state.isOwnGoal}
						{saving}
						onMinuteChange={(m) => onMinuteChange(m)}
						onStoppageChange={(s) => onStoppageChange(s)}
						{onGoalTypeClick}
						{onCancel}
						{onConfirm}
					/>
				</div>
			{/if}
		</div>
	</div>

	<!-- Awaiting-player hint -->
	{#if awaitingHint}
		<div class="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center pointer-events-none">
			<span class="bg-black/70 border border-border text-[11px] text-text-primary font-semibold px-3 py-1.5 rounded-full">
				{awaitingHint}
			</span>
		</div>
	{:else if state.mode === MODE.IDLE && state.events.length === 0}
		<div class="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center pointer-events-none">
			<span class="bg-black/50 border border-border/40 text-[10px] text-text-muted font-medium px-2.5 py-1 rounded-full">
				{$t("live_match.hint.idle")}
			</span>
		</div>
	{/if}
</div>
