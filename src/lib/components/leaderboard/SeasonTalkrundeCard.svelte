<script>
import { getTranslate } from "@tolgee/svelte";
import MatchAudioPlayer from "$lib/components/games/MatchAudioPlayer.svelte";
import MicIcon from "$lib/components/icons/MicIcon.svelte";

/**
 * The season special of the talk show for a closed season, shown in
 * the Rangliste's season-end view: title, line-up note and the audio
 * player. Same look as the weekly Talkrunde card on the home page —
 * design A: a navy block with a white mic tile; design B: a white card
 * with the player in its pale green panel.
 *
 * @type {{ audioUrl: string, gameVersion: string }}
 */
let { audioUrl, gameVersion } = $props();

const { t } = getTranslate();

const uid = $props.id();
const titleId = `season-talk-${uid}`;
</script>

<section class="talk" aria-labelledby={titleId}>
	<div class="head">
		<span class="mic" aria-hidden="true"><MicIcon size={24} strokeWidth={2} /></span>
		<div class="flex flex-col gap-1.5 min-w-0">
			<h2 id={titleId} class="title">
				{$t("leaderboard.season_talkrunde.title", { version: gameVersion })}
			</h2>
			<p class="sub">{$t("leaderboard.season_talkrunde.subtitle")}</p>
		</div>
	</div>
	<MatchAudioPlayer {audioUrl} />
</section>

<style>
/* ── Design A: navy block ───────────────────────────────────────────── */
.talk {
	display: flex;
	flex-direction: column;
	gap: 16px;
	padding: 16px;
	background: var(--color-navy);
	color: var(--color-on-navy);
	border-radius: var(--radius-card);
}

.head {
	display: flex;
	align-items: center;
	gap: 12px;
}

.mic {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 48px;
	height: 48px;
	flex-shrink: 0;
	background: var(--color-surface);
	color: var(--color-navy);
	border-radius: var(--radius-tile);
}

.title {
	margin: 0;
	font-family: var(--font-display);
	font-weight: 400;
	font-size: 22px;
	line-height: 0.95;
	text-transform: uppercase;
}

.sub {
	margin: 0;
	font-size: 13px;
	line-height: 1.35;
}

/* ── Design B: white sticker card ───────────────────────────────────── */
:global([data-variant="b"]) .talk {
	gap: 14px;
	padding: 18px;
	background: var(--color-surface);
	color: var(--color-ink);
	box-shadow: var(--shadow-card);
}

:global([data-variant="b"]) .mic {
	width: 44px;
	height: 44px;
	border-radius: 999px;
	background: var(--color-brand);
	color: var(--color-on-brand);
}

:global([data-variant="b"]) .title {
	font-family: var(--font-cond);
	font-weight: 800;
	font-size: 22px;
	line-height: 1.05;
	text-transform: none;
}

:global([data-variant="b"]) .sub {
	color: var(--color-muted);
}
</style>
