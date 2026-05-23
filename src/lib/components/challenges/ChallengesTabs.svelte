<script>
/**
 * Aktiv / Verlauf tab switcher styled as a red gradient pill matching
 * the Compare / Rangliste sub-switches.
 *
 * @type {{
 *   value: "active"|"history",
 *   onChange: (next: "active"|"history") => void,
 *   activeLabel: string,
 *   historyLabel: string,
 * }}
 */
let { value, onChange, activeLabel, historyLabel } = $props();
</script>

<div class="tabs">
	<button
		type="button"
		class="tab"
		class:active={value === "active"}
		onclick={() => onChange("active")}
	>{activeLabel}</button>
	<button
		type="button"
		class="tab"
		class:active={value === "history"}
		onclick={() => onChange("history")}
	>{historyLabel}</button>
</div>

<style>
.tabs {
	display: flex;
	background: #131822;
	border: 1px solid #1F2937;
	border-radius: 12px;
	padding: 4px;
	gap: 2px;
}
.tab {
	flex: 1;
	padding: 9px 10px;
	border: 0;
	background: transparent;
	border-radius: 9px;
	font-size: 12px;
	font-weight: 700;
	color: #9CA3AF;
	cursor: pointer;
	transition: background-color .15s, color .15s;
}
.tab.active {
	background: linear-gradient(135deg, #E24B4A, #C73E3D);
	color: white;
	box-shadow: 0 2px 8px rgba(226, 75, 74, 0.3);
}
</style>
