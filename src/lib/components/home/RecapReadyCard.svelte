<script>
import { getTranslate } from "@tolgee/svelte";

/**
 * "Your recap is ready" banner shown on the dashboard while a closed
 * season's recap is fresh — see `isRecentlyGenerated` in
 * `recapStory.utils.js` for the 14-day freshness window.
 *
 * @type {{ seasonId: string, gameVersion: string }}
 */
let { seasonId, gameVersion } = $props();

const { t } = getTranslate();
</script>

<a
	href={`/app/recap/${seasonId}`}
	class="flex items-center gap-3 rounded-2xl border border-accent-red/30 bg-accent-red/10 px-4 py-3.5 hover:bg-accent-red/15 transition-colors"
>
	<span class="text-2xl" aria-hidden="true">{"\u{1F3C6}"}</span>
	<div class="flex-1 min-w-0">
		<div class="text-sm font-extrabold text-text-primary">
			{$t("home.recap_card.title", { version: gameVersion })}
		</div>
		<div class="text-xs text-text-secondary">{$t("home.recap_card.subtitle")}</div>
	</div>
	<span class="text-accent-red font-bold text-sm shrink-0">{$t("home.recap_card.cta")}</span>
</a>
