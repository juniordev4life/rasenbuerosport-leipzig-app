<script>
/**
 * Inline SVG glyph for one trophy category. Used by both the regal
 * (category-shelf) header and the per-trophy card. The mapping
 * mirrors the HTML mockup — pokal/cup for `win`, lightning for
 * `streak`, ball for `goal`, shield for `defense`, star for
 * `special`, double-user for `duo`, swords for `rivalry`, trophy
 * for `meta`, sparkles for `hidden`.
 *
 * Single component (instead of nine files) because the icons all
 * share the same wrapper — keeps the trophy room from spawning
 * a per-glyph icon file just to render one path.
 *
 * @type {{ category: string, size?: number, strokeWidth?: number }}
 */
let { category, size = 24, strokeWidth = 2 } = $props();
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
	{#if category === "win"}
		<path
			d="M8 21h8M12 17v4M7 4h10v3a5 5 0 01-10 0V4zM7 4H4v2a3 3 0 003 3M17 4h3v2a3 3 0 01-3 3"
		/>
	{:else if category === "streak"}
		<path d="M13 2L4.5 13h6L11 22l8.5-11h-6L13 2z" />
	{:else if category === "goal"}
		<circle cx="12" cy="12" r="9" />
		<path d="M12 3v18M3 12h18M5.5 5.5l13 13M18.5 5.5l-13 13" />
	{:else if category === "defense"}
		<path d="M12 2L4 6v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V6l-8-4z" />
	{:else if category === "special"}
		<polygon points="12 2 15 8.5 22 9.3 17 14 18.2 21 12 17.8 5.8 21 7 14 2 9.3 9 8.5 12 2" />
	{:else if category === "duo"}
		<path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
		<circle cx="9" cy="7" r="4" />
		<path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
	{:else if category === "rivalry"}
		<path d="M14.5 17.5L3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M14 7l3-3 2 2-3 3M5 14l5 5-3 3-5-5z" />
	{:else if category === "meta"}
		<path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
		<path
			d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"
		/>
	{:else if category === "hidden"}
		<path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
		<path d="M19 14l.75 2.25L22 17l-2.25.75L19 20l-.75-2.25L16 17l2.25-.75L19 14z" />
		<path d="M5 14l.75 2.25L8 17l-2.25.75L5 20l-.75-2.25L2 17l2.25-.75L5 14z" />
	{:else}
		<circle cx="12" cy="12" r="9" />
	{/if}
</svg>
