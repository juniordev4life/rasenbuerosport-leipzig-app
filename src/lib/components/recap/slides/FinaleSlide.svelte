<script>
import { getTranslate } from "@tolgee/svelte";
import { goto } from "$app/navigation";
import MatchAudioPlayer from "$lib/components/games/MatchAudioPlayer.svelte";

/**
 * Slide 10 — the finale: the AI season summary (if generated), the
 * Talkrunde recording (if ready), the player's FC27 starting rating
 * and a CTA back to the live Rangliste.
 *
 * @type {{ recap: object }}
 */
let { recap } = $props();

const { t } = getTranslate();

const startElo = $derived(recap.elo?.new_rating ?? recap.elo?.end ?? null);
const talkrunde = $derived(recap.league?.talkrunde ?? null);
</script>

<div class="flex flex-col items-center text-center gap-5 w-full">
	{#if recap.ai_summary?.text}
		<div class="w-full rounded-2xl bg-white/5 p-4 text-left">
			<div class="text-[10px] uppercase tracking-wide text-white/40 font-bold mb-1.5">
				{$t("season_recap.finale.persona", { persona: recap.ai_summary.persona ?? "" })}
			</div>
			<p class="text-[13px] leading-relaxed text-white/85">{recap.ai_summary.text}</p>
		</div>
	{/if}

	{#if talkrunde?.status === "ready" && talkrunde.audio_url}
		<div class="w-full">
			<MatchAudioPlayer audioUrl={talkrunde.audio_url} />
		</div>
	{/if}

	{#if startElo != null}
		<p class="text-sm text-white/70">
			{$t("season_recap.finale.next_season", { rating: startElo })}
		</p>
	{/if}

	<button
		type="button"
		onclick={() => goto("/app/leaderboard")}
		class="mt-2 rounded-full bg-[#E24B4A] text-white text-sm font-bold px-6 py-3"
	>
		{$t("season_recap.finale.cta")}
	</button>
</div>
