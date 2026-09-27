<script>
import { getTranslate } from "@tolgee/svelte";
import CountUpNumber from "../CountUpNumber.svelte";

/**
 * Slide 3 — goals: total goals, assists, goals per game, hattricks
 * and clean sheets.
 *
 * @type {{ recap: object, reducedMotion: boolean }}
 */
let { recap, reducedMotion } = $props();

const { t } = getTranslate();
const stats = $derived(recap.stats ?? {});
</script>

<div class="flex flex-col items-center text-center gap-5 w-full">
	<h2 class="text-xs uppercase tracking-[0.2em] text-white/50 font-bold">
		{$t("season_recap.goals.title")}
	</h2>
	<div class="text-6xl font-extrabold text-[#F59E0B]">
		<CountUpNumber value={stats.goals ?? 0} reduced={reducedMotion} />
	</div>
	<p class="text-sm text-white/60 -mt-3">{$t("season_recap.goals.goals_label")}</p>

	<div class="grid grid-cols-2 gap-3 w-full max-w-xs text-left">
		<div class="rounded-xl bg-white/5 p-3">
			<div class="text-xl font-extrabold">
				<CountUpNumber value={stats.assists ?? 0} reduced={reducedMotion} />
			</div>
			<div class="text-[11px] text-white/50">{$t("season_recap.goals.assists")}</div>
		</div>
		<div class="rounded-xl bg-white/5 p-3">
			<div class="text-xl font-extrabold">{stats.goals_per_game?.toFixed(2) ?? "—"}</div>
			<div class="text-[11px] text-white/50">{$t("season_recap.goals.per_game")}</div>
		</div>
		{#if stats.hattricks}
			<div class="rounded-xl bg-white/5 p-3">
				<div class="text-xl font-extrabold">
					<CountUpNumber value={stats.hattricks} reduced={reducedMotion} />
				</div>
				<div class="text-[11px] text-white/50">{$t("season_recap.goals.hattricks")}</div>
			</div>
		{/if}
		{#if stats.clean_sheets}
			<div class="rounded-xl bg-white/5 p-3">
				<div class="text-xl font-extrabold">
					<CountUpNumber value={stats.clean_sheets} reduced={reducedMotion} />
				</div>
				<div class="text-[11px] text-white/50">{$t("season_recap.goals.clean_sheets")}</div>
			</div>
		{/if}
	</div>
</div>
