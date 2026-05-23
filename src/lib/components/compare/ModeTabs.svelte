<script>
import { getTranslate } from "@tolgee/svelte";

/**
 * Mode switch for the compare selection screen: Spieler (active) vs.
 * Duos (disabled with a "Soon"-ribbon, mirrors the Liga tile on the
 * Rangliste).
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

<div class="mode-tabs">
	<button
		type="button"
		class="mode-tab {value === 'players' ? 'active' : ''}"
		onclick={() => onSelect("players")}
	>
		<div class="mode-tab-title">{$t("compare.mode_players")}</div>
		<div class="mode-tab-sub">{$t("compare.mode_players_sub")}</div>
	</button>
	<button
		type="button"
		class="mode-tab disabled"
		aria-disabled="true"
		onclick={handleDuoClick}
	>
		<div class="mode-tab-ribbon">{$t("compare.coming_soon")}</div>
		<div class="mode-tab-title">{$t("compare.mode_duos")}</div>
		<div class="mode-tab-sub">{$t("compare.mode_duos_sub")}</div>
	</button>
</div>

<style>
.mode-tabs {
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
	background: linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(6, 182, 212, 0.08));
	border-color: rgba(245, 158, 11, 0.4);
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
