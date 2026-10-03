<script>
import { getTranslate } from "@tolgee/svelte";
import RecapCard from "../RecapCard.svelte";
import RecapSlide from "../RecapSlide.svelte";

/**
 * Slide 4 — when you play: favorite weekday, "lucky day", lunch-break
 * share and favorite kickoff hour.
 *
 * @type {{ recap: object }}
 */
let { recap } = $props();

const { t } = getTranslate();
const stats = $derived(recap.stats ?? {});

const hasLunchShare = $derived(typeof stats.lunch_break_share === "number");
const hasFacts = $derived(
	!!(stats.best_weekday || hasLunchShare || stats.favorite_hour),
);

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

<RecapSlide title={$t("season_recap.timing.title")}>
	{#if stats.favorite_weekday}
		<RecapCard>
			<p class="weekday">{weekdayName(stats.favorite_weekday.weekday)}</p>
			<p class="recap-note">
				{$t("season_recap.timing.favorite_weekday", {
					count: stats.favorite_weekday.games,
				})}
			</p>
		</RecapCard>
	{/if}

	{#if hasFacts}
		<RecapCard panel>
			<ul class="facts rows">
				{#if stats.best_weekday}
					<li class="fact">
						<span class="chip chip-gold">{$t("season_recap.timing.lucky_day")}</span>
						<span class="fact-main">{weekdayName(stats.best_weekday.weekday)}</span>
						<span class="fact-sub">
							{$t("season_recap.timing.win_rate", {
								percent: Math.round(stats.best_weekday.win_rate * 100),
								count: stats.best_weekday.games,
							})}
						</span>
					</li>
				{/if}
				{#if hasLunchShare}
					<li class="fact">
						<span class="fact-text">
							{$t("season_recap.timing.lunch_break", {
								percent: Math.round(stats.lunch_break_share * 100),
							})}
						</span>
					</li>
				{/if}
				{#if stats.favorite_hour}
					<li class="fact">
						<span class="fact-sub">
							{$t("season_recap.timing.favorite_hour", {
								hour: hourLabel(stats.favorite_hour.hour),
								count: stats.favorite_hour.games,
							})}
						</span>
					</li>
				{/if}
			</ul>
		</RecapCard>
	{/if}
</RecapSlide>

<style>
.weekday {
	margin: 0;
	font-family: var(--font-num);
	font-weight: var(--num-weight);
	font-size: min(60px, 15cqw);
	line-height: 0.9;
	text-transform: var(--title-case);
	overflow-wrap: anywhere;
}

.facts {
	display: flex;
	flex-direction: column;
	margin: 0;
	padding: 0;
	list-style: none;
}

.fact {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 4px;
	padding: 12px 0;
}

.fact:first-child {
	padding-top: 0;
}

.fact:last-child {
	padding-bottom: 0;
}

.fact .chip {
	margin-bottom: 2px;
}

.fact-main {
	font-family: var(--font-cond);
	font-weight: 700;
	font-size: 24px;
	line-height: 1.05;
	text-transform: var(--title-case);
}

.fact-text {
	font-weight: 700;
	font-size: 16px;
	line-height: 1.35;
}

.fact-sub {
	font-size: 14px;
	line-height: 1.35;
	color: var(--color-muted);
}

:global([data-variant="b"]) .weekday {
	font-size: min(48px, 13cqw);
	color: var(--color-ink);
}

:global([data-variant="b"]) .fact-main {
	font-weight: 800;
}
</style>
