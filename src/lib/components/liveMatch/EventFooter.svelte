<script>
import { getTranslate } from "@tolgee/svelte";
import { CARD_COLOR, MODE } from "$lib/constants/liveMatch.constants.js";

/**
 * Action strip under the live pitch: the red-card toggle, the
 * missed-penalty toggle, the "Start penalty shootout" action and the
 * "Spiel beenden" button. The two toggles report their state through
 * `aria-pressed` and turn solid red while armed.
 *
 * Yellow cards used to live here too but were dropped — the volume in
 * a real match was too high to track manually, and they barely move
 * the needle statistically. Red cards stay because they're rarer and
 * carry an ELO consequence.
 *
 * The 11m button wears a static pale-gold highlight (no pulse) to flag
 * it as a special action without screaming at every match.
 * It only fires `onStartPenaltyShootout` — the destination route is
 * the parent's responsibility.
 *
 * @type {{
 *   mode: string,
 *   pendingCardColor: string|null,
 *   ending?: boolean,
 *   onToggleCard: (color: string) => void,
 *   onTogglePenaltyMiss: () => void,
 *   onStartPenaltyShootout: () => void,
 *   onEndMatch: () => void,
 * }}
 */
let {
	mode,
	pendingCardColor,
	ending = false,
	onToggleCard,
	onTogglePenaltyMiss,
	onStartPenaltyShootout,
	onEndMatch,
} = $props();

const { t } = getTranslate();

const cardModeActive = $derived(mode === MODE.CARD_AWAITING_PLAYER);
const penaltyMissActive = $derived(mode === MODE.PENALTY_MISS_AWAITING_PLAYER);
const otherModeBlocking = $derived(
	mode !== MODE.IDLE && !cardModeActive && !penaltyMissActive,
);

const redActive = $derived(
	cardModeActive && pendingCardColor === CARD_COLOR.RED,
);
</script>

<div class="event-footer">
	<div class="action-row">
		<button
			type="button"
			class="act red"
			aria-pressed={redActive}
			disabled={otherModeBlocking || penaltyMissActive}
			onclick={() => onToggleCard(CARD_COLOR.RED)}
		>
			<span class="card-icon" aria-hidden="true"></span>
			{$t("live_match.footer.red")}
		</button>
		<button
			type="button"
			class="act miss"
			aria-pressed={penaltyMissActive}
			disabled={otherModeBlocking || cardModeActive}
			onclick={onTogglePenaltyMiss}
		>
			<svg
				class="miss-icon"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2.6"
				stroke-linecap="round"
				stroke-linejoin="round"
				width="12"
				height="12"
				aria-hidden="true"
			>
				<line x1="18" y1="6" x2="6" y2="18" />
				<line x1="6" y1="6" x2="18" y2="18" />
			</svg>
			{$t("live_match.footer.penalty_missed")}
		</button>
		<button
			type="button"
			class="act shootout"
			disabled={otherModeBlocking}
			onclick={onStartPenaltyShootout}
			aria-label={$t("live_match.footer.penalty_shootout_aria")}
		>
			<svg viewBox="0 0 14 14" width="14" height="14" aria-hidden="true">
				<circle cx="7" cy="7" r="5.5" fill="none" stroke="currentColor" stroke-width="1.8" />
				<circle cx="7" cy="7" r="2" fill="currentColor" />
			</svg>
			{$t("live_match.footer.penalty_shootout")}
		</button>
	</div>

	<button
		type="button"
		class="btn btn-lg btn-confirm w-full end"
		disabled={ending}
		onclick={onEndMatch}
	>
		{#if ending}
			<span class="spinner spinner-sm end-spinner" aria-hidden="true"></span>
		{:else}
			<svg
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2.5"
				stroke-linecap="round"
				stroke-linejoin="round"
				width="16"
				height="16"
				aria-hidden="true"
			>
				<polyline points="20 6 9 17 4 12" />
			</svg>
		{/if}
		<span>{$t("live_match.footer.end_match")}</span>
	</button>
</div>

<style>
.event-footer {
	display: flex;
	flex-direction: column;
	gap: 10px;
}

.action-row {
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 8px;
}

/* A: navy-outlined pills on grey, like .btn-secondary. B: sunken pills
 * inside the white controls card. */
.act {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 7px;
	min-height: 44px;
	padding: 0 8px;
	border: 0;
	border-radius: var(--radius-control);
	background: var(--color-sunken);
	color: var(--color-ink);
	box-shadow: inset 0 0 0 1px var(--color-navy);
	font-family: var(--font-sans);
	font-weight: 700;
	font-size: 14px;
	white-space: nowrap;
	cursor: pointer;
	transition:
		background-color 120ms,
		color 120ms,
		transform 120ms;
}

.act:hover:not(:disabled) {
	background: var(--color-surface);
}

.act:active:not(:disabled) {
	transform: scale(0.98);
}

.act:disabled {
	cursor: not-allowed;
	box-shadow: none;
	background: var(--color-line);
	color: var(--color-muted);
}

/* Armed toggle: solid red with white text and icon. */
.act[aria-pressed="true"] {
	background: var(--color-brand);
	color: var(--color-on-brand);
	box-shadow: none;
}

.card-icon {
	display: inline-block;
	flex-shrink: 0;
	width: 10px;
	height: 14px;
	border-radius: 2px;
	background: var(--color-brand);
}

.act[aria-pressed="true"] .card-icon {
	background: var(--color-on-brand);
}

.miss-icon {
	color: var(--color-brand);
}

.act[aria-pressed="true"] .miss-icon,
.act:disabled .miss-icon {
	color: currentColor;
}

.act:disabled .card-icon {
	opacity: 0.5;
}

/* 11m: a special action, not a toggle — pale gold with a gold rim. */
.act.shootout:not(:disabled) {
	background: var(--color-gold-soft);
	box-shadow: inset 0 0 0 2px var(--color-gold);
}

.act.shootout:hover:not(:disabled) {
	background: var(--color-gold);
	color: var(--color-on-gold);
}

/* "Spiel beenden" uses .btn-confirm (red in A, green in B). */
.end:disabled {
	cursor: wait;
}

.end-spinner {
	--spinner-color: currentColor;
}

:global([data-variant="b"]) .act {
	box-shadow: none;
}

:global([data-variant="b"]) .act.shootout:not(:disabled) {
	box-shadow: inset 0 0 0 2px var(--color-gold);
}

</style>
