<script>
/**
 * Generic inline-SVG wrapper used by every icon in `components/icons/`.
 * Defaults keep the new RasenBürosport-V2 line-icon style: 1.8 px
 * stroke, round line cap + join, current-color inherit so the parent
 * controls colour via Tailwind classes.
 *
 * @type {{
 *   size?: number,
 *   strokeWidth?: number,
 *   children: import('svelte').Snippet,
 * }}
 */
let { size = 22, strokeWidth = 1.8, children } = $props();
</script>

<svg
	xmlns="http://www.w3.org/2000/svg"
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width={strokeWidth}
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"
>
	{@render children()}
</svg>
