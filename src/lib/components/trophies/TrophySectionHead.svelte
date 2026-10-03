<script>
/**
 * Heading of a trophy-room block whose cards stand straight on the page
 * (the shelves and "Zuletzt erhalten"). Design A: a red condensed title
 * like `Section`, the optional aside (e.g. "2 von 9 erreicht") on the
 * right. Design B: white type on the pitch, the category icon in front
 * and the aside as a white pill. Unlike `Section`, B does not wrap the
 * block in a card: the trophy cards are the stickers.
 *
 * @type {{
 *   title: string,
 *   id?: string,
 *   icon?: import('svelte').Snippet,
 *   children?: import('svelte').Snippet,
 * }}
 */
let { title, id = undefined, icon, children } = $props();
</script>

<header class="head">
	{#if icon}
		<span class="icon" aria-hidden="true">{@render icon()}</span>
	{/if}
	<h2 {id} class="section-title title">{title}</h2>
	{#if children}
		<span class="aside">{@render children()}</span>
	{/if}
</header>

<style>
.head {
	display: flex;
	align-items: baseline;
	justify-content: space-between;
	gap: 12px;
}

/* Hidden in A, shown in B (the same switch Section uses). */
.icon {
	display: var(--section-icon-display);
	flex-shrink: 0;
	align-self: center;
}

.title {
	margin: 0;
	min-width: 0;
}

.aside {
	flex-shrink: 0;
	font-size: 13px;
	color: var(--color-on-page);
}

/* ── Design B: white on the pitch ───────────────────────────────────── */
:global([data-variant="b"]) .head {
	align-items: center;
	justify-content: flex-start;
	gap: 10px;
}

:global([data-variant="b"]) .icon {
	color: var(--color-on-page);
	filter: drop-shadow(var(--on-page-shadow));
}

:global([data-variant="b"]) .title {
	font-size: 20px;
	color: var(--color-on-page);
	text-shadow: var(--on-page-shadow);
}

:global([data-variant="b"]) .aside {
	padding: 3px 10px;
	border-radius: 999px;
	background: var(--color-surface);
	color: var(--color-ink);
	font-size: 12px;
	font-weight: 700;
	box-shadow: var(--shadow-control);
}
</style>
