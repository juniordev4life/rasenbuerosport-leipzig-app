<script>
import { getTranslate } from "@tolgee/svelte";

/**
 * Stärken / Schwächen / Spielstil pill groups beneath the spider
 * chart. Hidden groups (no entries) collapse silently.
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

{#if hasAny}
	<div class="tags-block">
		{#if strengths.length > 0}
			<div class="tags-group strengths">
				<div class="tags-group-label">↑ {$t("profile.strengths")}</div>
				<div class="tags-list">
					{#each strengths as tag, i (i)}
						<div class="tag positive">
							{tag.label}
							{#if tag.perzentil}<span class="perzentil">{tag.perzentil}</span>{/if}
						</div>
					{/each}
				</div>
			</div>
		{/if}

		{#if weaknesses.length > 0}
			<div class="tags-group weaknesses">
				<div class="tags-group-label">↓ {$t("profile.weaknesses")}</div>
				<div class="tags-list">
					{#each weaknesses as tag, i (i)}
						<div class="tag negative">
							{tag.label}
							{#if tag.perzentil}<span class="perzentil">{tag.perzentil}</span>{/if}
						</div>
					{/each}
				</div>
			</div>
		{/if}

		{#if character.length > 0}
			<div class="tags-group character">
				<div class="tags-group-label">{$t("profile.playstyle")}</div>
				<div class="tags-list">
					{#each character as tag, i (i)}
						<div class="tag neutral">{tag}</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>
{/if}

<style>
.tags-block {
	margin-top: 14px;
	padding-top: 14px;
	border-top: 1px solid #1F2937;
}
.tags-group { margin-bottom: 12px; }
.tags-group:last-child { margin-bottom: 0; }
.tags-group-label {
	font-size: 9px;
	text-transform: uppercase;
	letter-spacing: 0.08em;
	font-weight: 700;
	margin-bottom: 6px;
}
.tags-group.strengths .tags-group-label { color: #84CC16; }
.tags-group.weaknesses .tags-group-label { color: #E24B4A; }
.tags-group.character .tags-group-label { color: #9CA3AF; }
.tags-list { display: flex; gap: 5px; flex-wrap: wrap; }
.tag {
	font-size: 11px; font-weight: 600;
	padding: 4px 9px; border-radius: 999px;
}
.tag.positive {
	background: rgba(132, 204, 22, 0.12);
	color: #84CC16;
	border: 1px solid rgba(132, 204, 22, 0.25);
}
.tag.negative {
	background: rgba(226, 75, 74, 0.12);
	color: #E24B4A;
	border: 1px solid rgba(226, 75, 74, 0.25);
}
.tag.neutral {
	background: rgba(255,255,255,0.04);
	color: #D1D5DB;
	border: 1px solid #2A3142;
}
.tag .perzentil {
	font-size: 9px;
	opacity: 0.8;
	margin-left: 4px;
	font-weight: 700;
}
</style>
