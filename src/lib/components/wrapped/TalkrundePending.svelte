<script>
import { getTranslate } from "@tolgee/svelte";
import MicIcon from "$lib/components/icons/MicIcon.svelte";

/**
 * Talkrunde-slot fallback. Rendered when `wrapped.talkrunde.status`
 * is `pending`, `generating`, or `failed` — i.e. the Friday cron
 * stage 1 has run (stats are there) but stage 2 hasn't completed
 * the audio yet. Picks a status-aware copy line.
 *
 * @type {{ status?: "pending"|"generating"|"failed"|string }}
 */
let { status = "pending" } = $props();

const { t } = getTranslate();

const titleKey = $derived.by(() => {
	if (status === "generating")
		return "wrapped.talkrunde.pending_title_generating";
	if (status === "failed") return "wrapped.talkrunde.pending_title_failed";
	return "wrapped.talkrunde.pending_title";
});

const bodyKey = $derived.by(() => {
	if (status === "generating")
		return "wrapped.talkrunde.pending_body_generating";
	if (status === "failed") return "wrapped.talkrunde.pending_body_failed";
	return "wrapped.talkrunde.pending_body";
});
</script>

<section class="pending">
	<div class="icon">
		<MicIcon size={20} />
	</div>
	<div class="body">
		<div class="title">{$t(titleKey)}</div>
		<div class="text">{$t(bodyKey)}</div>
	</div>
</section>

<style>
	.pending {
		background: rgba(255, 255, 255, 0.03);
		border: 1px dashed rgba(255, 255, 255, 0.1);
		border-radius: 18px;
		padding: 16px;
		margin-bottom: 20px;
		display: flex;
		align-items: center;
		gap: 12px;
		color: #e5e7eb;
	}
	.icon {
		width: 40px;
		height: 40px;
		border-radius: 12px;
		background: rgba(245, 158, 11, 0.12);
		border: 1px solid rgba(245, 158, 11, 0.25);
		display: flex;
		align-items: center;
		justify-content: center;
		color: #fbbf24;
		flex-shrink: 0;
	}
	.body {
		flex: 1;
		min-width: 0;
	}
	.title {
		font-size: 12px;
		font-weight: 700;
		color: #e5e7eb;
		margin-bottom: 4px;
	}
	.text {
		font-size: 10px;
		color: #9ca3af;
		line-height: 1.4;
	}
</style>
