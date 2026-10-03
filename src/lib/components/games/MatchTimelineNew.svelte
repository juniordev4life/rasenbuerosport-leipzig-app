<script>
import { getTranslate } from "@tolgee/svelte";
import ClockIcon from "$lib/components/icons/ClockIcon.svelte";
import Section from "$lib/components/ui/Section.svelte";

/**
 * "Spielverlauf": the goals on a centred time axis, newest first —
 * Abpfiff on top, Anpfiff at the bottom. Each goal puts its minute on
 * the axis in the scoring side's colour (home red, away navy) and the
 * score after the goal, the scorer and the assist on that side's half,
 * so the side never depends on colour alone.
 *
 * The component takes the raw `score_timeline` from the API and the
 * `game_players` list so it can resolve player_id → username.
 *
 * @type {{
 *   timeline: Array<object>,
 *   gamePlayers: Array<object>,
 *   currentUserId: string|null,
 *   class?: string,
 * }}
 */
let {
	timeline = [],
	gamePlayers = [],
	currentUserId = null,
	class: className = "",
} = $props();

const { t } = getTranslate();

const events = $derived.by(() => {
	if (!Array.isArray(timeline)) return [];
	const rows = [];
	let prevHome = 0;
	let prevAway = 0;
	let prevPeriod = null;
	for (const e of timeline) {
		if (
			!e ||
			(e.event_type &&
				e.event_type !== "goal" &&
				e.home == null &&
				e.away == null)
		) {
			continue;
		}
		// When the period flips (regular → extra_time → penalty), the
		// score resets to the shootout-only count for that segment.
		// Reset the running baseline so the side-detection below works
		// for the first shootout entry — without this, a 1:1 going into
		// a 1:0 first penalty would look like the home count went DOWN
		// and the entry would be silently dropped.
		if (prevPeriod && e.period && e.period !== prevPeriod) {
			prevHome = 0;
			prevAway = 0;
		}
		const homeChanged = (e.home ?? prevHome) > prevHome;
		const awayChanged = (e.away ?? prevAway) > prevAway;
		const side = homeChanged ? "home" : awayChanged ? "away" : null;
		if (side) {
			rows.push({
				side,
				home: e.home,
				away: e.away,
				scoredBy: e.scored_by ?? null,
				assistBy: e.assist_by ?? null,
				minute: formatMinute(e),
				period: e.period,
			});
		}
		prevHome = e.home ?? prevHome;
		prevAway = e.away ?? prevAway;
		prevPeriod = e.period ?? prevPeriod;
	}
	return rows.reverse();
});

function formatMinute(entry) {
	if (entry.minute == null) return "";
	const m = entry.minute;
	const s = entry.stoppage ?? 0;
	return s > 0 ? `${m}+${s}'` : `${m}'`;
}

function nameFor(playerId) {
	if (!playerId) return null;
	const gp = gamePlayers.find((p) => p.player_id === playerId);
	return gp?.profiles?.username ?? null;
}

function isCurrentUser(playerId) {
	return Boolean(currentUserId) && playerId === currentUserId;
}
</script>

<Section title={$t("game_detail.section.timeline")} class={className}>
	{#snippet icon()}<ClockIcon size={22} strokeWidth={2} />{/snippet}
	<div class="card timeline">
		<p class="label anchor">{$t("game_detail.timeline.fulltime")}</p>
		{#if events.length === 0}
			<p class="empty">{$t("game_detail.timeline.empty")}</p>
		{:else}
			<ol class="events">
				{#each events as evt, i (i)}
					{@const scorerName = nameFor(evt.scoredBy)}
					{@const assistName = nameFor(evt.assistBy)}
					<li class="event {evt.side}">
						<span class="content">
							<span class="goal-score">{evt.home}:{evt.away}</span>
							<span class="scorer" class:me={isCurrentUser(evt.scoredBy)}>
								{scorerName ?? "?"}
							</span>
							{#if assistName}
								<span class="assist" class:me={isCurrentUser(evt.assistBy)}>
									{$t("game_detail.assisted_by", { name: assistName })}
								</span>
							{/if}
						</span>
						<span class="minute">{evt.minute}</span>
					</li>
				{/each}
			</ol>
		{/if}
		<p class="label anchor">{$t("game_detail.timeline.kickoff")}</p>
	</div>
</Section>

<style>
.timeline {
	display: flex;
	flex-direction: column;
	gap: 14px;
	padding: 16px;
}

.anchor {
	margin: 0;
	color: var(--color-muted);
	text-align: center;
}

.empty {
	margin: 0;
	padding: 8px 0;
	color: var(--color-muted);
	font-size: 14px;
	text-align: center;
}

.events {
	position: relative;
	display: flex;
	flex-direction: column;
	gap: 14px;
	margin: 0;
	padding: 0;
	list-style: none;
}

/* The time axis down the middle. */
.events::before {
	content: "";
	position: absolute;
	top: 0;
	bottom: 0;
	left: 50%;
	width: 2px;
	transform: translateX(-50%);
	background: var(--color-line);
}

.event {
	display: grid;
	grid-template-columns: minmax(0, 1fr) 44px minmax(0, 1fr);
	align-items: center;
	gap: 10px;
}

.minute {
	position: relative;
	grid-column: 2;
	grid-row: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	min-width: 44px;
	height: 30px;
	padding: 0 4px;
	border-radius: var(--radius-badge);
	font-family: var(--font-cond);
	font-weight: 700;
	font-size: 13px;
	font-variant-numeric: tabular-nums;
}

.home .minute {
	background: var(--color-home);
	color: var(--color-on-home);
}

.away .minute {
	background: var(--color-away);
	color: var(--color-on-away);
}

.content {
	grid-row: 1;
	display: flex;
	flex-direction: column;
	gap: 3px;
	min-width: 0;
	overflow-wrap: anywhere;
}

.home .content {
	grid-column: 1;
	align-items: flex-end;
	text-align: right;
}

.away .content {
	grid-column: 3;
	align-items: flex-start;
	text-align: left;
}

.goal-score {
	padding: 2px 8px;
	border-radius: var(--radius-badge);
	background: var(--color-score);
	color: var(--color-on-score);
	font-family: var(--font-num);
	font-weight: var(--num-weight);
	font-size: 14px;
	line-height: 1.2;
	font-variant-numeric: tabular-nums;
}

.scorer {
	font-weight: 700;
	font-size: 15px;
	line-height: 1.2;
}

.assist {
	color: var(--color-muted);
	font-size: 13px;
}

.scorer.me,
.assist.me {
	color: var(--color-brand);
}
</style>
