<script>
import { getTranslate } from "@tolgee/svelte";
import SpiderChart from "$lib/components/charts/SpiderChart.svelte";
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
		<div class="section-label">{"\u{1F3AF}"} {$t("profile.character_section")}</div>
	</div>

	<div class="spider-wrap">
		<SpiderChart axes={labels} {datasets} {onAxisClick} />
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
