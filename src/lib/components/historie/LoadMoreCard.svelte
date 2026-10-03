<script>
import { getTranslate } from "@tolgee/svelte";

/**
 * "Weitere Matches laden" at the end of the Historie list: a centred
 * secondary pill (navy outline in A, white sticker pill in B) that shows
 * a spinner while the next page loads.
 *
 * @type {{ remaining?: number|null, loading?: boolean, onClick: () => void }}
 */
let { remaining = null, loading = false, onClick } = $props();

const { t } = getTranslate();
</script>

<div class="load-more">
	<button
		type="button"
		class="btn btn-secondary"
		onclick={onClick}
		disabled={loading}
		aria-busy={loading}
	>
		{#if loading}
			<span class="spinner spinner-sm load-spinner" aria-hidden="true"></span>
			{$t("historie.load_more_loading")}
		{:else if remaining != null}
			{$t("historie.load_more_remaining", { count: remaining })}
		{:else}
			{$t("historie.load_more")}
		{/if}
	</button>
</div>

<style>
.load-more {
	display: flex;
	justify-content: center;
}

/* The ring takes the button's text colour on any surface. */
.load-spinner {
	--spinner-color: currentColor;
}

:global([data-variant="b"]) .load-more .btn {
	min-height: 48px;
}
</style>
