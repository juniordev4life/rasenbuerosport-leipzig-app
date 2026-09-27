<script>
import { getTranslate } from "@tolgee/svelte";

/**
 * Slide 4 — when you play: favorite weekday, "lucky day", lunch-break
 * share and favorite kickoff hour.
 *
 * @type {{ recap: object }}
 */
let { recap } = $props();

const { t } = getTranslate();
const stats = $derived(recap.stats ?? {});

/**
 * Localised weekday name for an ISO weekday (1 = Monday … 7 = Sunday).
 * 2024-01-01 was a Monday, so day N of that week is `Date.UTC(2024, 0, N)`.
 *
 * @param {number} isoWeekday
 * @returns {string}
 */
function weekdayName(isoWeekday) {
	const ref = new Date(Date.UTC(2024, 0, isoWeekday));
	return ref.toLocaleDateString("de-DE", { weekday: "long", timeZone: "UTC" });
}

function hourLabel(hour) {
	return `${String(hour).padStart(2, "0")}:00`;
}
</script>

<div class="flex flex-col items-center text-center gap-4 w-full">
	<h2 class="text-xs uppercase tracking-[0.2em] text-white/50 font-bold">
		{$t("season_recap.timing.title")}
	</h2>

	{#if stats.favorite_weekday}
		<div class="w-full rounded-xl bg-white/5 p-4">
			<div class="text-2xl font-extrabold">{weekdayName(stats.favorite_weekday.weekday)}</div>
			<div class="text-[12px] text-white/50 mt-1">
				{$t("season_recap.timing.favorite_weekday", { count: stats.favorite_weekday.games })}
			</div>
		</div>
	{/if}

	{#if stats.best_weekday}
		<div class="w-full rounded-xl bg-white/5 p-4">
			<div class="text-[11px] uppercase tracking-wide text-[#84CC16] font-bold">
				{$t("season_recap.timing.lucky_day")}
			</div>
			<div class="text-xl font-extrabold mt-1">{weekdayName(stats.best_weekday.weekday)}</div>
			<div class="text-[12px] text-white/50 mt-1">
				{$t("season_recap.timing.win_rate", {
					percent: Math.round(stats.best_weekday.win_rate * 100),
					count: stats.best_weekday.games,
				})}
			</div>
		</div>
	{/if}

	{#if typeof stats.lunch_break_share === "number"}
		<div class="w-full rounded-xl bg-white/5 p-4">
			<div class="text-lg font-extrabold">
				{$t("season_recap.timing.lunch_break", {
					percent: Math.round(stats.lunch_break_share * 100),
				})}
			</div>
		</div>
	{/if}

	{#if stats.favorite_hour}
		<p class="text-[12px] text-white/50">
			{$t("season_recap.timing.favorite_hour", {
				hour: hourLabel(stats.favorite_hour.hour),
				count: stats.favorite_hour.games,
			})}
		</p>
	{/if}
</div>
