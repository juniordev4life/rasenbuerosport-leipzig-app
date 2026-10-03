<script>
import { getTranslate } from "@tolgee/svelte";

/**
 * Stärken / Schwächen / Spielstil tag groups beneath a spider chart
 * (player profile and duo page). Each group is named in text, so the
 * tag colour is never the only cue. Empty groups are left out, and the
 * whole block when all three are empty.
 * Design A: navy chips for strengths, red outlines for weaknesses,
 * condensed caps. Design B: pale green / pale red pills.
 *
 * @type {{
 *   strengths?: Array<{ label: string, perzentil?: string }>,
 *   weaknesses?: Array<{ label: string, perzentil?: string }>,
 *   character?: string[],
 * }}
 */
let { strengths = [], weaknesses = [], character = [] } = $props();

const { t } = getTranslate();

const hasAny = $derived(
	strengths.length > 0 || weaknesses.length > 0 || character.length > 0,
);
</script>

{#snippet tagText(tag)}
	{tag.label}{#if tag.perzentil}<span class="perzentil"> · {tag.perzentil}</span>{/if}
{/snippet}

{#if hasAny}
	<div class="tags">
		{#if strengths.length > 0}
			<div class="group">
				<span class="group-label">↑ {$t("profile.strengths")}</span>
				<ul class="list">
					{#each strengths as tag, i (i)}
						<li class="tag positive">{@render tagText(tag)}</li>
					{/each}
				</ul>
			</div>
		{/if}

		{#if weaknesses.length > 0}
			<div class="group">
				<span class="group-label">↓ {$t("profile.weaknesses")}</span>
				<ul class="list">
					{#each weaknesses as tag, i (i)}
						<li class="tag negative">{@render tagText(tag)}</li>
					{/each}
				</ul>
			</div>
		{/if}

		{#if character.length > 0}
			<div class="group">
				<span class="group-label">{$t("profile.playstyle")}</span>
				<ul class="list">
					{#each character as tag, i (i)}
						<li class="tag neutral">{tag}</li>
					{/each}
				</ul>
			</div>
		{/if}
	</div>
{/if}

<style>
/* ── Design A ───────────────────────────────────────────────────────── */
.tags {
	display: flex;
	flex-direction: column;
	gap: 14px;
	padding-top: 16px;
	border-top: 1px solid var(--color-line);
}

.group {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.group-label {
	font-family: var(--font-label);
	font-weight: var(--label-weight);
	font-size: 13px;
	letter-spacing: var(--label-tracking);
	text-transform: var(--label-case);
}

.list {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
	margin: 0;
	padding: 0;
	list-style: none;
}

.tag {
	padding: 5px 9px;
	border: 1px solid transparent;
	border-radius: var(--radius-badge);
	font-family: var(--font-cond);
	font-weight: 700;
	font-size: 12px;
	line-height: 1.2;
	letter-spacing: 0.03em;
	text-transform: uppercase;
}

.positive {
	border-color: var(--color-navy);
	background: var(--color-navy);
	color: var(--color-on-navy);
}

.negative {
	border-color: var(--color-loss);
	color: var(--color-loss);
}

.neutral {
	border-color: var(--color-ink);
	color: var(--color-ink);
}

/* ── Design B: soft pills ───────────────────────────────────────────── */
:global([data-variant="b"]) .tags {
	gap: 12px;
	padding-top: 14px;
}

:global([data-variant="b"]) .group {
	gap: 6px;
}

:global([data-variant="b"]) .tag {
	padding: 6px 12px;
	border: 0;
	font-family: var(--font-sans);
	font-size: 13px;
	letter-spacing: 0;
	text-transform: none;
}

:global([data-variant="b"]) .positive {
	background: var(--color-win-soft);
	color: var(--color-win);
}

:global([data-variant="b"]) .negative {
	background: var(--color-loss-soft);
	color: var(--color-loss);
}

:global([data-variant="b"]) .neutral {
	background: var(--color-sunken);
	color: var(--color-ink);
}
</style>
