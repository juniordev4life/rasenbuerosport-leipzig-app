<script>
import { getTranslate } from "@tolgee/svelte";
import SpiderChart from "$lib/components/charts/SpiderChart.svelte";
import TargetIcon from "$lib/components/icons/TargetIcon.svelte";
import Section from "$lib/components/ui/Section.svelte";

/**
 * Both players' character radars overlaid in one chart: player A in
 * `--color-chart-4` (red), player B in `--color-chart-1` (navy in A,
 * green in B), each with a light fill so the overlap stays readable.
 * A legend names both colours.
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
		strokeColor: "var(--color-chart-4)",
		fillColor: "color-mix(in srgb, var(--color-chart-4) 18%, transparent)",
	},
	{
		id: "playerB",
		label: playerBName,
		values: valuesB,
		strokeColor: "var(--color-chart-1)",
		fillColor: "color-mix(in srgb, var(--color-chart-1) 18%, transparent)",
	},
]);

const hasData = $derived(axesA || axesB);
</script>

{#if hasData}
	<Section title={$t("compare.character_section")}>
		{#snippet icon()}<TargetIcon size={22} strokeWidth={2} />{/snippet}
		<div class="card spider-card">
			<div class="spider-wrap">
				<SpiderChart axes={labels} {datasets} />
			</div>
			<div class="legend">
				<span class="legend-item">
					<span class="swatch swatch-a" aria-hidden="true"></span>
					{playerAName}
				</span>
				<span class="legend-item">
					<span class="swatch swatch-b" aria-hidden="true"></span>
					{playerBName}
				</span>
			</div>
		</div>
	</Section>
{/if}

<style>
.spider-card {
	display: flex;
	flex-direction: column;
	gap: 14px;
	padding: 16px;
}

/* Matches SpiderChart's text-label viewBox (516 × 340). */
.spider-wrap {
	width: 100%;
	max-width: 460px;
	aspect-ratio: 129 / 85;
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
	min-width: 0;
}

.swatch {
	width: 18px;
	height: 4px;
	flex-shrink: 0;
	border-radius: var(--radius-bar);
}

.swatch-a {
	background: var(--color-chart-4);
}

.swatch-b {
	background: var(--color-chart-1);
}
</style>
