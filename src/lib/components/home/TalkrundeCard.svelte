<script>
import { getTranslate } from "@tolgee/svelte";
import MatchAudioPlayer from "$lib/components/games/MatchAudioPlayer.svelte";
import MicIcon from "$lib/components/icons/MicIcon.svelte";
import { REPORTERS } from "$lib/constants/reporters.constants.js";

/**
 * Friday talk-show card: episode title and week, the three reporters and
 * the audio player once an episode exists (otherwise the "first episode
 * on Friday" note). Design A: a navy block with a white mic tile.
 * Design B: plain content on the section card, round reporter photos and
 * the player in its pale green panel.
 *
 * Reporter photos are not clickable here — the bio dialog belongs to the
 * places where a reporter is the lead voice.
 *
 * @type {{
 *   talkrunde?: {
 *     title?: string,
 *     subtitle?: string,
 *     audioUrl?: string|null,
 *     isFresh?: boolean,
 *   } | null,
 * }}
 */
let { talkrunde = null } = $props();

const { t } = getTranslate();

const lineup = [
	{ key: "marcel", reporter: REPORTERS.klassiker },
	{ key: "sophie", reporter: REPORTERS.analyst },
	{ key: "frank", reporter: REPORTERS.euphoriker },
];
</script>

<div class="talk">
	<div class="head">
		<span class="mic" aria-hidden="true"><MicIcon size={24} strokeWidth={2} /></span>
		<div class="flex flex-col gap-1.5 flex-1 min-w-0">
			<span class="flex items-center gap-2.5 flex-wrap">
				<span class="title">{talkrunde?.title ?? $t("home.talkrunde.placeholder_title")}</span>
				{#if talkrunde?.isFresh}
					<span class="chip fresh">{$t("home.talkrunde.new")}</span>
				{/if}
			</span>
			<span class="sub">{talkrunde?.subtitle ?? $t("home.talkrunde.placeholder_subtitle")}</span>
		</div>
	</div>

	<div class="flex items-center gap-2.5">
		<div class="reporters">
			{#each lineup as r (r.key)}
				<img src={r.reporter.imageUrl} alt={r.reporter.name} loading="lazy" />
			{/each}
		</div>
		<span class="text-[13px] leading-snug">
			<strong>Marcel, Sophie &amp; Frank</strong>
			{$t("home.talkrunde.lineup_suffix")}
		</span>
	</div>

	{#if talkrunde?.audioUrl}
		<MatchAudioPlayer audioUrl={talkrunde.audioUrl} />
	{:else}
		<p class="empty">{$t("home.talkrunde.empty_state")}</p>
	{/if}
</div>

<style>
/* ── Design A: navy block ───────────────────────────────────────────── */
.talk {
	display: flex;
	flex-direction: column;
	gap: 16px;
	padding: 16px;
	background: var(--color-navy);
	color: var(--color-on-navy);
	border-radius: var(--radius-tile);
}

.head {
	display: flex;
	align-items: center;
	gap: 12px;
}

.mic {
	width: 48px;
	height: 48px;
	flex-shrink: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	background: var(--color-surface);
	color: var(--color-navy);
	border-radius: var(--radius-tile);
}

.title {
	font-family: var(--font-display);
	font-size: 22px;
	line-height: 0.93;
	text-transform: uppercase;
}

.fresh {
	padding: 4px 8px;
	font-size: 12px;
	background: var(--color-brand);
	color: var(--color-on-brand);
}

.sub {
	font-size: 13px;
}

.reporters {
	display: flex;
	gap: 4px;
	flex-shrink: 0;
}

.reporters img {
	width: 28px;
	height: 28px;
	object-fit: cover;
	background: var(--color-surface);
	border-radius: var(--radius-avatar);
}

.empty {
	margin: 0;
	font-size: 13px;
	font-style: italic;
}

/* ── Design B: content on the section card ──────────────────────────── */
:global([data-variant="b"]) .talk {
	gap: 14px;
	padding: 0;
	background: transparent;
	color: var(--color-ink);
}

:global([data-variant="b"]) .mic {
	display: none;
}

:global([data-variant="b"]) .title {
	font-family: var(--font-cond);
	font-weight: 800;
	font-size: 26px;
	line-height: 1;
	text-transform: none;
}

:global([data-variant="b"]) .fresh {
	padding: 3px 10px;
	background: var(--color-gold);
	color: var(--color-on-gold);
}

:global([data-variant="b"]) .sub,
:global([data-variant="b"]) .empty {
	color: var(--color-muted);
}

:global([data-variant="b"]) .reporters {
	gap: 0;
}

:global([data-variant="b"]) .reporters img {
	width: 34px;
	height: 34px;
	box-shadow: 0 0 0 2px var(--color-surface);
}

:global([data-variant="b"]) .reporters img + img {
	margin-left: -8px;
}
</style>
