<script>
import { getTranslate } from "@tolgee/svelte";
import BarChartIcon from "$lib/components/icons/BarChartIcon.svelte";
import Section from "$lib/components/ui/Section.svelte";

/**
 * Mini chart of the ELO gap (player A − player B) after each direct
 * match. A dashed zero line splits it: the band above is tinted in
 * player A's colour (A ahead), the band below in player B's. Each
 * match is a dot in the colour of whoever was ahead; the legend names
 * both sides with ↑ / ↓, so the colours are never the only cue.
 *
 * Player A is `--color-chart-4` (red), player B `--color-chart-1`
 * (navy in A, green in B), as in the other H2H sections.
 *
 * Renders nothing below 3 data points (too few for a curve).
 *
 * @type {{
 *   points: number[],
 *   playerAName: string,
 *   playerBName: string,
 * }}
 */
let { points = [], playerAName, playerBName } = $props();

const { t } = getTranslate();

const W = 320;
const H = 80;

const enough = $derived(points.length >= 3);

const layout = $derived.by(() => {
	if (!enough) return null;
	const min = Math.min(...points, 0);
	const max = Math.max(...points, 0);
	const range = Math.max(1, max - min);
	const stepX = W / (points.length - 1);
	const yFor = (v) => H - ((v - min) / range) * (H - 6) - 3;
	const zeroY = yFor(0);
	const polyline = points
		.map((v, i) => `${(i * stepX).toFixed(1)},${yFor(v).toFixed(1)}`)
		.join(" ");
	const dots = points.map((v, i) => ({
		x: i * stepX,
		y: yFor(v),
		positive: v >= 0,
	}));
	return { polyline, dots, zeroY };
});
</script>

{#if enough && layout}
	<Section title={$t("compare.elo_delta_section")}>
		{#snippet icon()}<BarChartIcon size={22} strokeWidth={2} />{/snippet}
		<div class="card chart-card">
			<div class="legend">
				<span class="side-a">↑ {playerAName}</span>
				<span class="side-b">↓ {playerBName}</span>
			</div>

			<!-- Dots are zero-length round-capped lines with a non-scaling
			     stroke, so they stay round while the chart stretches. -->
			<svg viewBox="0 0 {W} {H}" preserveAspectRatio="none" class="chart" aria-hidden="true">
				<rect x="0" y="0" width={W} height={layout.zeroY} class="zone-a" />
				<rect x="0" y={layout.zeroY} width={W} height={H - layout.zeroY} class="zone-b" />
				<line
					x1="0"
					y1={layout.zeroY}
					x2={W}
					y2={layout.zeroY}
					class="zero"
					vector-effect="non-scaling-stroke"
				/>
				<polyline
					points={layout.polyline}
					class="curve"
					vector-effect="non-scaling-stroke"
				/>
				{#each layout.dots as d, i (i)}
					<line
						x1={d.x}
						y1={d.y}
						x2={d.x}
						y2={d.y}
						class="dot"
						class:dot-b={!d.positive}
						vector-effect="non-scaling-stroke"
					/>
				{/each}
			</svg>
		</div>
	</Section>
{/if}

<style>
.chart-card {
	--side-a: var(--color-chart-4);
	--side-b: var(--color-chart-1);
	display: flex;
	flex-direction: column;
	gap: 10px;
	padding: 16px;
}

.legend {
	display: flex;
	justify-content: space-between;
	gap: 12px;
	font-family: var(--font-cond);
	font-weight: 700;
	font-size: 14px;
}

.side-a {
	color: var(--side-a);
}

.side-b {
	color: var(--side-b);
}

.chart {
	display: block;
	width: 100%;
	height: 96px;
	overflow: visible;
}

.zone-a {
	fill: color-mix(in srgb, var(--side-a) 8%, transparent);
}

.zone-b {
	fill: color-mix(in srgb, var(--side-b) 8%, transparent);
}

.zero {
	stroke: var(--color-muted);
	stroke-width: 1;
	stroke-dasharray: 4 4;
}

.curve {
	fill: none;
	stroke: var(--color-ink);
	stroke-width: 2;
	stroke-linejoin: round;
	stroke-linecap: round;
}

.dot {
	stroke: var(--side-a);
	stroke-width: 8;
	stroke-linecap: round;
}

.dot-b {
	stroke: var(--side-b);
}

@media (min-width: 1024px) {
	.chart {
		height: 128px;
	}
}
</style>
