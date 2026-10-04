<script>
/**
 * Pure-SVG radar / spider chart: any number of axes and of overlaid
 * datasets with the same length (e.g. a player against the league
 * baseline, or two players head to head). The viewBox is centred on
 * (0, 0) so the axis trigonometry stays readable.
 *
 * Colours: the grid, axes and labels use the design tokens (grey and
 * condensed caps in design A, green and sentence case in B). Each
 * dataset brings its own `strokeColor` / `fillColor`; pass tokens such
 * as `var(--color-chart-4)` or a `color-mix(…)` of one. Points are solid
 * in A and white with a coloured ring in B.
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
 * the callback falls back to the label.
 *
 * `axisIcons` is a `{ [rawKey]: <inline SVG children string> }` map.
 * Whenever a key has an entry, the component renders the icon instead
 * of the text label at that axis tip; the label stays the accessible
 * name. Icons are drawn against a `0 0 24 24` box and scaled to fit.
 *
 * With text labels the viewBox is wider than tall (516 × 340), as in
 * the design mockups: a slightly smaller chart, so labels such as
 * "Sieger-Faktor" fit beside the side axes at a readable size. Give the
 * container an aspect ratio of 129 / 85. With icons only (the profile)
 * it stays square (360 × 360).
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
const LABEL_OFFSET = 16;
// Icons sit closer to the chart than text labels — they're smaller
// and don't need the breathing room a multi-character word demands.
const ICON_OFFSET = 14;
const ICON_HIT_RADIUS = 16;
const ICON_SCALE = 0.9;
const VIEWBOX = 180;
// Text-label mode: half width / height of the viewBox (room for the
// longest label beside the side axes at the 18-unit label size).
const TEXT_HALF_WIDTH = 258;
const TEXT_HALF_HEIGHT = 170;

const angles = $derived(
	axes.map((_, i) => (i / axes.length) * Math.PI * 2 - Math.PI / 2),
);

function rawKeyAt(i) {
	return axisKeys?.[i] ?? axes[i];
}

function hasIcon(i) {
	return Boolean(axisIcons?.[rawKeyAt(i)]);
}

const iconMode = $derived(axes.every((_, i) => hasIcon(i)));
const viewBox = $derived(
	iconMode
		? `-${VIEWBOX} -${VIEWBOX} ${VIEWBOX * 2} ${VIEWBOX * 2}`
		: `-${TEXT_HALF_WIDTH} -${TEXT_HALF_HEIGHT} ${TEXT_HALF_WIDTH * 2} ${TEXT_HALF_HEIGHT * 2}`,
);

function pointFor(value, angle) {
	const r = (Math.max(0, Math.min(max, value)) / max) * RADIUS;
	return [r * Math.cos(angle), r * Math.sin(angle)];
}

function ringAt(ratio) {
	return angles
		.map((a) => {
			const x = RADIUS * ratio * Math.cos(a);
			const y = RADIUS * ratio * Math.sin(a);
			return `${x.toFixed(2)},${y.toFixed(2)}`;
		})
		.join(" ");
}

const gridPolygons = $derived(
	Array.from({ length: gridLevels }, (_, g) => ringAt((g + 1) / gridLevels)),
);

const axisLines = $derived(
	angles.map((a) => ({
		x: (RADIUS * Math.cos(a)).toFixed(2),
		y: (RADIUS * Math.sin(a)).toFixed(2),
	})),
);

const labels = $derived(
	angles.map((a, i) => {
		const offset = hasIcon(i) ? RADIUS + ICON_OFFSET : RADIUS + LABEL_OFFSET;
		const x = offset * Math.cos(a);
		const y = offset * Math.sin(a);
		let anchor = "middle";
		if (x > 4) anchor = "start";
		else if (x < -4) anchor = "end";
		return {
			x: x.toFixed(2),
			y: y.toFixed(2),
			text: axes[i],
			key: rawKeyAt(i),
			icon: axisIcons?.[rawKeyAt(i)] ?? null,
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

function handleAxisKeydown(event, key) {
	if (event.key === "Enter" || event.key === " ") {
		event.preventDefault();
		onAxisClick?.(key);
	}
}
</script>

<!-- A group when the axes are buttons: an img would hide them from
     assistive technology. -->
<svg
	class="spider-svg"
	{viewBox}
	role={onAxisClick ? "group" : "img"}
	aria-label="Radar chart"
>
	{#if gridPolygons.length > 0}
		<polygon points={gridPolygons[gridPolygons.length - 1]} class="grid-bg" />
	{/if}

	{#each gridPolygons as poly, i (i)}
		<polygon points={poly} class="grid" />
	{/each}

	{#each axisLines as line, i (i)}
		<line x1="0" y1="0" x2={line.x} y2={line.y} class="axis-line" />
	{/each}

	{#each renderedDatasets as ds (ds.id)}
		<g style:--ds-stroke={ds.strokeColor} style:--ds-fill={ds.fillColor ?? "none"}>
			<polygon
				points={ds.polygon}
				class="ds-shape"
				stroke-width={ds.fillColor ? 2.5 : 1.5}
				stroke-dasharray={ds.dashed ? "4 4" : null}
			/>
			{#if ds.showPoints !== false && !ds.dashed}
				{#each ds.points as [x, y], pi (pi)}
					<circle cx={x} cy={y} r="4" class="ds-point" />
				{/each}
			{/if}
		</g>
	{/each}

	{#each labels as label, i (i)}
		{#if label.icon && onAxisClick}
			<!-- Icon mode: a focusable group with an invisible hit circle,
			     larger than the icon so the touch target is comfortable. -->
			<g
				transform="translate({label.x}, {label.y})"
				class="axis-marker clickable"
				role="button"
				tabindex="0"
				aria-label={label.text}
				onclick={() => onAxisClick(label.key)}
				onkeydown={(event) => handleAxisKeydown(event, label.key)}
			>
				<circle r={ICON_HIT_RADIUS} class="axis-hit" />
				<g
					transform="translate({-12 * ICON_SCALE}, {-12 * ICON_SCALE}) scale({ICON_SCALE})"
					class="axis-icon"
				>
					{@html label.icon}
				</g>
			</g>
		{:else if label.icon}
			<g transform="translate({label.x}, {label.y})" class="axis-marker" role="img" aria-label={label.text}>
				<g
					transform="translate({-12 * ICON_SCALE}, {-12 * ICON_SCALE}) scale({ICON_SCALE})"
					class="axis-icon"
				>
					{@html label.icon}
				</g>
			</g>
		{:else if onAxisClick}
			<text
				x={label.x}
				y={label.y}
				class="axis-label clickable"
				text-anchor={label.anchor}
				dominant-baseline="middle"
				role="button"
				tabindex="0"
				onclick={() => onAxisClick(label.key)}
				onkeydown={(event) => handleAxisKeydown(event, label.key)}
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

/* Grid: grey rings on a pale fill in A, green ones in B. */
.grid-bg {
	fill: var(--color-sunken);
	stroke: none;
}

.grid,
.axis-line {
	fill: none;
	stroke: var(--color-line);
	stroke-width: 1;
}

:global([data-variant="b"]) .grid-bg {
	fill: color-mix(in srgb, var(--color-win-soft) 60%, var(--color-surface));
}

:global([data-variant="b"]) .grid,
:global([data-variant="b"]) .axis-line {
	stroke: var(--color-chart-3);
	stroke-width: 1.5;
}

/* Datasets take their colours from the custom properties set per group. */
.ds-shape {
	fill: var(--ds-fill);
	stroke: var(--ds-stroke);
	stroke-linejoin: round;
}

.ds-point {
	fill: var(--ds-stroke);
}

:global([data-variant="b"]) .ds-point {
	fill: var(--color-surface);
	stroke: var(--ds-stroke);
	stroke-width: 2.5;
}

.axis-label {
	fill: var(--color-ink);
	font-family: var(--font-label);
	font-weight: var(--label-weight);
	font-size: 18px;
	text-transform: var(--label-case);
	letter-spacing: var(--label-tracking);
}

.axis-label.clickable {
	cursor: pointer;
}

.axis-label.clickable:hover,
.axis-label.clickable:focus-visible {
	fill: var(--color-brand);
}

.axis-marker {
	outline: none;
}

.axis-marker.clickable {
	cursor: pointer;
}

/* Painted at zero alpha so it still catches pointer events. */
.axis-hit {
	fill: var(--color-surface);
	fill-opacity: 0;
}

.axis-icon {
	fill: none;
	stroke: var(--color-muted);
	stroke-width: 1.8;
	stroke-linecap: round;
	stroke-linejoin: round;
	transition: stroke 0.15s;
}

.axis-marker.clickable:hover .axis-icon,
.axis-marker.clickable:focus-visible .axis-icon {
	stroke: var(--color-ink);
}

.axis-marker.clickable:focus-visible .axis-hit {
	fill: var(--color-brand);
	fill-opacity: 0.08;
	stroke: var(--color-brand);
	stroke-width: 1;
}
</style>
