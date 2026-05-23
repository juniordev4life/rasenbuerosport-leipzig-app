<script>
import { getTranslate } from "@tolgee/svelte";
import { GOAL_TYPE } from "$lib/constants/liveMatch.constants.js";

/**
 * 2×2 modal letting the user pick how a goal was scored. Default is
 * "Spiel" (open play) — the user only opens this dialog when they need
 * to flag a corner / free-kick / penalty goal. Each option uses a
 * dedicated SVG icon matching the new-game design language.
 *
 * @type {{ onPick: (goalType: string) => void, onClose: () => void }}
 */
let { onPick, onClose } = $props();

const { t } = getTranslate();
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
	onclick={onClose}
	role="dialog"
	aria-modal="true"
>
	<div
		class="bg-bg-secondary border border-border rounded-2xl w-full max-w-sm p-5"
		onclick={(e) => e.stopPropagation()}
	>
		<h3 class="text-base font-bold text-center mb-4">{$t("new_game.goal_type_title")}</h3>
		<div class="grid grid-cols-2 gap-2.5">
			<button type="button" onclick={() => onPick(GOAL_TYPE.OPEN_PLAY)} class="goal-option">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="22" height="22" aria-hidden="true">
					<circle cx="12" cy="12" r="9" />
					<path d="M12 3v18M3 12h18M5.5 5.5l13 13M18.5 5.5l-13 13" />
				</svg>
				<span>{$t("new_game.goal_type_play")}</span>
			</button>

			<button type="button" onclick={() => onPick(GOAL_TYPE.CORNER)} class="goal-option">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="22" height="22" aria-hidden="true">
					<line x1="6" y1="21" x2="6" y2="3" />
					<path d="M6 3h13l-4 5 4 5H6" />
				</svg>
				<span>{$t("new_game.goal_type_corner")}</span>
			</button>

			<button type="button" onclick={() => onPick(GOAL_TYPE.FREEKICK)} class="goal-option">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="22" height="22" aria-hidden="true">
					<circle cx="12" cy="12" r="9" />
					<circle cx="12" cy="12" r="5" />
					<circle cx="12" cy="12" r="1.5" fill="currentColor" />
				</svg>
				<span>{$t("new_game.goal_type_freekick")}</span>
			</button>

			<button type="button" onclick={() => onPick(GOAL_TYPE.PENALTY)} class="goal-option">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="22" height="22" aria-hidden="true">
					<rect x="3" y="6" width="18" height="12" rx="1" />
					<line x1="3" y1="10" x2="21" y2="10" />
					<line x1="7" y1="6" x2="7" y2="18" />
					<line x1="12" y1="6" x2="12" y2="18" />
					<line x1="17" y1="6" x2="17" y2="18" />
				</svg>
				<span>{$t("new_game.goal_type_penalty")}</span>
			</button>
		</div>
		<button
			type="button"
			onclick={onClose}
			class="mt-4 w-full py-2.5 rounded-xl bg-bg-input text-sm text-text-secondary hover:bg-bg-card"
		>
			{$t("new_game.back")}
		</button>
	</div>
</div>

<style>
.goal-option {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8px;
	border-radius: 12px;
	border: 1px solid #1F2937;
	background: rgba(0, 0, 0, 0.25);
	padding: 14px 12px;
	color: #D1D5DB;
	font-size: 13px;
	font-weight: 700;
	cursor: pointer;
	transition: background-color 0.15s, border-color 0.15s, color 0.15s, transform 0.1s;
}
.goal-option:hover {
	background: rgba(255, 255, 255, 0.04);
	border-color: rgba(226, 75, 74, 0.35);
	color: #FFFFFF;
}
.goal-option:active { transform: scale(0.98); }
</style>
