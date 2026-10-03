<script>
/**
 * Minimal line sparkline (an SVG polyline), auto-scaled into its
 * viewBox. A dashed flat line stands in when there are fewer than two
 * points (cold start).
 *
 * Colours come from the surroundings: `stroke` defaults to
 * `currentColor`, so a parent colours the line with `color` — or passes
 * a token such as `var(--color-win)`. `area` adds a soft fill under the
 * line in the same colour (its strength is `--spark-area-opacity`,
 * default 0.14); `fillId` keeps the older fading gradient fill.
 *
 * `fluid` makes the SVG fill its container's width. The viewBox keeps
 * `width`, so the geometry is unchanged and only the rendering scales;
 * the stroke keeps its width while scaling.
 *
 * @type {{
 *   points?: number[],
 *   width?: number,
 *   height?: number,
 *   stroke?: string,
 *   fillId?: string|null,
 *   area?: boolean,
 *   dashed?: boolean,
 *   strokeWidth?: number,
 *   opacity?: number,
 *   fluid?: boolean,
 * }}
 */
let {
	points = [],
	width = 50,
	height = 18,
	stroke = "currentColor",
	fillId = null,
	area = false,
	dashed = false,
	strokeWidth = 1.3,
	opacity = 1,
	fluid = false,
} = $props();

const geom = $derived.by(() => {
	if (!Array.isArray(points) || points.length < 2) return null;
	const min = Math.min(...points);
	const max = Math.max(...points);
	const range = max - min || 1;
	const stepX = width / (points.length - 1);
	const coords = points.map((p, i) => {
		const x = i * stepX;
		const y = height - ((p - min) / range) * (height - 2) - 1;
		return [x, y];
	});
	const line = coords.map(([x, y]) => `${x},${y}`).join(" ");
	const fill = `${line} ${width},${height} 0,${height}`;
	return { line, fill };
});
</script>

<svg
	class="sparkline"
	viewBox="0 0 {width} {height}"
	preserveAspectRatio="none"
	style:width={fluid ? "100%" : `${width}px`}
	style:height="{height}px"
	style:opacity
	aria-hidden="true"
>
	{#if geom}
		{#if fillId}
			<defs>
				<linearGradient id={fillId} x1="0%" y1="0%" x2="0%" y2="100%">
					<stop offset="0%" style:stop-color={stroke} />
					<stop offset="100%" style:stop-color={stroke} stop-opacity="0" />
				</linearGradient>
			</defs>
			<polyline points={geom.fill} fill="url(#{fillId})" opacity="0.35" />
		{:else if area}
			<polyline class="area" points={geom.fill} style:fill={stroke} />
		{/if}
		<polyline
			points={geom.line}
			fill="none"
			style:stroke
			stroke-width={strokeWidth}
			stroke-linejoin="round"
			stroke-linecap="round"
			stroke-dasharray={dashed ? "2,2" : null}
			vector-effect="non-scaling-stroke"
		/>
	{:else}
		<line
			class="cold"
			x1="0"
			y1={height / 2}
			x2={width}
			y2={height / 2}
			stroke-width="1.2"
			stroke-dasharray="2,2"
			vector-effect="non-scaling-stroke"
		/>
	{/if}
</svg>

<style>
.sparkline {
	display: block;
	overflow: visible;
}

.area {
	fill-opacity: var(--spark-area-opacity, 0.14);
}

/* No history yet: a faint dashed line in the surrounding colour. */
.cold {
	stroke: currentColor;
	stroke-opacity: 0.45;
}
</style>
