<script>
/**
 * Full-width form button on the shared `.btn` styles (see app.css).
 *
 * @type {{
 *   type?: "button"|"submit"|"reset",
 *   variant?: "primary"|"secondary"|"ghost",
 *   disabled?: boolean,
 *   loading?: boolean,
 *   class?: string,
 *   onclick?: (event: MouseEvent) => void,
 *   children: import('svelte').Snippet,
 * }}
 */
let {
	type = "button",
	variant = "primary",
	disabled = false,
	loading = false,
	class: className = "",
	onclick,
	children,
} = $props();

const VARIANTS = {
	primary: "btn-primary",
	secondary: "btn-secondary",
	ghost: "btn-ghost",
};
</script>

<button
	{type}
	disabled={disabled || loading}
	class="btn btn-lg w-full {VARIANTS[variant] ?? VARIANTS.primary} {className}"
	{onclick}
>
	{#if loading}
		<span class="spinner spinner-sm loading" aria-hidden="true"></span>
	{/if}
	{@render children()}
</button>

<style>
/* The ring takes the button's text colour, whatever the surface. */
.loading {
	--spinner-color: currentColor;
}
</style>
