<script>
import { getTranslate } from "@tolgee/svelte";
import { avatarGradient } from "$lib/utils/avatarColor.utils.js";

/**
 * Two stacked lineup cards (Heim/Auswärts). Each lineup row pairs
 * an identity-coloured avatar with the player's name, a per-player
 * stats line ("⚽ 2 Tore · ↳ 1 Vorlage") and the ELO delta on the
 * right. The user's own name renders in their accent colour.
 *
 * @type {{
 *   game: object,
 *   homePlayers: Array<object>,
 *   awayPlayers: Array<object>,
 *   homeTeamName?: string|null,
 *   awayTeamName?: string|null,
 *   currentUserId: string|null,
 * }}
 */
let {
	game,
	homePlayers = [],
	awayPlayers = [],
	homeTeamName = null,
	awayTeamName = null,
	currentUserId = null,
} = $props();

const { t } = getTranslate();

const homeScore = $derived(game?.score_home ?? 0);
const awayScore = $derived(game?.score_away ?? 0);
const homeWins = $derived(homeScore > awayScore);
const awayWins = $derived(awayScore > homeScore);
const isDraw = $derived(homeScore === awayScore);

const eloMap = $derived.by(() => {
	const map = new Map();
	const snap = game?.elo_snapshot;
	if (!snap) return map;
	for (const e of [...(snap.teamA ?? []), ...(snap.teamB ?? [])]) {
		map.set(e.playerId, e);
	}
	return map;
});

const goalsMap = $derived.by(() => {
	const map = new Map();
	const tl = game?.score_timeline ?? [];
	for (const e of tl) {
		if (!e) continue;
		if (e.event_type && e.event_type !== "goal") continue;
		if (e.scored_by) map.set(e.scored_by, (map.get(e.scored_by) ?? 0) + 1);
	}
	return map;
});

const assistsMap = $derived.by(() => {
	const map = new Map();
	const tl = game?.score_timeline ?? [];
	for (const e of tl) {
		if (!e) continue;
		if (e.event_type && e.event_type !== "goal") continue;
		if (e.assist_by) map.set(e.assist_by, (map.get(e.assist_by) ?? 0) + 1);
	}
	return map;
});

function statsLine(playerId) {
	const goals = goalsMap.get(playerId) ?? 0;
	const assists = assistsMap.get(playerId) ?? 0;
	const parts = [];
	if (goals > 0)
		parts.push({
			text: `⚽ ${goals} ${goals === 1 ? $t("match_hero.goal") : $t("match_hero.goals")}`,
			kind: "goals",
		});
	if (assists > 0)
		parts.push({
			text: `↳ ${assists} ${assists === 1 ? $t("match_hero.assist") : $t("match_hero.assists")}`,
			kind: "assists",
		});
	return parts;
}

function initial(name) {
	return (name ?? "?").charAt(0).toUpperCase();
}

function eloFor(playerId) {
	const d = eloMap.get(playerId)?.delta;
	return d != null ? Math.round(d) : null;
}

function isMe(playerId) {
	return currentUserId && playerId === currentUserId;
}
</script>

<div class="lineups">
	<div class="card">
		<div class="header">
			<div class="team-name home">
				{$t("match_hero.home_label")}{#if homeTeamName} · {homeTeamName}{/if}
			</div>
			<div class="result-tag" class:win={homeWins} class:loss={awayWins} class:draw={isDraw}>
				{isDraw ? $t("match_hero.draw_label") : homeWins ? $t("match_hero.wins") : $t("match_hero.loses")}
			</div>
		</div>
		<div class="players">
			{#each homePlayers as p (p.player_id)}
				{@const g = avatarGradient(p.player_id)}
				{@const stats = statsLine(p.player_id)}
				{@const elo = eloFor(p.player_id)}
				<div class="player-row">
					<div class="avatar" style="background: {g.gradient};">
						{#if p.profiles?.avatar_url}
							<img src={p.profiles.avatar_url} alt={p.profiles?.username ?? "?"} />
						{:else}
							<span>{initial(p.profiles?.username)}</span>
						{/if}
					</div>
					<div class="info">
						<div class="name" class:me={isMe(p.player_id)} style:--accent={g.from}>
							{p.profiles?.username ?? "?"}
						</div>
						{#if stats.length > 0}
							<div class="stats">
								{#each stats as s, i (i)}
									<span class="stat {s.kind}">{s.text}</span>
									{#if i < stats.length - 1}<span class="dot">·</span>{/if}
								{/each}
							</div>
						{/if}
					</div>
					{#if elo != null}
						<div class="elo {elo > 0 ? 'up' : elo < 0 ? 'down' : 'flat'}">
							{elo > 0 ? "↑ +" : elo < 0 ? "↓ " : "± "}{Math.abs(elo)}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</div>

	<div class="card">
		<div class="header">
			<div class="team-name away">
				{$t("match_hero.away_label")}{#if awayTeamName} · {awayTeamName}{/if}
			</div>
			<div class="result-tag" class:win={awayWins} class:loss={homeWins} class:draw={isDraw}>
				{isDraw ? $t("match_hero.draw_label") : awayWins ? $t("match_hero.wins") : $t("match_hero.loses")}
			</div>
		</div>
		<div class="players">
			{#each awayPlayers as p (p.player_id)}
				{@const g = avatarGradient(p.player_id)}
				{@const stats = statsLine(p.player_id)}
				{@const elo = eloFor(p.player_id)}
				<div class="player-row">
					<div class="avatar" style="background: {g.gradient};">
						{#if p.profiles?.avatar_url}
							<img src={p.profiles.avatar_url} alt={p.profiles?.username ?? "?"} />
						{:else}
							<span>{initial(p.profiles?.username)}</span>
						{/if}
					</div>
					<div class="info">
						<div class="name" class:me={isMe(p.player_id)} style:--accent={g.from}>
							{p.profiles?.username ?? "?"}
						</div>
						{#if stats.length > 0}
							<div class="stats">
								{#each stats as s, i (i)}
									<span class="stat {s.kind}">{s.text}</span>
									{#if i < stats.length - 1}<span class="dot">·</span>{/if}
								{/each}
							</div>
						{/if}
					</div>
					{#if elo != null}
						<div class="elo {elo > 0 ? 'up' : elo < 0 ? 'down' : 'flat'}">
							{elo > 0 ? "↑ +" : elo < 0 ? "↓ " : "± "}{Math.abs(elo)}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</div>
</div>

<style>
.lineups {
	display: flex; flex-direction: column;
	gap: 10px;
}
.card {
	background: #131822;
	border: 1px solid #1F2937;
	border-radius: 14px;
	padding: 12px 14px;
}
.header {
	display: flex; justify-content: space-between;
	align-items: center;
	margin-bottom: 10px;
	padding-bottom: 10px;
	border-bottom: 1px solid #1F2937;
}
.team-name {
	font-size: 10px;
	font-weight: 800;
	text-transform: uppercase;
	letter-spacing: 0.08em;
	overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.team-name.home { color: #E24B4A; }
.team-name.away { color: #84CC16; }
.result-tag {
	font-size: 9px;
	font-weight: 800;
	padding: 2px 7px;
	border-radius: 999px;
	border: 1px solid transparent;
	flex-shrink: 0;
	margin-left: 6px;
}
.result-tag.win {
	background: rgba(132, 204, 22, 0.15);
	color: #84CC16;
	border-color: rgba(132, 204, 22, 0.3);
}
.result-tag.loss {
	background: rgba(226, 75, 74, 0.15);
	color: #E24B4A;
	border-color: rgba(226, 75, 74, 0.3);
}
.result-tag.draw {
	background: rgba(245, 158, 11, 0.15);
	color: #F59E0B;
	border-color: rgba(245, 158, 11, 0.3);
}
.players { display: flex; flex-direction: column; gap: 9px; }
.player-row { display: flex; align-items: center; gap: 10px; }
.avatar {
	width: 32px; height: 32px;
	border-radius: 50%;
	display: flex; align-items: center; justify-content: center;
	font-size: 12px;
	font-weight: 700;
	color: white;
	flex-shrink: 0;
	overflow: hidden;
}
.avatar img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
.info { flex: 1; min-width: 0; }
.name {
	font-size: 13px;
	font-weight: 700;
	color: #E5E7EB;
	overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.name.me { color: var(--accent, #F59E0B); }
.stats {
	display: flex; align-items: center;
	gap: 6px;
	font-size: 10px;
	color: #9CA3AF;
	margin-top: 2px;
	flex-wrap: wrap;
}
.stat.goals { color: #84CC16; font-weight: 700; }
.dot { color: #4B5563; }
.elo {
	font-size: 11px;
	font-weight: 800;
	font-variant-numeric: tabular-nums;
	flex-shrink: 0;
}
.elo.up { color: #84CC16; }
.elo.down { color: #E24B4A; }
.elo.flat { color: #6B7280; }
</style>
