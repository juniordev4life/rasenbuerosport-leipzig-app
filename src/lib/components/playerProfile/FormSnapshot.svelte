<script>
import { getTranslate } from "@tolgee/svelte";

/**
 * Recent-form pill row: last N match results (latest leftmost).
 * @type {{ recentForm: Array<{ result: "win"|"loss"|"draw" }> }}
 */
let { recentForm = [] } = $props();

const { t } = getTranslate();

function pillClass(result) {
	switch (result) {
		case "win":
			return "bg-success text-white";
		case "loss":
			return "bg-error text-white";
		default:
			return "bg-text-muted text-white";
	}
}

function pillLabel(result) {
	if (result === "win") return $t("player_profile.result_win");
	if (result === "loss") return $t("player_profile.result_loss");
	return $t("player_profile.result_draw");
}
</script>

{#if recentForm.length > 0}
	<div class="bg-bg-secondary border border-border rounded-2xl p-4">
		<h2 class="mb-3 text-sm font-semibold text-text-secondary uppercase tracking-wide">
			{$t("player_profile.recent_form")}
		</h2>
		<div class="flex flex-wrap gap-2">
			{#each recentForm as match, idx (idx)}
				<span
					class="flex h-8 w-8 items-center justify-center rounded-md text-xs font-bold {pillClass(
						match.result,
					)}"
					aria-label={pillLabel(match.result)}
				>
					{pillLabel(match.result)}
				</span>
			{/each}
		</div>
	</div>
{/if}
