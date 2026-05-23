<script>
import { getTranslate } from "@tolgee/svelte";
import SpiderChart from "$lib/components/charts/SpiderChart.svelte";
import TagsList from "$lib/components/profile/TagsList.svelte";

/**
 * Duo spider section — six-axis radar with the league baseline as a
 * dashed overlay plus auto-generated tag groups. When `tentative` is
 * true the section dims and shows the "Werte stabilisieren sich"
 * banner from the lifecycle "finding" phase.
 *
 * @type {{
 *   values: number[],
 *   leagueValues?: number[]|null,
 *   duoName: string,
 *   tags: { strengths: string[], weaknesses: string[], character: string[] },
 *   tentative?: boolean,
 * }}
 */
let {
	values,
	leagueValues = null,
	duoName,
	tags,
	tentative = false,
} = $props();

const { t } = getTranslate();

const AXIS_KEYS = [
	"offensive",
	"possession",
	"passing",
	"defending",
	"pressing",
	"efficiency",
];

const labels = $derived(AXIS_KEYS.map((k) => $t(`duo.axes.${k}`)));

const datasets = $derived([
	{
		id: "league",
		label: $t("duo.league_average"),
		values: leagueValues ?? AXIS_KEYS.map(() => 50),
		strokeColor: "rgba(255, 255, 255, 0.4)",
		fillColor: null,
		dashed: true,
		showPoints: false,
	},
	{
		id: "duo",
		label: duoName,
		values,
		strokeColor: "#84CC16",
		fillColor: "rgba(132, 204, 22, 0.22)",
	},
]);

const strengths = $derived(tags.strengths.map((label) => ({ label })));
const weaknesses = $derived(tags.weaknesses.map((label) => ({ label })));
</script>

<div class="section-card" class:tentative>
	<div class="section-header">
		<div class="section-label">{"\u{1F3AF}"} {$t("duo.spider_section")}</div>
	</div>

	{#if tentative}
		<div class="tentative-banner">⚠ {$t("duo.tentative_banner")}</div>
	{/if}

	<div class="spider-wrap">
		<SpiderChart axes={labels} {datasets} />
	</div>

	<div class="spider-legend">
		<div class="legend-item">
			<div class="legend-swatch duo"></div>
			<span>{duoName}</span>
		</div>
		<div class="legend-item">
			<div class="legend-swatch league"></div>
			<span>{$t("duo.league_average")}</span>
		</div>
	</div>

	<TagsList {strengths} {weaknesses} character={tags.character} />
</div>

<style>
.section-card {
	background: #131822;
	border: 1px solid #1F2937;
	border-radius: 14px;
	padding: 14px;
}
.section-card.tentative { opacity: 0.85; }
.section-header { margin-bottom: 14px; }
.section-label {
	font-size: 10px;
	text-transform: uppercase; letter-spacing: 0.1em;
	color: #6B7280;
	font-weight: 700;
}
.tentative-banner {
	background: rgba(245, 158, 11, 0.08);
	border: 1px solid rgba(245, 158, 11, 0.2);
	border-radius: 8px;
	padding: 8px 12px;
	margin-bottom: 12px;
	font-size: 11px;
	color: #F59E0B;
	font-weight: 600;
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
.legend-swatch.duo { background: #84CC16; }
.legend-swatch.league {
	background: transparent;
	border-top: 1.5px dashed rgba(255, 255, 255, 0.4);
}
</style>
