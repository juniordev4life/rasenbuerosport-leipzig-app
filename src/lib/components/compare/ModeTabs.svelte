<script>
import { getTranslate } from "@tolgee/svelte";

/**
 * Mode switch of the compare screen: Spieler (active) and Duos
 * (disabled, with a gold "Bald" chip — tapping it calls `onDuoTap`).
 * Two-line tabs on the shared `.seg` / `.seg-option-2` classes:
 * underline tabs in the text colour of the red hero in design A, a white
 * pill track with a navy active tab in B.
 *
 * @type {{
 *   value: "players"|"duos",
 *   onSelect: (next: "players"|"duos") => void,
 *   onDuoTap?: () => void,
 * }}
 */
let { value = "players", onSelect, onDuoTap = null } = $props();

const { t } = getTranslate();

function handleDuoClick() {
	if (onDuoTap) onDuoTap();
}
</script>

<div class="seg modes" role="tablist" aria-label={$t("compare.title")}>
	<button
		type="button"
		role="tab"
		class="seg-option seg-option-2"
		aria-selected={value === "players"}
		onclick={() => onSelect("players")}
	>
		<span class="seg-title">{$t("compare.mode_players")}</span>
		<span class="seg-sub">{$t("compare.mode_players_sub")}</span>
	</button>
	<button
		type="button"
		role="tab"
		class="seg-option seg-option-2 mode-soon"
		aria-selected={value === "duos"}
		aria-disabled="true"
		onclick={handleDuoClick}
	>
		<span class="seg-title">
			{$t("compare.mode_duos")}
			<span class="chip chip-gold soon">{$t("compare.coming_soon")}</span>
		</span>
		<span class="seg-sub">{$t("compare.mode_duos_sub")}</span>
	</button>
</div>

<style>
.mode-soon[aria-disabled="true"] {
	cursor: default;
}
</style>
