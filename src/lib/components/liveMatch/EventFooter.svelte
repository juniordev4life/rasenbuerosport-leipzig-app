<script>
import { getTranslate } from "@tolgee/svelte";
import { CARD_COLOR, MODE } from "$lib/constants/liveMatch.constants.js";

/**
 * Sticky bottom strip with the red-card toggle, missed-penalty toggle,
 * a "Start penalty shootout" CTA and the "Spiel beenden" primary button.
 *
 * Yellow cards used to live here too but were dropped — the volume in
 * a real match was too high to track manually, and they barely move
 * the needle statistically. Red cards stay because they're rarer and
 * carry an ELO consequence.
 *
 * The 11m button is highlighted with a static golden glow (no pulse)
 * to flag it as a special action without screaming at every match.
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
	<div class="action-card">
		<div class="action-row">
			<button
				type="button"
				class="pill red"
				class:active={redActive}
				disabled={otherModeBlocking || penaltyMissActive}
				onclick={() => onToggleCard(CARD_COLOR.RED)}
			>
				<span class="card-icon-red"></span>
				{$t("live_match.footer.red")}
			</button>
			<button
				type="button"
				class="pill miss"
				class:active={penaltyMissActive}
				disabled={otherModeBlocking || cardModeActive}
				onclick={onTogglePenaltyMiss}
			>
				<svg
					viewBox="0 0 24 24"
					fill="none"
					stroke="#E24B4A"
					stroke-width="2.5"
					stroke-linecap="round"
					stroke-linejoin="round"
					width="11"
					height="11"
					aria-hidden="true"
				>
					<line x1="18" y1="6" x2="6" y2="18" />
					<line x1="6" y1="6" x2="18" y2="18" />
				</svg>
				{$t("live_match.footer.penalty_missed")}
			</button>
			<button
				type="button"
				class="pill penalty-shootout"
				disabled={otherModeBlocking}
				onclick={onStartPenaltyShootout}
				aria-label={$t("live_match.footer.penalty_shootout_aria")}
			>
				<span class="pill-glow" aria-hidden="true"></span>
				<svg
					viewBox="0 0 24 24"
					fill="none"
					stroke="#FBBF24"
					stroke-width="2.5"
					stroke-linecap="round"
					stroke-linejoin="round"
					width="11"
					height="11"
					aria-hidden="true"
				>
					<circle cx="12" cy="12" r="9" />
					<circle cx="12" cy="12" r="1.4" fill="#FBBF24" />
				</svg>
				{$t("live_match.footer.penalty_shootout")}
			</button>
		</div>
	</div>

	<button
		type="button"
		class="primary-btn success"
		disabled={ending}
		onclick={onEndMatch}
	>
		{#if ending}
			<span class="spinner"></span>
		{:else}
			<svg
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2.5"
				stroke-linecap="round"
				stroke-linejoin="round"
				width="14"
				height="14"
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
	gap: 8px;
}
.action-card {
	background: #131822;
	border: 1px solid #1F2937;
	border-radius: 14px;
	padding: 10px;
}
.action-row {
	display: flex;
	gap: 6px;
}
.pill {
	flex: 1;
	background: rgba(0, 0, 0, 0.25);
	border: 1px solid rgba(255, 255, 255, 0.06);
	border-radius: 10px;
	padding: 9px 8px;
	font-size: 11px;
	font-weight: 700;
	color: #D1D5DB;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 5px;
	position: relative;
	overflow: hidden;
	transition: background-color 0.15s, border-color 0.15s, color 0.15s, transform 0.1s;
}
.pill:active:not(:disabled) { transform: scale(0.98); }
.pill:disabled { opacity: 0.4; cursor: not-allowed; }
.pill.red { border-color: rgba(226, 75, 74, 0.25); }
.pill.red.active {
	background: rgba(226, 75, 74, 0.16);
	border-color: rgba(226, 75, 74, 0.6);
	color: #E24B4A;
}
.pill.miss { border-color: rgba(255, 255, 255, 0.08); }
.pill.miss.active {
	background: rgba(226, 75, 74, 0.12);
	border-color: rgba(226, 75, 74, 0.45);
	color: #E24B4A;
}

/* Penalty-shootout pill: static gold glow (no pulse). Visually marks
   the button as a "special" action without nagging the user every
   match — most matches never reach a shootout. */
.pill.penalty-shootout {
	border-color: rgba(245, 158, 11, 0.32);
	color: #FBBF24;
}
.pill.penalty-shootout .pill-glow {
	position: absolute;
	inset: 0;
	pointer-events: none;
	background: radial-gradient(
		ellipse at top,
		rgba(245, 158, 11, 0.22) 0%,
		transparent 70%
	);
}
.pill.penalty-shootout:hover:not(:disabled) {
	border-color: rgba(245, 158, 11, 0.55);
	background: rgba(245, 158, 11, 0.08);
}

.card-icon-red {
	width: 11px;
	height: 14px;
	background: #E24B4A;
	border-radius: 2px;
	display: inline-block;
}
.primary-btn {
	width: 100%;
	border: 0;
	border-radius: 12px;
	padding: 14px;
	font-size: 14px;
	font-weight: 800;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	color: white;
	transition: transform 0.15s, opacity 0.15s;
}
.primary-btn.success {
	background: linear-gradient(135deg, #84CC16, #65A30D);
	box-shadow: 0 6px 18px rgba(132, 204, 22, 0.4);
}
.primary-btn:disabled { opacity: 0.6; cursor: wait; }
.primary-btn:not(:disabled):hover { transform: translateY(-1px); }
.spinner {
	width: 14px;
	height: 14px;
	border: 2px solid currentColor;
	border-right-color: transparent;
	border-radius: 50%;
	animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
