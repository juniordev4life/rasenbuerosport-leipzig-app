<script>
import { getTranslate } from "@tolgee/svelte";
import SpiderChart from "$lib/components/charts/SpiderChart.svelte";

/**
 * Overlay spider chart for the H2H view. Renders both players in the
 * same hexagon — Player A in orange, Player B in cyan, each with a
 * transparent fill so the overlap is readable.
 *
 * @type {{
 *   axesA: { finisher:number, playmaker:number, clutch:number, consistency:number, discipline:number, winner:number }|null,
 *   axesB: { finisher:number, playmaker:number, clutch:number, consistency:number, discipline:number, winner:number }|null,
 *   playerAName: string,
 *   playerBName: string,
 * }}
 */
let { axesA, axesB, playerAName, playerBName } = $props();

const { t } = getTranslate();

const AXIS_KEYS = [
	"finisher",
	"playmaker",
	"clutch",
	"consistency",
	"discipline",
	"winner",
];

const labels = $derived(AXIS_KEYS.map((k) => $t(`player_profile.axes.${k}`)));

const valuesA = $derived(AXIS_KEYS.map((k) => axesA?.[k] ?? 0));
const valuesB = $derived(AXIS_KEYS.map((k) => axesB?.[k] ?? 0));

const datasets = $derived([
	{
		id: "playerA",
		label: playerAName,
		values: valuesA,
		strokeColor: "#F59E0B",
		fillColor: "rgba(245, 158, 11, 0.22)",
	},
	{
		id: "playerB",
		label: playerBName,
		values: valuesB,
		strokeColor: "#06B6D4",
		fillColor: "rgba(6, 182, 212, 0.22)",
	},
]);

const hasData = $derived(axesA || axesB);
</script>

{#if hasData}
	<div class="section-card">
		<div class="section-header">
			<div class="section-label">{"\u{1F3AF}"} {$t("compare.character_section")}</div>
		</div>

		<div class="spider-wrap">
			<SpiderChart axes={labels} {datasets} />
		</div>

		<div class="legend">
			<div class="legend-item">
				<div class="swatch a"></div>
				<span>{playerAName}</span>
			</div>
			<div class="legend-item">
				<div class="swatch b"></div>
				<span>{playerBName}</span>
			</div>
		</div>
	</div>
{/if}

<style>
.section-card {
	background: #131822;
	border: 1px solid #1F2937;
	border-radius: 14px;
	padding: 14px;
}
.section-header { margin-bottom: 10px; }
.section-label {
	font-size: 10px;
	text-transform: uppercase; letter-spacing: 0.1em;
	color: #6B7280;
	font-weight: 700;
}
.spider-wrap {
	position: relative;
	width: 100%;
	aspect-ratio: 1;
	max-width: 320px;
	margin: 0 auto;
}
.legend {
	display: flex; justify-content: center; gap: 18px;
	margin-top: 10px;
	padding-top: 10px;
	border-top: 1px solid #1F2937;
}
.legend-item {
	display: flex; align-items: center; gap: 6px;
	font-size: 11px;
	color: #9CA3AF;
}
.swatch {
	width: 16px; height: 4px;
	border-radius: 2px;
}
.swatch.a { background: #F59E0B; }
.swatch.b { background: #06B6D4; }
</style>
