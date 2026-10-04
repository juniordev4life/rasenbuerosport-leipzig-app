<script>
import { goto } from "$app/navigation";
import TrophyIcon from "$lib/components/icons/TrophyIcon.svelte";

/**
 * Large highlight card used for the MVP block on the wrapped page: a
 * coloured band naming the category over the visual (usually the
 * player's avatar), the title and a detail line. `variant` pins the
 * band colour:
 *
 *   - "mvp"   — gold band with a trophy, like the leader cards
 *   - "match" — navy band with a star
 *
 * The page decides what fills the visual slot. Tap on the card
 * navigates to the supplied `href` (player profile or match detail
 * page); plain `<a>` semantics for accessibility and
 * right-click-to-open.
 *
 * @type {{
 *   variant: "mvp"|"match",
 *   categoryLabel: string,
 *   title: string,
 *   detail: string,
 *   href?: string|null,
 *   visual: import('svelte').Snippet,
 * }}
 */
let { variant, categoryLabel, title, detail, href = null, visual } = $props();

function handleKey(event) {
	if (!href) return;
	if (event.key === "Enter" || event.key === " ") {
		event.preventDefault();
		goto(href);
	}
}
</script>

{#snippet content()}
	<span class="band">
		<span class="band-icon" aria-hidden="true">
			{#if variant === "mvp"}
				<TrophyIcon size={18} strokeWidth={2} />
			{:else}
				<svg
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					width="16"
					height="16"
				>
					<polygon
						points="12 2 15 8.5 22 9.3 17 14 18.2 21 12 17.8 5.8 21 7 14 2 9.3 9 8.5 12 2"
					/>
				</svg>
			{/if}
		</span>
		{categoryLabel}
	</span>
	<span class="body">
		<span class="visual">{@render visual()}</span>
		<span class="text">
			<span class="page-title title">{title}</span>
			<span class="detail">{detail}</span>
		</span>
	</span>
{/snippet}

{#if href}
	<a {href} class="card highlight {variant}" onkeydown={handleKey}>
		{@render content()}
	</a>
{:else}
	<div class="card highlight {variant}">
		{@render content()}
	</div>
{/if}

<style>
.highlight {
	display: flex;
	flex-direction: column;
	height: 100%;
	overflow: hidden;
	color: var(--color-ink);
	text-decoration: none;
	transition: box-shadow 150ms;
}

a.highlight:hover {
	box-shadow: var(--shadow-raised);
}

.band {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 9px 16px;
	font-family: var(--font-cond);
	font-weight: 700;
	font-size: 14px;
	line-height: 1.2;
	letter-spacing: 0.03em;
	text-transform: uppercase;
}

.band-icon {
	display: inline-flex;
}

.mvp .band {
	background: var(--color-gold);
	color: var(--color-on-gold);
}

.match .band {
	background: var(--color-navy);
	color: var(--color-on-navy);
}

.body {
	display: flex;
	flex: 1;
	align-items: center;
	gap: 16px;
	padding: 16px;
}

.visual {
	display: flex;
	flex-shrink: 0;
}

.text {
	display: flex;
	flex-direction: column;
	gap: 6px;
	min-width: 0;
}

.title {
	font-size: 30px;
	overflow-wrap: anywhere;
}

.detail {
	font-size: 14px;
	line-height: 1.35;
	color: var(--color-muted);
}

/* ── Design B: sticker card with a bold sentence-case band ───────────── */
:global([data-variant="b"]) .band {
	padding: 8px 18px;
	font-weight: 800;
	font-size: 17px;
	letter-spacing: 0;
	text-transform: none;
}

:global([data-variant="b"]) .body {
	padding: 16px 18px 18px;
}

:global([data-variant="b"]) .mvp .visual :global(.avatar) {
	box-shadow: 0 0 0 4px var(--color-gold);
}
</style>
