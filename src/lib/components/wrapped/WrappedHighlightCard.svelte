<script>
import { goto } from "$app/navigation";

/**
 * Large highlight card used for the MVP block and the Match-of-the-
 * Week block on the wrapped page. Two visual variants pinned by
 * `variant`:
 *
 *   - "mvp"      — gold accent, player-avatar circle on the left
 *   - "match"    — purple accent, star-icon circle on the left
 *
 * Snippet slot lets the page decide what fills the avatar/icon
 * slot — a profile picture for MVP, an SVG icon for the match
 * card. Tap on the card navigates to the supplied `href` (player
 * profile or match detail page); plain `<a>` semantics for
 * accessibility and right-click-to-open.
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

{#if href}
	<a
		{href}
		class="highlight {variant}"
		data-variant={variant}
		onkeydown={handleKey}
	>
		<div class="visual">{@render visual()}</div>
		<div class="body">
			<div class="cat">{categoryLabel}</div>
			<div class="title">{title}</div>
			<div class="detail">{detail}</div>
		</div>
	</a>
{:else}
	<div class="highlight {variant}" data-variant={variant}>
		<div class="visual">{@render visual()}</div>
		<div class="body">
			<div class="cat">{categoryLabel}</div>
			<div class="title">{title}</div>
			<div class="detail">{detail}</div>
		</div>
	</div>
{/if}

<style>
	.highlight {
		display: grid;
		grid-template-columns: 68px 1fr;
		gap: 14px;
		align-items: center;
		border-radius: 18px;
		padding: 16px;
		margin-bottom: 12px;
		color: #e5e7eb;
		text-decoration: none;
		position: relative;
		overflow: hidden;
		border: 1px solid;
	}
	.highlight.mvp {
		background:
			radial-gradient(
				ellipse at top right,
				rgba(251, 191, 36, 0.18) 0%,
				transparent 60%
			),
			linear-gradient(180deg, #1a1f2a 0%, #131822 100%);
		border-color: rgba(251, 191, 36, 0.35);
	}
	.highlight.match {
		background:
			radial-gradient(
				ellipse at top right,
				rgba(168, 85, 247, 0.18) 0%,
				transparent 60%
			),
			linear-gradient(180deg, #1a1f2a 0%, #131822 100%);
		border-color: rgba(168, 85, 247, 0.35);
	}
	.highlight::before {
		content: "";
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 2px;
		opacity: 0.6;
	}
	.highlight.mvp::before {
		background: linear-gradient(
			90deg,
			transparent,
			#fbbf24 50%,
			transparent
		);
	}
	.highlight.match::before {
		background: linear-gradient(
			90deg,
			transparent,
			#a855f7 50%,
			transparent
		);
	}
	.visual {
		width: 68px;
		height: 68px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}
	.body {
		min-width: 0;
	}
	.cat {
		font-size: 10px;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		margin-bottom: 4px;
		display: flex;
		align-items: center;
		gap: 5px;
	}
	.highlight.mvp .cat {
		color: #fbbf24;
	}
	.highlight.match .cat {
		color: #a855f7;
	}
	.title {
		font-size: 18px;
		font-weight: 800;
		color: white;
		letter-spacing: -0.01em;
		line-height: 1.15;
		margin-bottom: 4px;
	}
	.detail {
		font-size: 12px;
		color: #9ca3af;
	}
</style>
