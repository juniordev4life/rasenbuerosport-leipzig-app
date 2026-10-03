<script>
/**
 * A titled block of a page. Design A: a red condensed title above the
 * content's own card(s). Design B: one white card holding an icon, the
 * title and the content — cards inside it lose their own frame, so a
 * child can always render a plain `.card`.
 *
 * @type {{
 *   title: string,
 *   href?: string|null,
 *   actionLabel?: string|null,
 *   icon?: import('svelte').Snippet,
 *   children: import('svelte').Snippet,
 *   class?: string,
 * }}
 */
let {
	title,
	href = null,
	actionLabel = null,
	icon,
	children,
	class: className = "",
} = $props();
</script>

<section class="ui-section {className}">
	<header class="ui-section-head">
		{#if icon}
			<span class="section-icon">{@render icon()}</span>
		{/if}
		<h2 class="section-title flex-1 min-w-0">{title}</h2>
		{#if href && actionLabel}
			<a {href} class="link shrink-0">{actionLabel}</a>
		{/if}
	</header>
	{@render children()}
</section>

<style>
.ui-section {
	display: flex;
	flex-direction: column;
	gap: 10px;
	min-width: 0;
}

.ui-section-head {
	display: flex;
	align-items: baseline;
	gap: 10px;
}

:global([data-variant="b"]) .ui-section {
	gap: 12px;
	padding: 18px;
	background: var(--color-surface);
	color: var(--color-ink);
	border-radius: var(--radius-card);
	box-shadow: var(--shadow-card);
}

:global([data-variant="b"]) .ui-section-head {
	align-items: center;
}

/* Cards inside a B section sit flat on its white surface and align with
 * its padding (unlayered, so this wins over Tailwind padding utilities). */
:global([data-variant="b"]) .ui-section :global(.card) {
	padding: 0;
	background: transparent;
	box-shadow: none;
	border-radius: 0;
}
</style>
