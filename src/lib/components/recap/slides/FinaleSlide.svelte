<script>
import { getTranslate } from "@tolgee/svelte";
import { goto } from "$app/navigation";
import MatchAudioPlayer from "$lib/components/games/MatchAudioPlayer.svelte";
import { getReporter } from "$lib/constants/reporters.constants.js";
import { ROUTES } from "$lib/constants/routes.constants.js";
import RecapCard from "../RecapCard.svelte";
import RecapSlide from "../RecapSlide.svelte";

/**
 * Slide 10 — the finale: the AI season summary (if generated) in the
 * voice of one of the reporters, the Talkrunde recording (if ready),
 * the player's FC27 starting rating and a CTA back to the live
 * Rangliste.
 *
 * @type {{ recap: object }}
 */
let { recap } = $props();

const { t } = getTranslate();

const startElo = $derived(recap.elo?.new_rating ?? recap.elo?.end ?? null);
const talkrunde = $derived(recap.league?.talkrunde ?? null);
const hasAudio = $derived(
	talkrunde?.status === "ready" && Boolean(talkrunde.audio_url),
);
/** The summary's persona is a reporter id ("euphoriker" → Frank). */
const reporter = $derived(getReporter(recap.ai_summary?.persona));
</script>

<RecapSlide>
	{#if recap.ai_summary?.text || hasAudio}
		<RecapCard panel>
			{#if recap.ai_summary?.text}
				<div class="persona">
					{#if reporter}
						<img src={reporter.imageUrl} alt="" class="persona-photo" loading="lazy" />
					{/if}
					<p class="persona-label">
						{$t("season_recap.finale.persona", {
							persona: reporter?.name ?? recap.ai_summary.persona ?? "",
						})}
					</p>
				</div>
				<p class="summary bubble">{recap.ai_summary.text}</p>
			{/if}
			{#if hasAudio}
				<MatchAudioPlayer audioUrl={talkrunde.audio_url} />
			{/if}
		</RecapCard>
	{/if}

	{#if startElo != null}
		<RecapCard>
			<p class="next-season">
				{$t("season_recap.finale.next_season", { rating: startElo })}
			</p>
		</RecapCard>
	{/if}

	<button
		type="button"
		onclick={() => goto(ROUTES.LEADERBOARD)}
		class="btn btn-lg btn-accent cta"
	>
		{$t("season_recap.finale.cta")}
	</button>
</RecapSlide>

<style>
.persona {
	display: flex;
	align-items: center;
	gap: 10px;
}

.persona-photo {
	width: 40px;
	height: 40px;
	flex-shrink: 0;
	object-fit: cover;
	border-radius: var(--radius-avatar);
	background: var(--color-sunken);
}

.persona-label {
	margin: 0;
	font-family: var(--font-label);
	font-weight: var(--label-weight);
	text-transform: var(--label-case);
	letter-spacing: var(--label-tracking);
	font-size: 13px;
	color: var(--color-brand);
}

.summary {
	margin: 0;
	font-size: 16px;
	line-height: 1.45;
}

.next-season {
	margin: 0;
	font-family: var(--font-cond);
	font-weight: 700;
	font-size: 20px;
	line-height: 1.2;
	letter-spacing: 0.02em;
	text-transform: uppercase;
}

.cta {
	width: 100%;
}

/* B: the summary in the shared speech `.bubble`, like Frank's verdict on
 * Home. */
:global([data-variant="b"]) .persona-photo {
	box-shadow: 0 0 0 3px var(--color-gold);
}

:global([data-variant="b"]) .persona-label {
	color: var(--color-muted);
}

:global([data-variant="b"]) .summary {
	font-weight: 500;
}

:global([data-variant="b"]) .next-season {
	font-weight: 800;
	letter-spacing: 0;
	text-transform: none;
}
</style>
