<script>
import { getTranslate } from "@tolgee/svelte";
import { CARD_COLOR, MODE } from "$lib/constants/liveMatch.constants.js";

/**
 * Sticky bottom strip with the card toggle, missed-penalty button and
 * "Spiel beenden". Mirrors the mockup's two-row layout (event row +
 * end-match row) on every breakpoint.
 *
 * @type {{
 *   mode: string,
 *   pendingCardColor: string|null,
 *   ending?: boolean,
 *   onToggleCard: (color: string) => void,
 *   onTogglePenaltyMiss: () => void,
 *   onEndMatch: () => void,
 * }}
 */
let {
	mode,
	pendingCardColor,
	ending = false,
	onToggleCard,
	onTogglePenaltyMiss,
	onEndMatch,
} = $props();

const { t } = getTranslate();

const cardModeActive = $derived(mode === MODE.CARD_AWAITING_PLAYER);
const penaltyMissActive = $derived(mode === MODE.PENALTY_MISS_AWAITING_PLAYER);
const otherModeBlocking = $derived(
	mode !== MODE.IDLE && !cardModeActive && !penaltyMissActive,
);

const yellowActive = $derived(
	cardModeActive && pendingCardColor === CARD_COLOR.YELLOW,
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
				class="pill yellow"
				class:active={yellowActive}
				disabled={otherModeBlocking || penaltyMissActive}
				onclick={() => onToggleCard(CARD_COLOR.YELLOW)}
			>
				<span class="card-icon-yellow"></span>
				{$t("live_match.footer.yellow")}
			</button>
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
	transition: background-color 0.15s, border-color 0.15s, color 0.15s, transform 0.1s;
}
.pill:active:not(:disabled) { transform: scale(0.98); }
.pill:disabled { opacity: 0.4; cursor: not-allowed; }
.pill.yellow { border-color: rgba(245, 158, 11, 0.25); }
.pill.yellow.active {
	background: rgba(245, 158, 11, 0.16);
	border-color: rgba(245, 158, 11, 0.6);
	color: #F59E0B;
}
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
.card-icon-yellow {
	width: 11px;
	height: 14px;
	background: #F59E0B;
	border-radius: 2px;
	display: inline-block;
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
