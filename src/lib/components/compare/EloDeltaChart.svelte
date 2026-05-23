<script>
import { getTranslate } from "@tolgee/svelte";

/**
 * SVG mini-chart of the ELO delta (playerA − playerB) after each
 * direct match. The chart is split visually by a dashed zero-line —
 * area above tinted orange (A leading), below tinted cyan (B leading).
 *
 * The component renders nothing when fewer than 3 datapoints are
 * available (per spec — too few for a meaningful curve).
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
	<div class="section-card">
		<div class="section-header">
			<div class="section-label">{"\u{1F4C8}"} {$t("compare.elo_delta_section")}</div>
		</div>

		<div class="legend">
			<span class="legend-item up">↑ {playerAName}</span>
			<span class="legend-item down">↓ {playerBName}</span>
		</div>

		<svg viewBox="0 0 {W} {H}" preserveAspectRatio="none" class="chart">
			<rect x="0" y="0" width={W} height={layout.zeroY} fill="rgba(245, 158, 11, 0.08)" />
			<rect x="0" y={layout.zeroY} width={W} height={H - layout.zeroY} fill="rgba(6, 182, 212, 0.08)" />
			<line x1="0" y1={layout.zeroY} x2={W} y2={layout.zeroY} stroke="rgba(255,255,255,0.18)" stroke-width="1" stroke-dasharray="4,4" />
			<polyline points={layout.polyline} fill="none" stroke="#84CC16" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
			{#each layout.dots as d, i (i)}
				<circle cx={d.x} cy={d.y} r="3" fill={d.positive ? "#F59E0B" : "#06B6D4"} />
			{/each}
		</svg>
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
.legend {
	display: flex; justify-content: space-between;
	font-size: 10px;
	font-weight: 700;
	color: #6B7280;
	margin-bottom: 6px;
}
.legend-item.up { color: #F59E0B; }
.legend-item.down { color: #06B6D4; }
.chart {
	width: 100%; height: 80px;
	display: block;
	border-radius: 8px;
}
</style>
