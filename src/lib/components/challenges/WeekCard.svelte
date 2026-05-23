<script>
import { getTranslate } from "@tolgee/svelte";

/**
 * One past-week record on the Verlauf tab. Header shows the date
 * range, a colour-coded "X / Y" ratio, and a mini bar; below it three
 * (or however many) compact rows with check / cross icons per
 * challenge.
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

<div class="card">
	<div class="head">
		<div class="range">{dateRange}</div>
		<div class="meta">
			<span class="rate {tone}">{completed} / {total}</span>
			<div class="mini-bar">
				<div class="mini-fill {tone}" style="width: {rate * 100}%;"></div>
			</div>
		</div>
	</div>

	<div class="rows">
		{#each week.challenges ?? [] as c, i (i)}
			{@const done = c.progress?.completed}
			<div class="row">
				<div class="check {done ? 'done' : 'missed'}" aria-hidden="true">
					{done ? "✓" : "✗"}
				</div>
				<div class="name" class:missed={!done}>{labelOf(c)}</div>
				<div class="score {done ? 'done' : ''}">
					{c.progress?.current ?? 0} / {c.progress?.target ?? 0}
				</div>
			</div>
		{/each}
	</div>
</div>

<style>
.card {
	background: #131822;
	border: 1px solid #1F2937;
	border-radius: 14px;
	padding: 12px 14px;
}
.head {
	display: flex; justify-content: space-between; align-items: center;
	margin-bottom: 10px;
	gap: 12px;
}
.range {
	font-size: 11px;
	color: #9CA3AF;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.08em;
}
.meta {
	display: flex; align-items: center; gap: 8px;
	flex-shrink: 0;
}
.rate {
	font-size: 14px;
	font-weight: 800;
	font-variant-numeric: tabular-nums;
}
.rate.perfect { color: #84CC16; }
.rate.good { color: #F59E0B; }
.rate.poor { color: #E24B4A; }
.rate.none { color: #6B7280; }
.mini-bar {
	width: 56px; height: 4px;
	background: rgba(255,255,255,0.05);
	border-radius: 2px;
	overflow: hidden;
}
.mini-fill {
	height: 100%;
	border-radius: 2px;
	transition: width 0.4s ease;
}
.mini-fill.perfect { background: #84CC16; }
.mini-fill.good { background: #F59E0B; }
.mini-fill.poor { background: #E24B4A; }
.mini-fill.none { background: #4B5563; }
.rows {
	display: flex; flex-direction: column;
	gap: 6px;
	padding-top: 6px;
	border-top: 1px solid #1F2937;
}
.row {
	display: flex; align-items: center; gap: 8px;
}
.check {
	width: 16px; height: 16px;
	border-radius: 50%;
	display: flex; align-items: center; justify-content: center;
	font-size: 10px;
	font-weight: 800;
	flex-shrink: 0;
}
.check.done {
	background: rgba(132, 204, 22, 0.15);
	color: #84CC16;
	border: 1px solid rgba(132, 204, 22, 0.3);
}
.check.missed {
	background: rgba(107, 114, 128, 0.12);
	color: #6B7280;
	border: 1px solid rgba(107, 114, 128, 0.2);
}
.name {
	flex: 1; min-width: 0;
	font-size: 12px;
	font-weight: 600;
	color: #D1D5DB;
	overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.name.missed { color: #6B7280; }
.score {
	font-size: 11px;
	font-weight: 700;
	color: #6B7280;
	font-variant-numeric: tabular-nums;
	flex-shrink: 0;
}
.score.done { color: #84CC16; }
</style>
