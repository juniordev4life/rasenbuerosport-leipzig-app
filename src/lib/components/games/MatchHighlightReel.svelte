<script>
import { getTranslate } from "@tolgee/svelte";
import PlayIcon from "$lib/components/icons/PlayIcon.svelte";
import Section from "$lib/components/ui/Section.svelte";

/**
 * "Highlights" section on the match detail page. Renders the office
 * capture pipeline's result based on `videoStatus`:
 *  - "ready"      → HTML5 video player with `highlightUrl`
 *  - "processing" → "being created" notice (the parent polls until ready)
 *  - "failed"     → quiet "no highlights" note
 *  - anything else / null → nothing (older games without a recording)
 *
 * @type {{
 *   videoStatus: string|null|undefined,
 *   highlightUrl: string|null|undefined,
 *   class?: string,
 * }}
 */
let { videoStatus, highlightUrl, class: className = "" } = $props();

const { t } = getTranslate();

const ready = $derived(videoStatus === "ready" && Boolean(highlightUrl));
const visible = $derived(
	ready || videoStatus === "processing" || videoStatus === "failed",
);
</script>

{#if visible}
	<Section title={$t("game_detail.highlights.title")} class={className}>
		{#snippet icon()}<PlayIcon size={20} />{/snippet}
		{#if ready}
			<div class="card reel">
				<!-- svelte-ignore a11y_media_has_caption -->
				<video controls playsinline preload="metadata" src={highlightUrl}></video>
			</div>
		{:else if videoStatus === "processing"}
			<div class="card notice" role="status">
				<span class="spinner spinner-sm" aria-hidden="true"></span>
				<div>
					<p class="notice-title">{$t("game_detail.highlights.processing_title")}</p>
					<p>{$t("game_detail.highlights.processing_hint")}</p>
				</div>
			</div>
		{:else}
			<p class="card notice">{$t("game_detail.highlights.failed")}</p>
		{/if}
	</Section>
{/if}

<style>
.reel {
	overflow: hidden;
}

/* Black behind the video is a media scrim, the one place it is allowed. */
video {
	display: block;
	width: 100%;
	aspect-ratio: 16 / 9;
	border-radius: var(--radius-tile);
	background: var(--color-black);
}
</style>
