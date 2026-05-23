<script>
import { getTranslate } from "@tolgee/svelte";

/**
 * Primary top-level mode switch: Skill-Rating (ELO) vs Liga
 * (season-table, "Bald" / coming soon). The Liga tile is rendered
 * disabled with a ribbon — clicks are ignored until the season layer
 * ships.
 *
 * @type {{
 *   value: "skill"|"league",
 *   onChange: (next: "skill"|"league") => void,
 * }}
 */
let { value = "skill", onChange } = $props();

const { t } = getTranslate();
</script>

<div class="mode-switch">
	<button
		type="button"
		class="mode-tab {value === 'skill' ? 'active' : ''}"
		onclick={() => onChange("skill")}
	>
		<div class="mode-tab-title">{$t("leaderboard.mode_skill")}</div>
		<div class="mode-tab-sub">{$t("leaderboard.mode_skill_sub")}</div>
	</button>
	<button
		type="button"
		class="mode-tab disabled"
		aria-disabled="true"
		tabindex="-1"
	>
		<div class="mode-tab-ribbon">{$t("leaderboard.coming_soon")}</div>
		<div class="mode-tab-title">{$t("leaderboard.mode_league")}</div>
		<div class="mode-tab-sub">{$t("leaderboard.mode_league_sub")}</div>
	</button>
</div>

<style>
.mode-switch {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 8px;
}
.mode-tab {
	background: #131822;
	border: 1px solid #1F2937;
	border-radius: 14px;
	padding: 10px 12px;
	text-align: left;
	color: #9CA3AF;
	position: relative;
	overflow: hidden;
	cursor: pointer;
	transition: background-color .15s, border-color .15s, color .15s;
}
.mode-tab.active {
	background: linear-gradient(135deg, rgba(226, 75, 74, 0.12), rgba(132, 204, 22, 0.08));
	border-color: rgba(226, 75, 74, 0.4);
	color: #FFFFFF;
}
.mode-tab.disabled {
	opacity: 0.55;
	cursor: not-allowed;
}
.mode-tab-title {
	font-size: 13px;
	font-weight: 800;
	letter-spacing: -0.01em;
}
.mode-tab-sub {
	font-size: 10px;
	color: #6B7280;
	margin-top: 2px;
}
.mode-tab-ribbon {
	position: absolute;
	top: 6px; right: -24px;
	background: linear-gradient(135deg, #F59E0B, #D97706);
	color: white;
	font-size: 8px;
	font-weight: 800;
	padding: 1px 26px;
	text-transform: uppercase;
	letter-spacing: 0.1em;
	transform: rotate(30deg);
}
</style>
