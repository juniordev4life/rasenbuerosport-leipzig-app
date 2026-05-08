<script>
import { getTranslate } from "@tolgee/svelte";

/**
 * Renders the Match-of-the-Week block of the weekly Wrapped payload —
 * a hero card with the long-form AI narrative.
 *
 * @typedef {Object} MatchOfTheWeekProps
 * @property {{
 *   game_id: string, score: string, result_type?: string,
 *   played_at: string, drama_score?: number,
 *   report: string,
 * }|null} match
 */
let { match } = $props();

const { t } = getTranslate();
</script>

{#if match}
	<a
		href={`/app/games/${match.game_id}`}
		class="block bg-gradient-to-br from-warning/15 to-accent-red/10 border border-warning/30 rounded-2xl p-5 mx-4 hover:border-warning/60 transition-colors"
	>
		<div class="flex items-baseline justify-between gap-3 mb-2">
			<p class="text-[10px] uppercase tracking-widest text-warning font-bold">
				🎬 {$t("wrapped.match_of_the_week_title")}
			</p>
			<span class="text-2xl font-black text-text-primary tabular-nums">{match.score}</span>
		</div>
		<p class="text-sm leading-relaxed text-text-primary whitespace-pre-line">
			{match.report}
		</p>
		<p class="text-[10px] text-text-secondary mt-3">
			{$t("wrapped.match_of_the_week_open")} →
		</p>
	</a>
{/if}
