<script>
import { getTranslate } from "@tolgee/svelte";
import { avatarGradient } from "$lib/utils/avatarColor.utils.js";

/**
 * Centered-axis match timeline. Vertical line down the middle, minute
 * bubbles sitting on the axis in the scoring team's colour, the
 * scorer/assist content alternating left (home) and right (away).
 * ABPFIFF anchor on top, ANPFIFF on the bottom.
 *
 * The component takes the raw `score_timeline` from the API and the
 * `game_players` list so it can resolve player_id → username.
 *
 * @type {{
 *   timeline: Array<object>,
 *   gamePlayers: Array<object>,
 *   currentUserId: string|null,
 * }}
 */
let { timeline = [], gamePlayers = [], currentUserId = null } = $props();

const { t } = getTranslate();

const userAccent = $derived(
	currentUserId ? avatarGradient(currentUserId).from : "#F59E0B",
);

const events = $derived.by(() => {
	if (!Array.isArray(timeline)) return [];
	const rows = [];
	let prevHome = 0;
	let prevAway = 0;
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
	return currentUserId && playerId === currentUserId;
}
</script>

<div class="card">
	<div class="anchor">{$t("game_detail.timeline.fulltime")}</div>
	<div class="timeline">
		{#if events.length === 0}
			<div class="empty">{$t("game_detail.timeline.empty")}</div>
		{/if}
		{#each events as evt, i (i)}
			{@const scorerName = nameFor(evt.scoredBy)}
			{@const assistName = nameFor(evt.assistBy)}
			<div class="event">
				{#if evt.side === "home"}
					<div class="content home">
						<span class="score-pill home">⚽ {evt.home}:{evt.away}</span>
						<span class="scorer" class:me={isCurrentUser(evt.scoredBy)} style:--accent={userAccent}>
							{scorerName ?? "?"}
						</span>
						{#if assistName}
							<span class="assist">
								↳ <span class:me={isCurrentUser(evt.assistBy)} style:--accent={userAccent}>{assistName}</span>
							</span>
						{/if}
					</div>
					<div class="minute home">{evt.minute}</div>
					<div></div>
				{:else}
					<div></div>
					<div class="minute away">{evt.minute}</div>
					<div class="content away">
						<span class="score-pill away">⚽ {evt.home}:{evt.away}</span>
						<span class="scorer" class:me={isCurrentUser(evt.scoredBy)} style:--accent={userAccent}>
							{scorerName ?? "?"}
						</span>
						{#if assistName}
							<span class="assist">
								↳ <span class:me={isCurrentUser(evt.assistBy)} style:--accent={userAccent}>{assistName}</span>
							</span>
						{/if}
					</div>
				{/if}
			</div>
		{/each}
	</div>
	<div class="anchor bottom">{$t("game_detail.timeline.kickoff")}</div>
</div>

<style>
.card {
	background: #131822;
	border: 1px solid #1F2937;
	border-radius: 14px;
	padding: 14px;
}
.anchor {
	text-align: center;
	font-size: 9px;
	font-weight: 800;
	color: #6B7280;
	letter-spacing: 0.15em;
	text-transform: uppercase;
	margin: 4px 0 12px;
}
.anchor.bottom { margin: 12px 0 4px; }
.empty {
	text-align: center;
	color: #6B7280;
	font-size: 12px;
	padding: 16px 0;
}
.timeline {
	position: relative;
	display: flex; flex-direction: column;
	gap: 12px;
}
.timeline::before {
	content: '';
	position: absolute;
	top: 4px; bottom: 4px;
	left: 50%;
	width: 1px;
	background: rgba(255,255,255,0.06);
}
.event {
	display: grid;
	grid-template-columns: 1fr 32px 1fr;
	align-items: center;
	gap: 10px;
	min-height: 36px;
}
.minute {
	width: 32px; height: 32px;
	background: #1A1F2A;
	border: 1.5px solid #2A3142;
	border-radius: 50%;
	display: flex; align-items: center; justify-content: center;
	font-size: 10px;
	font-weight: 800;
	color: #9CA3AF;
	font-variant-numeric: tabular-nums;
	z-index: 1;
	margin: 0 auto;
}
.minute.home { border-color: rgba(226, 75, 74, 0.4); color: #E24B4A; }
.minute.away { border-color: rgba(132, 204, 22, 0.4); color: #84CC16; }
.content {
	display: flex; flex-direction: column;
	gap: 2px;
}
.content.home { align-items: flex-end; text-align: right; }
.content.away { align-items: flex-start; text-align: left; }
.score-pill {
	display: inline-flex; align-items: center;
	gap: 4px;
	font-size: 11px;
	font-weight: 800;
	font-variant-numeric: tabular-nums;
	padding: 2px 8px;
	border-radius: 999px;
}
.score-pill.home {
	background: rgba(226, 75, 74, 0.15);
	color: #E24B4A;
}
.score-pill.away {
	background: rgba(132, 204, 22, 0.15);
	color: #84CC16;
}
.scorer {
	font-size: 13px;
	font-weight: 700;
	color: #E5E7EB;
}
.scorer.me { color: var(--accent, #F59E0B); }
.assist {
	font-size: 10px;
	color: #6B7280;
}
.assist .me { color: var(--accent, #F59E0B); }
</style>
