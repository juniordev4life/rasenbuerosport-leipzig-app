<script>
/**
 * Compact wrapped card — the player's avatar (or, without one, the
 * category icon in a tile), the category with its small icon, the name
 * with a secondary detail line, and a value on the right. Used for
 * everything that isn't the two large MVP/Match-of-the-Week highlights
 * (Torschützenkönig, Aktivster, Aufsteiger, Pechvogel, Heißeste Serie,
 * Top Duo, Trophäen).
 *
 * Slots:
 *   - `icon`  — small category line icon, ~14px
 *   - `avatar` — optional, player avatar(s)
 *
 * `valueTone` colours the right-most value text — "up" for ELO gainers
 * (green in design B; navy like all text in A, where the "+" carries
 * it), "down" for Pechvogel (muted grey, NOT red — the spec is
 * explicit about not bloßstellen), "neutral" for everything else.
 *
 * @type {{
 *   categoryLabel: string,
 *   name: string,
 *   detail?: string|null,
 *   value?: string|null,
 *   valueTone?: "up"|"down"|"neutral"|string,
 *   href?: string|null,
 *   icon?: import('svelte').Snippet,
 *   avatar?: import('svelte').Snippet,
 * }}
 */
let {
	categoryLabel,
	name,
	detail = null,
	value = null,
	valueTone = "neutral",
	href = null,
	icon,
	avatar,
} = $props();

const Tag = $derived(href ? "a" : "div");
</script>

<svelte:element this={Tag} class="card compact" href={href ?? undefined}>
	{#if avatar}
		<span class="visual">{@render avatar()}</span>
	{:else if icon}
		<span class="visual icon-tile" aria-hidden="true">{@render icon()}</span>
	{/if}
	<span class="body">
		<span class="cat">
			{#if avatar && icon}
				<span class="cat-icon" aria-hidden="true">{@render icon()}</span>
			{/if}
			{categoryLabel}
		</span>
		<span class="name">{name}</span>
		{#if detail}
			<span class="detail">{detail}</span>
		{/if}
	</span>
	{#if value}
		<span class="num value" data-tone={valueTone}>{value}</span>
	{/if}
</svelte:element>

<style>
.compact {
	display: flex;
	align-items: center;
	gap: 14px;
	height: 100%;
	padding: 14px 16px;
	color: var(--color-ink);
	text-decoration: none;
	transition: box-shadow 150ms;
}

a.compact:hover {
	box-shadow: var(--shadow-raised);
}

.visual {
	display: flex;
	flex-shrink: 0;
}

.icon-tile {
	align-items: center;
	justify-content: center;
	width: 40px;
	height: 40px;
	border-radius: var(--radius-tile);
	background: var(--color-navy);
	color: var(--color-on-navy);
}

.body {
	display: flex;
	flex-direction: column;
	gap: 3px;
	flex: 1;
	min-width: 0;
}

.cat {
	display: flex;
	align-items: center;
	gap: 5px;
	font-family: var(--font-label);
	font-weight: var(--label-weight);
	text-transform: var(--label-case);
	letter-spacing: var(--label-tracking);
	font-size: 12px;
	line-height: 1.2;
	color: var(--color-brand);
}

.cat-icon {
	display: inline-flex;
	flex-shrink: 0;
}

.name {
	font-weight: 700;
	font-size: 15px;
	line-height: 1.25;
	overflow-wrap: anywhere;
}

.detail {
	font-size: 13px;
	line-height: 1.3;
	color: var(--color-muted);
}

.value {
	flex-shrink: 0;
	font-size: 30px;
}

.value[data-tone="up"] {
	color: var(--color-win);
}

.value[data-tone="down"] {
	color: var(--color-muted);
}

/* ── Design B: round icon tile, muted category, green gains ──────────── */
:global([data-variant="b"]) .compact {
	padding: 14px 18px;
}

:global([data-variant="b"]) .icon-tile {
	border-radius: 999px;
	background: var(--color-gold-soft);
	color: var(--color-ink);
}

:global([data-variant="b"]) .cat {
	color: var(--color-muted);
}

:global([data-variant="b"]) .cat-icon {
	color: var(--color-brand);
}
</style>
