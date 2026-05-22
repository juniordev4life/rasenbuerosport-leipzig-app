<script>
import { getTranslate } from "@tolgee/svelte";
import { GOAL_TYPE } from "$lib/constants/liveMatch.constants.js";

/**
 * 2×2 modal letting the user pick how a goal was scored. Default is
 * "Spiel" (open play) — the user only opens this dialog when they need
 * to flag a corner / free-kick / penalty goal.
 *
 * @type {{ onPick: (goalType: string) => void, onClose: () => void }}
 */
let { onPick, onClose } = $props();

const { t } = getTranslate();

const OPTIONS = [
	{ key: GOAL_TYPE.OPEN_PLAY, icon: "⚽", labelKey: "new_game.goal_type_play" },
	{ key: GOAL_TYPE.CORNER, icon: "🚩", labelKey: "new_game.goal_type_corner" },
	{
		key: GOAL_TYPE.FREEKICK,
		icon: "🎯",
		labelKey: "new_game.goal_type_freekick",
	},
	{
		key: GOAL_TYPE.PENALTY,
		icon: "🥅",
		labelKey: "new_game.goal_type_penalty",
	},
];
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
			{#each OPTIONS as opt (opt.key)}
				<button
					type="button"
					onclick={() => onPick(opt.key)}
					class="flex flex-col items-center gap-2 rounded-xl border border-border bg-bg-input px-3 py-4 hover:bg-bg-card"
				>
					<span class="text-2xl" aria-hidden="true">{opt.icon}</span>
					<span class="text-sm font-semibold">{$t(opt.labelKey)}</span>
				</button>
			{/each}
		</div>
		<button
			type="button"
			onclick={onClose}
			class="mt-4 w-full py-2.5 rounded-xl bg-bg-input text-sm text-text-secondary"
		>
			{$t("new_game.back")}
		</button>
	</div>
</div>
