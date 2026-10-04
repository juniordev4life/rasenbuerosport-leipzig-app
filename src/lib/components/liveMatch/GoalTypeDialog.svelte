<script>
import { getTranslate } from "@tolgee/svelte";
import Sheet from "$lib/components/ui/Sheet.svelte";
import { GOAL_TYPE } from "$lib/constants/liveMatch.constants.js";

/**
 * 2×2 sheet letting the user pick how a goal was scored. Default is
 * "Spiel" (open play) — the user only opens this dialog when they need
 * to flag a corner / free-kick / penalty goal. Each option pairs a line
 * icon with its label.
 *
 * @type {{ onPick: (goalType: string) => void, onClose: () => void }}
 */
let { onPick, onClose } = $props();

const { t } = getTranslate();
</script>

<Sheet title={$t("new_game.goal_type_title")} {onClose} size="sm">
	<div class="grid grid-cols-2 gap-2.5">
		<button type="button" onclick={() => onPick(GOAL_TYPE.OPEN_PLAY)} class="goal-option">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="24" height="24" aria-hidden="true">
				<circle cx="12" cy="12" r="9" />
				<path d="M12 3v18M3 12h18M5.5 5.5l13 13M18.5 5.5l-13 13" />
			</svg>
			<span>{$t("new_game.goal_type_play")}</span>
		</button>

		<button type="button" onclick={() => onPick(GOAL_TYPE.CORNER)} class="goal-option">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="24" height="24" aria-hidden="true">
				<line x1="6" y1="21" x2="6" y2="3" />
				<path d="M6 3h13l-4 5 4 5H6" />
			</svg>
			<span>{$t("new_game.goal_type_corner")}</span>
		</button>

		<button type="button" onclick={() => onPick(GOAL_TYPE.FREEKICK)} class="goal-option">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="24" height="24" aria-hidden="true">
				<circle cx="12" cy="12" r="9" />
				<circle cx="12" cy="12" r="5" />
				<circle cx="12" cy="12" r="1.5" fill="currentColor" />
			</svg>
			<span>{$t("new_game.goal_type_freekick")}</span>
		</button>

		<button type="button" onclick={() => onPick(GOAL_TYPE.PENALTY)} class="goal-option">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="24" height="24" aria-hidden="true">
				<rect x="3" y="6" width="18" height="12" rx="1" />
				<line x1="3" y1="10" x2="21" y2="10" />
				<line x1="7" y1="6" x2="7" y2="18" />
				<line x1="12" y1="6" x2="12" y2="18" />
				<line x1="17" y1="6" x2="17" y2="18" />
			</svg>
			<span>{$t("new_game.goal_type_penalty")}</span>
		</button>
	</div>

	<button type="button" onclick={onClose} class="btn btn-secondary w-full mt-4">
		{$t("new_game.back")}
	</button>
</Sheet>

<style>
.goal-option {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 8px;
	min-height: 92px;
	padding: 14px 12px;
	border: 1px solid var(--color-line);
	border-radius: var(--radius-tile);
	background: var(--color-sunken);
	color: var(--color-ink);
	font-size: 14px;
	font-weight: 700;
	cursor: pointer;
	transition:
		background-color 120ms,
		border-color 120ms,
		transform 120ms;
}

.goal-option svg {
	color: var(--color-brand);
}

.goal-option:hover {
	background: var(--color-surface);
	border-color: var(--color-navy);
}

.goal-option:active {
	transform: scale(0.98);
}
</style>
