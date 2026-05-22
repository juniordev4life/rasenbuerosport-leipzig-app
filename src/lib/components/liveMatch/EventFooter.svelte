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

<div class="flex flex-col gap-2 rounded-2xl border border-border bg-bg-secondary p-3">
	<div class="flex gap-2">
		<div class="flex flex-1 rounded-xl border border-border bg-bg-input overflow-hidden">
			<button
				type="button"
				onclick={() => onToggleCard(CARD_COLOR.YELLOW)}
				disabled={otherModeBlocking || penaltyMissActive}
				class="flex-1 px-2 py-2.5 text-[12px] font-bold transition-colors {yellowActive ? 'bg-warning text-bg-primary' : 'text-text-secondary hover:text-text-primary'} disabled:opacity-40"
			>
				🟨 {$t("live_match.footer.yellow")}
			</button>
			<button
				type="button"
				onclick={() => onToggleCard(CARD_COLOR.RED)}
				disabled={otherModeBlocking || penaltyMissActive}
				class="flex-1 px-2 py-2.5 text-[12px] font-bold transition-colors {redActive ? 'bg-accent-red text-white' : 'text-text-secondary hover:text-text-primary'} disabled:opacity-40"
			>
				🟥 {$t("live_match.footer.red")}
			</button>
		</div>

		<button
			type="button"
			onclick={onTogglePenaltyMiss}
			disabled={otherModeBlocking || cardModeActive}
			class="rounded-xl border border-border px-3 py-2.5 text-[12px] font-semibold transition-colors {penaltyMissActive ? 'bg-warning/20 text-warning border-warning/50' : 'bg-bg-input text-text-secondary hover:text-text-primary'} disabled:opacity-40"
		>
			❌ {$t("live_match.footer.penalty_missed")}
		</button>
	</div>

	<button
		type="button"
		onclick={onEndMatch}
		disabled={ending}
		class="w-full rounded-xl border border-border bg-bg-input px-4 py-2.5 text-sm font-semibold text-text-secondary hover:bg-bg-card disabled:opacity-50"
	>
		{ending ? $t("common.loading") : `${$t("live_match.footer.end_match")} →`}
	</button>
</div>
