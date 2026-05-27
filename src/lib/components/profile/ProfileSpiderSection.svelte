<script>
import { getTranslate } from "@tolgee/svelte";
import SpiderChart from "$lib/components/charts/SpiderChart.svelte";
import TargetIcon from "$lib/components/icons/TargetIcon.svelte";
import { generatePlayerTags } from "$lib/utils/profileTags.utils.js";
import TagsList from "./TagsList.svelte";

/**
 * Spider-chart section: the SVG radar with the league overlay, a
 * legend and the auto-generated tag groups beneath it.
 *
 * @type {{
 *   axes: { finisher:number, playmaker:number, clutch:number, consistency:number, discipline:number, winner:number }|null,
 *   leagueAverages?: number[]|null,
 *   playerName: string,
 *   locale?: "de"|"en",
 *   onAxisClick?: (key: string) => void,
 * }}
 */
let {
	axes,
	leagueAverages = null,
	playerName,
	locale = "de",
	onAxisClick = null,
} = $props();

const { t } = getTranslate();

const axisOrder = [
	"finisher",
	"playmaker",
	"clutch",
	"consistency",
	"discipline",
	"winner",
];

/**
 * Inline-SVG children for each spider axis, drawn against a `0 0 24 24`
 * coordinate box. Replaces the truncated text labels with universally
 * understandable icons and acts as a stronger tap-target hint. The
 * label text remains available as `aria-label` on the marker group
 * for screen-reader users.
 *
 * Style notes: paths are stroke-only (`fill="none"`) so the chart's
 * existing `.axis-icon` rule colours them via the global `stroke`
 * property — no per-icon `fill` overrides needed.
 */
const AXIS_ICONS = {
	// Vollstrecker — crosshair / target (finishing)
	finisher: `
		<circle cx="12" cy="12" r="9" fill="none"/>
		<circle cx="12" cy="12" r="4" fill="none"/>
		<line x1="12" y1="1" x2="12" y2="5"/>
		<line x1="12" y1="19" x2="12" y2="23"/>
		<line x1="1" y1="12" x2="5" y2="12"/>
		<line x1="19" y1="12" x2="23" y2="12"/>
	`,
	// Vorbereiter — arrow / pass setup
	playmaker: `
		<line x1="3" y1="12" x2="19" y2="12"/>
		<polyline points="12 5 19 12 12 19"/>
	`,
	// Schlussphase — clock (late-game minutes)
	clutch: `
		<circle cx="12" cy="12" r="10" fill="none"/>
		<polyline points="12 6 12 12 16 14"/>
	`,
	// Konstanz — flat-ish sparkline (low variance)
	consistency: `
		<polyline points="3 16 8 11 12 14 16 8 21 12"/>
	`,
	// Disziplin — shield (fair play)
	discipline: `
		<path d="M12 2 L20 5 V12 C20 17 16 21 12 22 C8 21 4 17 4 12 V5 Z" fill="none"/>
	`,
	// Sieger-Faktor — trophy
	winner: `
		<path d="M6 4 H18 V9 A6 6 0 0 1 6 9 Z" fill="none"/>
		<path d="M6 6 H3 V8 A3 3 0 0 0 6 11" fill="none"/>
		<path d="M18 6 H21 V8 A3 3 0 0 1 18 11" fill="none"/>
		<line x1="12" y1="15" x2="12" y2="19"/>
		<line x1="8" y1="21" x2="16" y2="21"/>
	`,
};

const labels = $derived(axisOrder.map((k) => $t(`player_profile.axes.${k}`)));

const playerValues = $derived(axisOrder.map((k) => axes?.[k] ?? 0));
const leagueValues = $derived(leagueAverages ?? axisOrder.map(() => 50));

const datasets = $derived([
	{
		id: "league",
		label: $t("profile.league_average"),
		values: leagueValues,
		strokeColor: "rgba(255, 255, 255, 0.4)",
		fillColor: null,
		dashed: true,
		showPoints: false,
	},
	{
		id: "player",
		label: playerName,
		values: playerValues,
		strokeColor: "#E24B4A",
		fillColor: "rgba(226, 75, 74, 0.22)",
	},
]);

const tags = $derived(
	axes
		? generatePlayerTags(axes, locale)
		: { strengths: [], weaknesses: [], character: [] },
);
</script>

<div class="section-card">
	<div class="section-header">
		<div class="section-label">
			<TargetIcon size={12} strokeWidth={1.8} />
			<span>{$t("profile.character_section")}</span>
		</div>
	</div>

	<div class="spider-wrap">
		<SpiderChart
			axes={labels}
			axisKeys={axisOrder}
			axisIcons={AXIS_ICONS}
			{datasets}
			{onAxisClick}
		/>
	</div>

	<div class="spider-legend">
		<div class="legend-item">
			<div class="legend-swatch player"></div>
			<span>{playerName}</span>
		</div>
		<div class="legend-item">
			<div class="legend-swatch league"></div>
			<span>{$t("profile.league_average")}</span>
		</div>
	</div>

	<TagsList
		strengths={tags.strengths}
		weaknesses={tags.weaknesses}
		character={tags.character}
	/>
</div>

<style>
.section-card {
	background: #131822;
	border: 1px solid #1F2937;
	border-radius: 14px;
	padding: 14px;
}
.section-header {
	display: flex; align-items: center; justify-content: space-between;
	margin-bottom: 14px;
}
.section-label {
	font-size: 10px;
	text-transform: uppercase; letter-spacing: 0.1em;
	color: #6B7280;
	font-weight: 700;
	display: inline-flex;
	align-items: center;
	gap: 6px;
}
.spider-wrap {
	position: relative;
	width: 100%;
	aspect-ratio: 1;
	max-width: 320px;
	margin: 0 auto;
}
.spider-legend {
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
.legend-swatch {
	width: 16px; height: 4px; border-radius: 2px;
}
.legend-swatch.player { background: #E24B4A; }
.legend-swatch.league {
	background: transparent;
	border-top: 1.5px dashed rgba(255, 255, 255, 0.4);
}
</style>
