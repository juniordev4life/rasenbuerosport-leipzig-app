<script>
import { getTranslate } from "@tolgee/svelte";
import SpiderChart from "$lib/components/charts/SpiderChart.svelte";
import ClockIcon from "$lib/components/icons/ClockIcon.svelte";
import TargetIcon from "$lib/components/icons/TargetIcon.svelte";
import TagsList from "$lib/components/profile/TagsList.svelte";
import Section from "$lib/components/ui/Section.svelte";

/**
 * The duo's play style: a six-axis radar of the duo (red) over the
 * league average (dashed navy), a legend and the generated tag groups
 * (TagsList draws its own separator line). While the duo is still
 * "finding" itself (`tentative`), a pale gold note says the values are
 * still settling. Same look as the profile's character section.
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
		strokeColor: "var(--color-ink)",
		fillColor: null,
		dashed: true,
		showPoints: false,
	},
	{
		id: "duo",
		label: duoName,
		values,
		strokeColor: "var(--color-brand)",
		fillColor: "color-mix(in srgb, var(--color-brand) 14%, transparent)",
	},
]);

const strengths = $derived(tags.strengths.map((label) => ({ label })));
const weaknesses = $derived(tags.weaknesses.map((label) => ({ label })));
</script>

<Section title={$t("duo.spider_section")}>
	{#snippet icon()}<TargetIcon size={22} strokeWidth={2} />{/snippet}
	<div class="card spider-card">
		{#if tentative}
			<p class="tentative">
				<ClockIcon size={16} />
				{$t("duo.tentative_banner")}
			</p>
		{/if}

		<div class="spider-wrap">
			<SpiderChart axes={labels} {datasets} />
		</div>

		<div class="legend">
			<span class="legend-item">
				<span class="swatch swatch-duo" aria-hidden="true"></span>
				{duoName}
			</span>
			<span class="legend-item">
				<span class="swatch swatch-league" aria-hidden="true"></span>
				{$t("duo.league_average")}
			</span>
		</div>

		<TagsList {strengths} {weaknesses} character={tags.character} />
	</div>
</Section>

<style>
.spider-card {
	display: flex;
	flex-direction: column;
	gap: 14px;
	padding: 16px;
}

.tentative {
	display: flex;
	align-items: center;
	gap: 8px;
	margin: 0;
	padding: 10px 12px;
	border-radius: var(--radius-tile);
	background: var(--color-gold-soft);
	color: var(--color-ink);
	font-weight: 500;
	font-size: 13px;
	line-height: 1.35;
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
	flex-shrink: 0;
}

.swatch-duo {
	height: 3px;
	border-radius: var(--radius-bar);
	background: var(--color-brand);
}

.swatch-league {
	height: 0;
	border-top: 2px dashed var(--color-ink);
}

:global([data-variant="b"]) .swatch-duo {
	height: 4px;
}
</style>
