<script>
import { getTranslate } from "@tolgee/svelte";
import SpiderChart from "$lib/components/charts/SpiderChart.svelte";
import TargetIcon from "$lib/components/icons/TargetIcon.svelte";
import Section from "$lib/components/ui/Section.svelte";
import { generatePlayerTags } from "$lib/utils/profileTags.utils.js";
import TagsList from "./TagsList.svelte";

/**
 * "Spielercharakter": the six-axis radar (player in red over the dashed
 * league average), a legend and the generated strength / weakness /
 * playstyle tags. Tapping an axis icon calls `onAxisClick` with its key.
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
		strokeColor: "var(--color-ink)",
		fillColor: null,
		dashed: true,
		showPoints: false,
	},
	{
		id: "player",
		label: playerName,
		values: playerValues,
		strokeColor: "var(--color-brand)",
		fillColor: "color-mix(in srgb, var(--color-brand) 14%, transparent)",
	},
]);

const tags = $derived(
	axes
		? generatePlayerTags(axes, locale)
		: { strengths: [], weaknesses: [], character: [] },
);
</script>

<Section title={$t("profile.character_section")}>
	{#snippet icon()}<TargetIcon size={22} strokeWidth={2} />{/snippet}
	<div class="card body">
		<div class="chart">
			<SpiderChart
				axes={labels}
				axisKeys={axisOrder}
				axisIcons={AXIS_ICONS}
				{datasets}
				{onAxisClick}
			/>
		</div>

		<div class="legend">
			<span class="legend-item">
				<span class="swatch player" aria-hidden="true"></span>
				{playerName}
			</span>
			<span class="legend-item">
				<span class="swatch league" aria-hidden="true"></span>
				{$t("profile.league_average")}
			</span>
		</div>

		<TagsList
			strengths={tags.strengths}
			weaknesses={tags.weaknesses}
			character={tags.character}
		/>
	</div>
</Section>

<style>
.body {
	display: flex;
	flex-direction: column;
	gap: 14px;
	padding: 16px;
}

.chart {
	position: relative;
	width: 100%;
	max-width: 320px;
	aspect-ratio: 1;
	margin: 0 auto;
}

.legend {
	display: flex;
	flex-wrap: wrap;
	justify-content: center;
	gap: 8px 20px;
	font-size: 13px;
}

.legend-item {
	display: inline-flex;
	align-items: center;
	gap: 8px;
}

.swatch {
	width: 18px;
	flex-shrink: 0;
}

.swatch.player {
	height: 3px;
	border-radius: var(--radius-bar);
	background: var(--color-brand);
}

.swatch.league {
	height: 0;
	border-top: 2px dashed var(--color-ink);
}

:global([data-variant="b"]) .swatch.player {
	height: 4px;
}
</style>
