<script>
import { getTranslate } from "@tolgee/svelte";

/**
 * Season selector for the Rangliste — one pill per league season (an
 * EA FC edition), newest first. The current season reads
 * "<edition> · läuft", a closed season "<edition> · Endstand".
 *
 * `value` may be the concrete season id or the "current" alias (the
 * store's default) — a season matches when its id equals `value`, or
 * when `value` is "current" and the season is the current one.
 *
 * @type {{
 *   seasons: Array<{ id: string, game_version: string, is_current: boolean }>,
 *   value: string,
 *   onChange: (next: string) => void,
 * }}
 */
let { seasons = [], value, onChange } = $props();

const { t } = getTranslate();

function isActive(season) {
	return season.id === value || (value === "current" && season.is_current);
}
</script>

{#if seasons.length > 0}
	<div
		class="flex gap-2 overflow-x-auto pb-0.5"
		role="tablist"
		aria-label={$t("leaderboard.season_switch")}
	>
		{#each seasons as season (season.id)}
			<button
				type="button"
				role="tab"
				aria-selected={isActive(season)}
				onclick={() => onChange(season.id)}
				class="shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-bold transition-colors {isActive(
					season,
				)
					? 'bg-brand border-brand text-white'
					: 'bg-surface border-line text-muted hover:text-ink'}"
			>
				{season.game_version}
				<span class="opacity-75 font-semibold">
					· {season.is_current
						? $t("leaderboard.season_running")
						: $t("leaderboard.season_final")}
				</span>
			</button>
		{/each}
	</div>
{/if}
