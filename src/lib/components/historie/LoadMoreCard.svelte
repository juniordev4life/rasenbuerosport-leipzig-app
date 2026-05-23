<script>
import { getTranslate } from "@tolgee/svelte";

/**
 * Pagination-trigger card shown at the end of the Historie list.
 *
 * @type {{ remaining?: number|null, loading?: boolean, onClick: () => void }}
 */
let { remaining = null, loading = false, onClick } = $props();

const { t } = getTranslate();
</script>

<button type="button" class="card" onclick={onClick} disabled={loading}>
	{#if loading}
		<div class="text">{$t("historie.load_more_loading")}</div>
	{:else}
		<div class="text">
			{#if remaining != null}
				{$t("historie.load_more_remaining", { count: remaining })}
			{:else}
				{$t("historie.load_more")}
			{/if}
		</div>
		<div class="meta">↓ {$t("historie.load_more_hint")}</div>
	{/if}
</button>

<style>
.card {
	margin: 16px 2px 0;
	width: calc(100% - 4px);
	background: #131822;
	border: 1px solid #1F2937;
	border-radius: 14px;
	padding: 14px;
	text-align: center;
	cursor: pointer;
	transition: background-color .15s;
	color: inherit;
}
.card:active:not(:disabled) { background: #1A1F2A; }
.card:disabled { opacity: 0.6; cursor: wait; }
.text {
	font-size: 12px;
	color: #9CA3AF;
	font-weight: 600;
}
.meta {
	font-size: 10px;
	color: #6B7280;
	margin-top: 3px;
}
</style>
