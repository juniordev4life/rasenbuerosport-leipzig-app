<script>
import { getTranslate } from "@tolgee/svelte";
import MatchAudioPlayer from "$lib/components/games/MatchAudioPlayer.svelte";
import { REPORTERS } from "$lib/constants/reporters.constants.js";

/**
 * Talkrunde block on the wrapped page — the three reporters, the
 * "Marcel, Sophie & Frank discuss the week" line and the shared
 * `<MatchAudioPlayer>`. The page wraps it in a "Talkrunde" Section.
 * Same look as the talk show on Home: design A a navy block, design B
 * plain content on the section card with the player in its pale green
 * panel.
 *
 * @type {{ audioUrl: string|null }}
 */
let { audioUrl = null } = $props();

const { t } = getTranslate();

const lineup = [
	{ key: "marcel", reporter: REPORTERS.klassiker },
	{ key: "sophie", reporter: REPORTERS.analyst },
	{ key: "frank", reporter: REPORTERS.euphoriker },
];
</script>

<div class="talk">
	<div class="lineup">
		<div class="reporters">
			{#each lineup as r (r.key)}
				<img src={r.reporter.imageUrl} alt={r.reporter.name} loading="lazy" />
			{/each}
		</div>
		<p class="lineup-text">
			<strong>Marcel, Sophie &amp; Frank</strong>
			{$t("wrapped.talkrunde.lineup_suffix")}
		</p>
	</div>

	<MatchAudioPlayer {audioUrl} />
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

.lineup {
	display: flex;
	align-items: center;
	gap: 12px;
}

.reporters {
	display: flex;
	gap: 4px;
	flex-shrink: 0;
}

.reporters img {
	width: 36px;
	height: 36px;
	object-fit: cover;
	background: var(--color-surface);
	border-radius: var(--radius-avatar);
}

.lineup-text {
	margin: 0;
	font-size: 14px;
	line-height: 1.35;
}

/* Keep the focus ring visible on navy (the default ring is navy too). */
.talk :global(:focus-visible) {
	outline-color: var(--color-on-navy);
}

/* ── Design B: content on the section card ──────────────────────────── */
:global([data-variant="b"]) .talk {
	gap: 14px;
	padding: 0;
	background: transparent;
	color: var(--color-ink);
}

:global([data-variant="b"]) .talk :global(:focus-visible) {
	outline-color: var(--color-gold);
}

:global([data-variant="b"]) .reporters {
	gap: 0;
}

:global([data-variant="b"]) .reporters img {
	box-shadow: 0 0 0 2px var(--color-surface);
}

:global([data-variant="b"]) .reporters img + img {
	margin-left: -8px;
}
</style>
