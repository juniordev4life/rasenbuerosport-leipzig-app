<script>
import { getTranslate } from "@tolgee/svelte";

/**
 * Two pill-style toggles below the primary mode switch:
 *  - team size (2v2 vs 1v1)
 *  - sort axis (current ELO vs form delta over the recent window)
 *
 * The component is fully controlled — callers own state, which makes
 * URL synchronisation straightforward on the page level.
 *
 * @type {{
 *   teamSize: "2v2"|"1v1",
 *   sort: "current"|"form",
 *   onTeamSize: (next: "2v2"|"1v1") => void,
 *   onSort: (next: "current"|"form") => void,
 * }}
 */
let { teamSize, sort, onTeamSize, onSort } = $props();

const { t } = getTranslate();
</script>

<div class="sub-switches">
	<div class="sub-switch" role="tablist" aria-label={$t("leaderboard.team_size")}>
		<button
			type="button"
			class="sub-switch-btn {teamSize === '2v2' ? 'active' : ''}"
			onclick={() => onTeamSize("2v2")}
		>{$t("leaderboard.mode_2v2")}</button>
		<button
			type="button"
			class="sub-switch-btn {teamSize === '1v1' ? 'active' : ''}"
			onclick={() => onTeamSize("1v1")}
		>{$t("leaderboard.mode_1v1")}</button>
	</div>
	<div class="sub-switch" role="tablist" aria-label={$t("leaderboard.sort")}>
		<button
			type="button"
			class="sub-switch-btn {sort === 'current' ? 'active' : ''}"
			onclick={() => onSort("current")}
		>{$t("leaderboard.sort_current")}</button>
		<button
			type="button"
			class="sub-switch-btn {sort === 'form' ? 'active' : ''}"
			onclick={() => onSort("form")}
		>{$t("leaderboard.sort_form")}</button>
	</div>
</div>

<style>
.sub-switches {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 8px;
}
.sub-switch {
	display: flex;
	background: #0F1419;
	border: 1px solid #1F2937;
	border-radius: 999px;
	padding: 3px;
	gap: 2px;
}
.sub-switch-btn {
	flex: 1;
	padding: 6px 0;
	border: 0;
	background: transparent;
	color: #9CA3AF;
	font-size: 12px;
	font-weight: 700;
	border-radius: 999px;
	cursor: pointer;
	transition: background-color .15s, color .15s;
}
.sub-switch-btn.active {
	background: linear-gradient(135deg, #E24B4A, #C73E3D);
	color: #FFFFFF;
	box-shadow: 0 2px 6px rgba(226, 75, 74, 0.35);
}
</style>
