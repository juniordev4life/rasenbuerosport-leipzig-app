<script>
/**
 * Pure-SVG radar / spider chart. Replaces the Chart.js radar so the
 * profile page can render multiple overlapping datasets (player vs.
 * league baseline) with the visual treatment from the spec — dashed
 * baseline polygon, filled player polygon, point dots.
 *
 * Inputs are kept declarative: pass any number of axes and any number
 * of datasets with the same length, and the component does the trig
 * to lay them out. The viewBox is centered around (0, 0) so axis
 * trigonometry stays readable.
 *
 * @type {{
 *   axes: string[],
 *   datasets: Array<{
 *     id: string,
 *     label: string,
 *     values: number[],
 *     strokeColor: string,
 *     fillColor?: string|null,
 *     dashed?: boolean,
 *     showPoints?: boolean,
 *   }>,
 *   max?: number,
 *   gridLevels?: number,
 *   onAxisClick?: (key: string) => void,
 * }}
 */
let {
	axes,
	datasets,
	max = 100,
	gridLevels = 4,
	onAxisClick = null,
} = $props();

const RADIUS = 140;
const LABEL_OFFSET = 18;
const VIEWBOX = 180;

const angles = $derived(
	axes.map((_, i) => (i / axes.length) * Math.PI * 2 - Math.PI / 2),
);

function pointFor(value, angle) {
	const r = (Math.max(0, Math.min(max, value)) / max) * RADIUS;
	return [r * Math.cos(angle), r * Math.sin(angle)];
}

const gridPolygons = $derived.by(() => {
	const polys = [];
	for (let g = 1; g <= gridLevels; g += 1) {
		const ratio = g / gridLevels;
		const coords = angles
			.map((a) => {
				const x = RADIUS * ratio * Math.cos(a);
				const y = RADIUS * ratio * Math.sin(a);
				return `${x.toFixed(2)},${y.toFixed(2)}`;
			})
			.join(" ");
		polys.push(coords);
	}
	return polys;
});

const axisLines = $derived(
	angles.map((a) => ({
		x: (RADIUS * Math.cos(a)).toFixed(2),
		y: (RADIUS * Math.sin(a)).toFixed(2),
	})),
);

const labels = $derived(
	angles.map((a, i) => {
		const x = (RADIUS + LABEL_OFFSET) * Math.cos(a);
		const y = (RADIUS + LABEL_OFFSET) * Math.sin(a);
		let anchor = "middle";
		if (x > 4) anchor = "start";
		else if (x < -4) anchor = "end";
		return {
			x: x.toFixed(2),
			y: y.toFixed(2),
			text: axes[i],
			anchor,
		};
	}),
);

const renderedDatasets = $derived(
	datasets.map((ds) => {
		const points = ds.values.map((v, i) => pointFor(v, angles[i]));
		const polygon = points
			.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`)
			.join(" ");
		return { ...ds, points, polygon };
	}),
);
</script>

<svg
	class="spider-svg"
	viewBox="-{VIEWBOX} -{VIEWBOX} {VIEWBOX * 2} {VIEWBOX * 2}"
	role="img"
	aria-label="Radar chart"
>
	{#each gridPolygons as poly, i (i)}
		<polygon points={poly} class="grid" />
	{/each}

	{#each axisLines as line, i (i)}
		<line x1="0" y1="0" x2={line.x} y2={line.y} class="axis-line" />
	{/each}

	{#each renderedDatasets as ds (ds.id)}
		<polygon
			points={ds.polygon}
			fill={ds.fillColor ?? "none"}
			stroke={ds.strokeColor}
			stroke-width={ds.fillColor ? 2 : 1.5}
			stroke-linejoin="round"
			stroke-dasharray={ds.dashed ? "4 4" : null}
		/>
		{#if ds.showPoints !== false && !ds.dashed}
			{#each ds.points as [x, y], pi (pi)}
				<circle cx={x} cy={y} r="3.5" fill={ds.strokeColor} />
			{/each}
		{/if}
	{/each}

	{#each labels as label, i (i)}
		{#if onAxisClick}
			<text
				x={label.x}
				y={label.y}
				class="axis-label clickable"
				text-anchor={label.anchor}
				dominant-baseline="middle"
				onclick={() => onAxisClick(axes[i])}
			>{label.text}</text>
		{:else}
			<text
				x={label.x}
				y={label.y}
				class="axis-label"
				text-anchor={label.anchor}
				dominant-baseline="middle"
			>{label.text}</text>
		{/if}
	{/each}
</svg>

<style>
.spider-svg {
	width: 100%;
	height: 100%;
	display: block;
}
.grid {
	fill: none;
	stroke: rgba(255, 255, 255, 0.08);
	stroke-width: 1;
}
.axis-line {
	stroke: rgba(255, 255, 255, 0.06);
	stroke-width: 1;
}
.axis-label {
	fill: #9CA3AF;
	font-size: 11px;
	font-weight: 600;
}
.axis-label.clickable { cursor: pointer; }
.axis-label.clickable:hover { fill: #E5E7EB; }
</style>
