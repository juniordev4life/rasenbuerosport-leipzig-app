<script>
/**
 * Compact wrapped tile — small icon, optional player avatar(s) and
 * a category line with primary + secondary detail on the right. Used
 * for everything that isn't the two large MVP/Match-of-the-Week
 * highlights (Torschützenkönig, Aktivster, Aufsteiger, Pechvogel,
 * Heißeste Serie, Top Duo, Trophäen).
 *
 * Slots:
 *   - `icon`  — small category SVG, ~14px
 *   - `avatar` — optional, player gradient circle(s)
 *
 * `valueTone` colours the right-most value text — "up" for ELO
 * gainers (green), "down" for Pechvogel (muted grey, NOT red — the
 * spec is explicit about not bloßstellen), "neutral" / any colour
 * passed as a CSS string.
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

<svelte:element this={Tag} class="card" href={href ?? undefined}>
	{#if icon}
		<div class="icon-wrap">{@render icon()}</div>
	{/if}
	{#if avatar}
		<div class="avatar-wrap">{@render avatar()}</div>
	{/if}
	<div class="body">
		<div class="cat">{categoryLabel}</div>
		<div class="name">{name}</div>
		{#if detail}
			<div class="detail">{detail}</div>
		{/if}
	</div>
	{#if value}
		<div class="value" data-tone={valueTone}>{value}</div>
	{/if}
</svelte:element>

<style>
	.card {
		display: flex;
		align-items: center;
		gap: 12px;
		background: #131822;
		border: 1px solid #1f2937;
		border-radius: 14px;
		padding: 12px 14px;
		margin-bottom: 8px;
		color: #e5e7eb;
		text-decoration: none;
		transition: border-color 0.15s;
	}
	.card:hover {
		border-color: #2a3142;
	}
	.icon-wrap {
		width: 30px;
		height: 30px;
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.06);
		display: flex;
		align-items: center;
		justify-content: center;
		color: #9ca3af;
		flex-shrink: 0;
	}
	.avatar-wrap {
		flex-shrink: 0;
	}
	.body {
		flex: 1;
		min-width: 0;
	}
	.cat {
		font-size: 9px;
		font-weight: 800;
		color: #6b7280;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		margin-bottom: 2px;
	}
	.name {
		font-size: 14px;
		font-weight: 700;
		color: white;
		line-height: 1.2;
	}
	.detail {
		font-size: 11px;
		color: #9ca3af;
		margin-top: 2px;
	}
	.value {
		font-size: 22px;
		font-weight: 800;
		letter-spacing: -0.02em;
		font-variant-numeric: tabular-nums;
		color: #e5e7eb;
		flex-shrink: 0;
	}
	.value[data-tone="up"] {
		color: #84cc16;
	}
	.value[data-tone="down"] {
		color: #94a3b8;
	}
</style>
