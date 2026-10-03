<script>
import { getTranslate } from "@tolgee/svelte";
import CheckIcon from "$lib/components/icons/CheckIcon.svelte";

/**
 * One past week on the History tab: the date range, an "X / Y" chip with
 * a small bar (tone by completion rate), then one row per challenge with
 * a check or a cross and its final count.
 *
 * @type {{
 *   week: {
 *     week_start: string,
 *     week_end: string,
 *     completed_count: number,
 *     challenges: Array<{
 *       label_de: string, label_en: string,
 *       progress: { current: number, target: number, completed: boolean },
 *     }>,
 *   },
 *   locale: "de"|"en",
 * }}
 */
let { week, locale = "de" } = $props();

const { t } = getTranslate();

const TONE_CHIP = {
	perfect: "chip-win",
	good: "chip-gold",
	poor: "chip-loss",
	none: "chip-muted",
};

const total = $derived(week.challenges?.length ?? 0);
const completed = $derived(week.completed_count ?? 0);
const rate = $derived(total > 0 ? completed / total : 0);

const tone = $derived.by(() => {
	if (total === 0) return "none";
	if (rate === 1) return "perfect";
	if (rate >= 0.5) return "good";
	if (rate > 0) return "poor";
	return "none";
});

const dateRange = $derived(formatRange(week.week_start, week.week_end, locale));

function formatRange(start, end, lc) {
	const fmt = (s) =>
		new Date(`${s}T12:00:00Z`).toLocaleDateString(
			lc === "en" ? "en-GB" : "de-DE",
			{ day: "2-digit", month: "short" },
		);
	return `${fmt(start)} – ${fmt(end)}`;
}

function labelOf(c) {
	return locale === "en"
		? (c.label_en ?? c.label_de)
		: (c.label_de ?? c.label_en);
}
</script>

<article class="card week">
	<header class="head">
		<h2 class="label range">{dateRange}</h2>
		<div class="summary">
			<span class="chip rate {TONE_CHIP[tone]}">{completed} / {total}</span>
			<div class="progress mini tone-{tone}" aria-hidden="true">
				<span style="width: {rate * 100}%"></span>
			</div>
		</div>
	</header>

	<ul class="list">
		{#each week.challenges ?? [] as c, i (i)}
			{@const done = c.progress?.completed}
			<li class="row" class:missed={!done}>
				<span class="mark" aria-hidden="true">
					{#if done}
						<CheckIcon size={12} strokeWidth={3} />
					{:else}
						<svg
							viewBox="0 0 24 24"
							width="10"
							height="10"
							fill="none"
							stroke="currentColor"
							stroke-width="3.5"
							stroke-linecap="round"
						>
							<line x1="18" y1="6" x2="6" y2="18" />
							<line x1="6" y1="6" x2="18" y2="18" />
						</svg>
					{/if}
				</span>
				<span class="name">
					{labelOf(c)}
					{#if done}<span class="sr-only">— {$t("challenges.done_label")}</span>{/if}
				</span>
				<span class="score">{c.progress?.current ?? 0} / {c.progress?.target ?? 0}</span>
			</li>
		{/each}
	</ul>
</article>

<style>
.week {
	display: flex;
	flex-direction: column;
	gap: 12px;
	padding: 14px 16px;
}

.head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
}

.range {
	margin: 0;
	font-size: 13px;
	color: var(--color-muted);
}

.summary {
	display: flex;
	align-items: center;
	gap: 8px;
	flex-shrink: 0;
}

.rate {
	font-size: 12px;
	font-variant-numeric: tabular-nums;
}

.mini {
	width: 56px;
	--bar-height: 6px;
}

.tone-perfect > span {
	background: var(--color-win);
}

.tone-good > span {
	background: var(--color-gold);
}

.tone-poor > span {
	background: var(--color-loss);
}

.list {
	display: flex;
	flex-direction: column;
	gap: 8px;
	margin: 0;
	padding: 12px 0 0;
	list-style: none;
	border-top: 1px solid var(--color-line);
}

.row {
	display: flex;
	align-items: center;
	gap: 10px;
	font-size: 14px;
}

.mark {
	width: 20px;
	height: 20px;
	flex-shrink: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: var(--radius-result);
	background: var(--color-win);
	color: var(--color-on-win);
}

.missed .mark {
	background: var(--color-sunken);
	color: var(--color-muted);
}

.name {
	flex: 1;
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	font-weight: 700;
}

.missed .name {
	font-weight: 500;
	color: var(--color-muted);
}

.score {
	flex-shrink: 0;
	font-family: var(--font-cond);
	font-weight: 700;
	font-size: 14px;
	font-variant-numeric: tabular-nums;
}

.missed .score {
	color: var(--color-muted);
}

:global([data-variant="b"]) .mark {
	border-radius: 999px;
}
</style>
