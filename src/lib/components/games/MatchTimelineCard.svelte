<script>
import { getTranslate } from "@tolgee/svelte";
import { formatMinute } from "$lib/utils/minute.utils.js";

/**
 * Vertical timeline panel. A subtle center axis runs top-to-bottom
 * (newest event on top, kick-off at the bottom). Home events sit on
 * the left, away on the right. Each event renders as a stacked block:
 * pill + minute on the first row, then the scorer/offender name,
 * then any assist underneath — so the names get the full half-width
 * even on narrow viewports.
 *
 * @type {{
 *   timeline: object[],
 *   getProfile: (playerId: string) => ({ username?: string, avatar_url?: string|null }|null),
 * }}
 */
let { timeline = [], getProfile } = $props();

const { t } = getTranslate();

const entries = $derived.by(() => {
	if (!timeline.length) return [];
	let prevHome = 0;
	const out = timeline.map((entry) => {
		if (
			entry.event_type === "red_card" ||
			entry.event_type === "card" ||
			entry.event_type === "penalty_missed"
		) {
			return { ...entry, side: entry.team };
		}
		const isHomeGoal = entry.home > prevHome;
		prevHome = entry.home;
		return {
			...entry,
			side: isHomeGoal ? "home" : "away",
		};
	});
	return out.toReversed();
});

/**
 * Rank periods chronologically so we can detect when consecutive
 * events crossed a phase boundary (going newest → oldest, the rank
 * can only stay equal or drop).
 */
function periodRank(period) {
	switch (period) {
		case "penalty":
			return 4;
		case "et_second":
			return 3;
		case "et_first":
			return 2;
		case "second_half":
			return 1;
		default:
			return 0;
	}
}

/** Label for a phase boundary that the timeline just crossed. */
function boundaryLabel(rank) {
	if (rank === 2 || rank === 3) return $t("game_detail.extra_time_short");
	if (rank === 4) return $t("game_detail.penalty_short");
	return null;
}

/**
 * Build the final render list: "Abpfiff" header at the top, then
 * events interleaved with phase dividers (n.E., n.V., Halbzeit),
 * always newest-first.
 *
 * The Halbzeit divider is always rendered when any first-half events
 * exist (or, when none do, it sits just above Anpfiff) so you can
 * read at a glance which half a goal/card belongs to.
 */
const rows = $derived.by(() => {
	if (!entries.length) return [];
	/** @type {Array<{ type: 'divider', id: string, label: string } | { type: 'event', id: string, entry: object }>} */
	const list = [];
	list.push({
		type: "divider",
		id: "fulltime",
		label: $t("game_detail.timeline.fulltime"),
	});

	// Drop dividers for any phase above the latest event's phase
	// (e.g. n.E. only appears if there were penalty events). Start
	// at the max of the top event's rank and 1 (second_half) so we
	// always emit Halbzeit — even when every event sits in the first
	// half — but never invent n.V./n.E. for games that didn't reach
	// those phases.
	let expected = Math.max(periodRank(entries[0].period), 1);

	for (let i = 0; i < entries.length; i += 1) {
		const entry = entries[i];
		const rank = periodRank(entry.period);
		while (expected > rank) {
			const label = boundaryLabel(expected);
			if (label) {
				list.push({ type: "divider", id: `boundary-${expected}-${i}`, label });
			}
			expected -= 1;
		}
		list.push({ type: "event", id: `event-${i}`, entry });
	}

	// Any boundaries we still need to cross before kick-off
	// (e.g. all events were in the second half → emit Halbzeit
	// after the last event so first-half emptiness is visible).
	while (expected > 0) {
		const label = boundaryLabel(expected);
		if (label) {
			list.push({ type: "divider", id: `boundary-tail-${expected}`, label });
		}
		expected -= 1;
	}

	return list;
});

function minuteLabel(entry) {
	if (typeof entry.minute !== "number") return null;
	return formatMinute({ minute: entry.minute, stoppage: entry.stoppage ?? 0 });
}

function goalIcon(entry) {
	if (entry.goal_type === "penalty" || entry.period === "penalty") return "🥅";
	if (entry.goal_type === "corner") return "🚩";
	if (entry.goal_type === "freekick") return "🎯";
	return "⚽";
}
</script>

{#snippet eventRow(side, badgeClass, badgeIcon, badgeLabel, primaryName, secondaryName, min)}
	{@const block = `flex flex-col leading-tight gap-0.5 ${side === 'home' ? 'items-end text-right' : 'items-start text-left'}`}
	<div class="flex items-start gap-2 {side === 'home' ? 'justify-end' : 'justify-start'}">
		{#if side === "away" && min}
			<span class="text-[10px] tabular-nums text-text-secondary pt-0.5 shrink-0">{min}</span>
		{/if}
		<div class={block}>
			<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold {badgeClass}">
				<span aria-hidden="true">{badgeIcon}</span>
				{badgeLabel}
			</span>
			<span class="text-[12px] font-semibold text-text-primary break-words">
				{primaryName}
			</span>
			{#if secondaryName}
				<span class="text-[11px] text-text-secondary break-words">↳ {secondaryName}</span>
			{/if}
		</div>
		{#if side === "home" && min}
			<span class="text-[10px] tabular-nums text-text-secondary pt-0.5 shrink-0">{min}</span>
		{/if}
	</div>
{/snippet}

{#snippet goalContent(entry)}
	{@const scorer = getProfile(entry.scored_by)}
	{@const assist = entry.assist_by ? getProfile(entry.assist_by) : null}
	{@const badge = entry.side === "home"
		? "bg-accent-red/15 text-accent-red"
		: "bg-success/15 text-success"}
	{@render eventRow(
		entry.side,
		badge,
		goalIcon(entry),
		`${entry.home}:${entry.away}`,
		scorer?.username ?? "—",
		assist?.username ?? null,
		minuteLabel(entry),
	)}
{/snippet}

{#snippet cardContent(entry)}
	{@const offender = getProfile(entry.player_id)}
	{@const isYellow = entry.event_type === "card" && entry.card_type === "yellow"}
	{@const icon = isYellow ? "🟨" : "🟥"}
	{@const label = isYellow
		? $t("game_detail.event_yellow_card")
		: $t("game_detail.event_red_card")}
	{@const badge = isYellow
		? "bg-warning/15 text-warning"
		: "bg-accent-red/15 text-accent-red"}
	{@render eventRow(
		entry.side,
		badge,
		icon,
		label,
		offender?.username ?? "—",
		null,
		minuteLabel(entry),
	)}
{/snippet}

{#snippet penaltyMissedContent(entry)}
	{@const shooter = getProfile(entry.shooter_id)}
	{@const keeper = entry.keeper_id ? getProfile(entry.keeper_id) : null}
	{@render eventRow(
		entry.side,
		"bg-warning/15 text-warning",
		"❌",
		$t("game_detail.event_penalty_missed"),
		shooter?.username ?? "—",
		keeper ? `🧤 ${keeper.username}` : null,
		minuteLabel(entry),
	)}
{/snippet}

<section class="rounded-2xl border border-border bg-bg-secondary p-4 sm:p-5 h-full flex flex-col">
	<h3 class="text-[11px] tracking-[0.08em] uppercase text-text-muted font-semibold mb-3 flex items-center justify-between">
		<span>{$t("game_detail.section.timeline")}</span>
		<span class="text-text-secondary normal-case tracking-normal text-[11px] font-normal">
			{$t("game_detail.timeline.event_count", { count: entries.length })}
		</span>
	</h3>

	{#if entries.length > 0}
		<div class="grid grid-cols-2 text-[10px] tracking-[0.06em] uppercase font-semibold mb-1">
			<div class="text-right pr-5 text-accent-red">{$t("game_detail.home_team")}</div>
			<div class="text-left pl-5 text-success">{$t("game_detail.away_team")}</div>
		</div>

		<div class="relative flex-1 flex flex-col justify-between pt-2 pb-1 gap-2 lg:gap-4">
			<div class="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px bg-border"></div>

			<div class="flex flex-col gap-2 lg:gap-5 flex-1">
				{#each rows as row (row.id)}
					{#if row.type === "divider"}
						<div class="relative z-10 flex items-center justify-center w-full">
							<span class="bg-bg-secondary px-3 text-[10px] font-bold text-text-secondary uppercase tracking-[0.08em]">
								{row.label}
							</span>
						</div>
					{:else}
						{@const entry = row.entry}
						<div class="relative z-10 grid grid-cols-2 w-full py-1.5">
							<div class="pr-3">
								{#if entry.side === "home"}
									{#if entry.event_type === "red_card" || entry.event_type === "card"}
										{@render cardContent(entry)}
									{:else if entry.event_type === "penalty_missed"}
										{@render penaltyMissedContent(entry)}
									{:else}
										{@render goalContent(entry)}
									{/if}
								{/if}
							</div>
							<div class="pl-3">
								{#if entry.side === "away"}
									{#if entry.event_type === "red_card" || entry.event_type === "card"}
										{@render cardContent(entry)}
									{:else if entry.event_type === "penalty_missed"}
										{@render penaltyMissedContent(entry)}
									{:else}
										{@render goalContent(entry)}
									{/if}
								{/if}
							</div>
							<span class="absolute left-1/2 top-2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-text-muted/50 ring-2 ring-bg-secondary"></span>
						</div>
					{/if}
				{/each}
			</div>

			<div class="relative z-10 flex items-center justify-center w-full pt-2">
				<div class="bg-bg-secondary px-2 text-[10px] tracking-[0.06em] uppercase text-text-muted">
					{$t("game_detail.timeline.kickoff")}
				</div>
			</div>
		</div>
	{:else}
		<p class="text-sm text-text-secondary text-center py-4">
			{$t("game_detail.timeline.empty")}
		</p>
	{/if}
</section>
