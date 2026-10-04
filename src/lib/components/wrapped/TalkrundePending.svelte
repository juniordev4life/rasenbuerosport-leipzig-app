<script>
import { getTranslate } from "@tolgee/svelte";
import MicIcon from "$lib/components/icons/MicIcon.svelte";

/**
 * Talkrunde-slot fallback. Rendered when `wrapped.talkrunde.status`
 * is `pending`, `generating`, or `failed` — i.e. the Friday cron
 * stage 1 has run (stats are there) but stage 2 hasn't completed
 * the audio yet. Picks a status-aware copy line. The page wraps it in
 * the "Talkrunde" Section: a white card in design A, plain content on
 * the section card in design B.
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

<div class="card pending" class:failed={status === "failed"}>
	<span class="icon" aria-hidden="true">
		<MicIcon size={22} strokeWidth={2} />
	</span>
	<div class="body">
		<p class="title">{$t(titleKey)}</p>
		<p class="text">{$t(bodyKey)}</p>
	</div>
</div>

<style>
.pending {
	display: flex;
	align-items: center;
	gap: 14px;
	padding: 16px;
}

.icon {
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	width: 48px;
	height: 48px;
	border-radius: var(--radius-tile);
	background: var(--color-navy);
	color: var(--color-on-navy);
}

.failed .icon {
	background: var(--color-loss-soft);
	color: var(--color-loss);
}

.body {
	flex: 1;
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.title {
	margin: 0;
	font-family: var(--font-cond);
	font-weight: 700;
	font-size: 18px;
	line-height: 1.15;
	letter-spacing: 0.02em;
	text-transform: uppercase;
}

.text {
	margin: 0;
	font-size: 14px;
	line-height: 1.4;
	color: var(--color-muted);
}

:global([data-variant="b"]) .icon {
	border-radius: 999px;
	background: var(--color-gold-soft);
	color: var(--color-ink);
}

:global([data-variant="b"]) .failed .icon {
	background: var(--color-loss-soft);
	color: var(--color-loss);
}

:global([data-variant="b"]) .title {
	font-weight: 800;
	font-size: 20px;
	letter-spacing: 0;
	text-transform: none;
}
</style>
