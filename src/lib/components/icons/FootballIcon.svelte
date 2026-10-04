<script>
/**
 * Two-tone football (white ball, dark patches) for the "new match" button
 * and section headers. Colours come from `--ball-fill` / `--ball-ink`,
 * defaulting to white and navy.
 *
 * @type {{ size?: number }}
 */
let { size = 32 } = $props();

// Unique per instance: the ball appears several times on one page.
const uid = $props.id();
const clipId = `football-clip-${uid}`;
</script>

<svg
	xmlns="http://www.w3.org/2000/svg"
	width={size}
	height={size}
	viewBox="0 0 64 64"
	aria-hidden="true"
	class="ball"
>
	<defs>
		<clipPath id={clipId}><circle cx="32" cy="32" r="29" /></clipPath>
	</defs>
	<circle cx="32" cy="32" r="30" class="fill" />
	<g clip-path={`url(#${clipId})`} class="ink-fill">
		<polygon points="32,21 42.5,28.6 38.5,40.9 25.5,40.9 21.5,28.6" />
		<circle cx="48.5" cy="8.5" r="8" />
		<circle cx="59.6" cy="41" r="8" />
		<circle cx="32" cy="61" r="8" />
		<circle cx="4.4" cy="41" r="8" />
		<circle cx="15.5" cy="8.5" r="8" />
	</g>
	<path
		d="M32 21V5M42.5 28.6L55 24.5M38.5 40.9L46 51.5M25.5 40.9L18 51.5M21.5 28.6L9 24.5"
		class="ink-stroke"
	/>
	<circle cx="32" cy="32" r="30" class="ink-stroke" fill="none" />
</svg>

<style>
.fill {
	fill: var(--ball-fill, var(--color-white));
}
.ink-fill {
	fill: var(--ball-ink, var(--color-navy));
}
.ink-stroke {
	stroke: var(--ball-ink, var(--color-navy));
	stroke-width: 2.5;
}
</style>
