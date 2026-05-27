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
 *   axisKeys?: string[]|null,
 *   axisIcons?: Record<string, string>|null,
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
 *
 * When `axisKeys` is provided, it carries the raw identifiers (e.g.
 * `"finisher"`) that align positionally with `axes` (the user-facing
 * labels). The `onAxisClick` callback fires with the raw key in that
 * case so consumers can look up i18n strings or metadata without
 * round-tripping through the localised label. If `axisKeys` is null
 * the callback falls back to the label, preserving the original
 * single-arg behaviour for any caller that doesn't need raw keys.
 *
 * `axisIcons` is a `{ [rawKey]: <inline SVG children string> }` map.
 * Whenever a key has an entry, the component renders the icon instead
 * of the text label at that axis tip. The label string is still used
 * as the `aria-label`/screen-reader text so keyboard users hear what
 * the icon means. Icons are expected to be drawn against a `0 0 24 24`
 * box; they're scaled down to fit the chart's coordinate space.
 */
let {
	axes,
	axisKeys = null,
	axisIcons = null,
	datasets,
	max = 100,
	gridLevels = 4,
	onAxisClick = null,
} = $props();

const RADIUS = 140;
const LABEL_OFFSET = 18;
// Icons sit closer to the chart than text labels — they're smaller
// and don't need the breathing room a multi-character word demands.
const ICON_OFFSET = 14;
const ICON_HIT_RADIUS = 16;
const ICON_SCALE = 0.9;
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
		const offset =
			axisIcons && (axisKeys?.[i] ?? axes[i]) in (axisIcons ?? {})
				? RADIUS + ICON_OFFSET
				: RADIUS + LABEL_OFFSET;
		const x = offset * Math.cos(a);
		const y = offset * Math.sin(a);
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
		{@const rawKey = axisKeys?.[i] ?? axes[i]}
		{@const iconMarkup = axisIcons?.[rawKey] ?? null}
		{#if iconMarkup}
			<!-- Icon mode: clickable group with an invisible hit-circle
			     that's larger than the visual icon so the touch target
			     is comfortable on mobile (~32 px diameter). -->
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<g
				transform="translate({label.x}, {label.y})"
				class="axis-marker"
				class:clickable={!!onAxisClick}
				role={onAxisClick ? "button" : null}
				tabindex={onAxisClick ? 0 : null}
				aria-label={label.text}
				onclick={onAxisClick ? () => onAxisClick(rawKey) : null}
				onkeydown={onAxisClick
					? (e) => {
							if (e.key === "Enter" || e.key === " ") {
								e.preventDefault();
								onAxisClick(rawKey);
							}
						}
					: null}
			>
				<circle r={ICON_HIT_RADIUS} class="axis-hit" />
				<g
					transform="translate({-12 * ICON_SCALE}, {-12 * ICON_SCALE}) scale({ICON_SCALE})"
					class="axis-icon"
				>
					<!-- eslint-disable-next-line -->
					{@html iconMarkup}
				</g>
			</g>
		{:else if onAxisClick}
			<text
				x={label.x}
				y={label.y}
				class="axis-label clickable"
				text-anchor={label.anchor}
				dominant-baseline="middle"
				onclick={() => onAxisClick(rawKey)}
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

.axis-marker { outline: none; }
.axis-marker.clickable { cursor: pointer; }
.axis-hit {
	/* Visible at 0 alpha so it still catches pointer events but doesn't
	 * paint anything. `fill: transparent` would block pointer events in
	 * some browsers when SVG hit-testing is set to "visiblePainted". */
	fill: rgba(0, 0, 0, 0);
}
.axis-icon {
	fill: none;
	stroke: #9CA3AF;
	stroke-width: 1.8;
	stroke-linecap: round;
	stroke-linejoin: round;
	transition: stroke 0.15s;
}
.axis-marker.clickable:hover .axis-icon,
.axis-marker.clickable:focus-visible .axis-icon {
	stroke: #E5E7EB;
}
.axis-marker.clickable:focus-visible .axis-hit {
	fill: rgba(226, 75, 74, 0.08);
	stroke: rgba(226, 75, 74, 0.5);
	stroke-width: 1;
}
</style>
