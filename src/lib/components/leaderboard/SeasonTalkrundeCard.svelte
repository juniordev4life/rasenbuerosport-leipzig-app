<script>
import { getTranslate } from "@tolgee/svelte";
import MatchAudioPlayer from "$lib/components/games/MatchAudioPlayer.svelte";

/**
 * The season special of the talk show ("Bürowoche") for a closed season,
 * shown in the Rangliste's season-end view. Uses the klassiker palette of
 * the audio player, like the weekly Talkrunde card.
 *
 * @type {{ audioUrl: string, gameVersion: string }}
 */
let { audioUrl, gameVersion } = $props();

const { t } = getTranslate();
</script>

<section
	class="rounded-2xl border border-border bg-bg-card p-4 flex flex-col gap-3"
	aria-label={$t("leaderboard.season_talkrunde.title", { version: gameVersion })}
>
	<div class="flex items-center gap-3">
		<span class="text-2xl" aria-hidden="true">{"\u{1F399}\u{FE0F}"}</span>
		<div class="flex-1 min-w-0">
			<h2 class="text-sm font-extrabold text-text-primary">
				{$t("leaderboard.season_talkrunde.title", { version: gameVersion })}
			</h2>
			<p class="text-xs text-text-secondary">{$t("leaderboard.season_talkrunde.subtitle")}</p>
		</div>
	</div>
	<MatchAudioPlayer {audioUrl} reporterId="klassiker" />
</section>
