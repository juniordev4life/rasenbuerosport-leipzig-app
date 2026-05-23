<script>
import { getTranslate } from "@tolgee/svelte";

/**
 * Split-bar comparison block. Each row has the player A value on the
 * left, label centered, player B value on the right, with a two-segment
 * bar beneath. The winning side is rendered in the player's accent
 * colour, the losing side in muted grey.
 *
 * For "lowerIsBetter" rows (red cards), the inversion is applied so the
 * smaller value wins the colour.
 *
 * @type {{
 *   rows: Array<{ label: string, valueA: number, valueB: number, format?: (n: number) => string, lowerIsBetter?: boolean }>,
 *   playerAName: string,
 *   playerBName: string,
 * }}
 */
let { rows = [], playerAName, playerBName } = $props();

const { t } = getTranslate();

const COLOR_A = "#F59E0B";
const COLOR_B = "#06B6D4";
const COLOR_MUTED = "#3F4759";

function fmt(row, value) {
	return row.format ? row.format(value ?? 0) : String(value ?? 0);
}

function widths(row) {
	const a = Number(row.valueA ?? 0);
	const b = Number(row.valueB ?? 0);
	const max = Math.max(Math.abs(a), Math.abs(b), 1);
	return {
		a: Math.round((Math.abs(a) / max) * 100),
		b: Math.round((Math.abs(b) / max) * 100),
	};
}

function winnerSide(row) {
	const a = Number(row.valueA ?? 0);
	const b = Number(row.valueB ?? 0);
	if (a === b) return null;
	const aBetter = row.lowerIsBetter ? a < b : a > b;
	return aBetter ? "a" : "b";
}
</script>

{#if rows.length > 0}
	<div class="section-card">
		<div class="section-header">
			<div class="section-label">⚖ {$t("compare.stat_section")}</div>
		</div>

		<div class="legend">
			<span class="legend-name" style="color: {COLOR_A};">{playerAName}</span>
			<span class="legend-name" style="color: {COLOR_B};">{playerBName}</span>
		</div>

		{#each rows as row, i (i)}
			{@const w = widths(row)}
			{@const winner = winnerSide(row)}
			<div class="row">
				<div class="row-header">
					<span class="val left" style="color: {winner === 'a' ? COLOR_A : '#6B7280'};">
						{fmt(row, row.valueA)}
					</span>
					<span class="label">{row.label}</span>
					<span class="val right" style="color: {winner === 'b' ? COLOR_B : '#6B7280'};">
						{fmt(row, row.valueB)}
					</span>
				</div>
				<div class="bars">
					<div class="bar bar-a">
						<div
							class="bar-fill bar-fill-a"
							style="width: {w.a}%; background: {winner === 'a' ? `linear-gradient(90deg, ${COLOR_A}, #D97706)` : COLOR_MUTED};"
						></div>
					</div>
					<div class="bar bar-b">
						<div
							class="bar-fill bar-fill-b"
							style="width: {w.b}%; background: {winner === 'b' ? `linear-gradient(270deg, ${COLOR_B}, #0891B2)` : COLOR_MUTED};"
						></div>
					</div>
				</div>
			</div>
		{/each}
	</div>
{/if}

<style>
.section-card {
	background: #131822;
	border: 1px solid #1F2937;
	border-radius: 14px;
	padding: 14px;
}
.section-header { margin-bottom: 8px; }
.section-label {
	font-size: 10px;
	text-transform: uppercase; letter-spacing: 0.1em;
	color: #6B7280;
	font-weight: 700;
}
.legend {
	display: flex; justify-content: space-between;
	font-size: 10px;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.08em;
	margin-bottom: 8px;
}
.row { margin-bottom: 12px; }
.row:last-child { margin-bottom: 0; }
.row-header {
	display: grid;
	grid-template-columns: 1fr auto 1fr;
	align-items: baseline;
	gap: 12px;
	margin-bottom: 6px;
}
.val {
	font-size: 16px;
	font-weight: 800;
	font-variant-numeric: tabular-nums;
}
.val.left { text-align: right; }
.val.right { text-align: left; }
.label {
	font-size: 10px;
	color: #9CA3AF;
	text-transform: uppercase;
	letter-spacing: 0.08em;
	font-weight: 700;
	white-space: nowrap;
}
.bars {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 4px;
}
.bar {
	height: 6px;
	background: rgba(255,255,255,0.04);
	border-radius: 3px;
	overflow: hidden;
	position: relative;
}
.bar-a { display: flex; justify-content: flex-end; }
.bar-b { display: flex; justify-content: flex-start; }
.bar-fill {
	height: 100%;
	border-radius: 3px;
	transition: width 0.4s ease;
}
</style>
