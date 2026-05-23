<script>
/**
 * Minimal area-line sparkline rendered as an SVG `<polyline>` pair.
 * Auto-scales the input series into the viewBox. A dashed grey line is
 * drawn when too few points are available (rookie / cold-start state).
 *
 * @type {{
 *   points?: number[],
 *   width?: number,
 *   height?: number,
 *   stroke?: string,
 *   fillId?: string|null,
 *   dashed?: boolean,
 *   strokeWidth?: number,
 *   opacity?: number,
 * }}
 */
let {
	points = [],
	width = 50,
	height = 18,
	stroke = "#84CC16",
	fillId = null,
	dashed = false,
	strokeWidth = 1.3,
	opacity = 0.7,
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
	const area = `${line} ${width},${height} 0,${height}`;
	return { line, area };
});
</script>

<svg
	viewBox="0 0 {width} {height}"
	preserveAspectRatio="none"
	style="width: {width}px; height: {height}px; opacity: {opacity};"
	aria-hidden="true"
>
	{#if geom}
		{#if fillId}
			<defs>
				<linearGradient id={fillId} x1="0%" y1="0%" x2="0%" y2="100%">
					<stop offset="0%" stop-color={stroke} />
					<stop offset="100%" stop-color={stroke} stop-opacity="0" />
				</linearGradient>
			</defs>
			<polyline points={geom.area} fill="url(#{fillId})" opacity="0.35" />
		{/if}
		<polyline
			points={geom.line}
			fill="none"
			stroke={stroke}
			stroke-width={strokeWidth}
			stroke-linejoin="round"
			stroke-linecap="round"
			stroke-dasharray={dashed ? "2,2" : null}
		/>
	{:else}
		<line
			x1="0"
			y1={height / 2}
			x2={width}
			y2={height / 2}
			stroke="#6B7280"
			stroke-width="1.2"
			stroke-dasharray="2,2"
		/>
	{/if}
</svg>
