<script>
import { getTranslate } from "@tolgee/svelte";

/**
 * Highlight reel section on the game detail page. Renders the office capture
 * pipeline's result based on `videoStatus`:
 *  - "ready"      → HTML5 video player with `highlightUrl`
 *  - "processing" → "being created" notice (the parent polls until ready)
 *  - "failed"     → quiet "no highlights" note
 *  - anything else / null → nothing (older games without a recording)
 *
 * @type {{ videoStatus: string|null|undefined, highlightUrl: string|null|undefined }}
 */
let { videoStatus, highlightUrl } = $props();

const { t } = getTranslate();
</script>

{#if videoStatus === "ready" && highlightUrl}
	<section class="rounded-xl border border-border bg-bg-card overflow-hidden">
		<div class="px-4 pt-3 pb-2 text-[10px] tracking-[0.08em] uppercase text-text-muted font-semibold">
			{$t("game_detail.highlights.title")}
		</div>
		<!-- svelte-ignore a11y_media_has_caption -->
		<video
			controls
			playsinline
			preload="metadata"
			class="w-full aspect-video bg-black"
			src={highlightUrl}
		></video>
	</section>
{:else if videoStatus === "processing"}
	<section
		class="rounded-xl border border-border bg-bg-card px-4 py-5 flex items-center gap-3"
	>
		<div
			class="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-accent-red border-t-transparent"
			aria-hidden="true"
		></div>
		<div>
			<div class="text-sm font-semibold text-text-primary">
				{$t("game_detail.highlights.processing_title")}
			</div>
			<div class="text-xs text-text-secondary mt-0.5">
				{$t("game_detail.highlights.processing_hint")}
			</div>
		</div>
	</section>
{:else if videoStatus === "failed"}
	<section class="rounded-xl border border-border bg-bg-card px-4 py-3">
		<div class="text-xs text-text-secondary">
			{$t("game_detail.highlights.failed")}
		</div>
	</section>
{/if}
