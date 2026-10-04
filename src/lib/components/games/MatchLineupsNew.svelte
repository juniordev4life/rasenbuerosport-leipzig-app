<script>
import { getTranslate } from "@tolgee/svelte";
import UsersIcon from "$lib/components/icons/UsersIcon.svelte";
import PlayerAvatar from "$lib/components/ui/PlayerAvatar.svelte";
import Section from "$lib/components/ui/Section.svelte";

/**
 * "Aufstellungen & Performance": one lineup per side (Heim / Auswärts)
 * with the side's Sieg / Niederlage tag, then a row per player: avatar,
 * name ("Ich" for the signed-in player), goals and assists, and the ELO
 * change with its sign. Stacked on phones, side by side when the column
 * is wide enough.
 *
 * @type {{
 *   game: object,
 *   homePlayers: Array<object>,
 *   awayPlayers: Array<object>,
 *   homeTeamName?: string|null,
 *   awayTeamName?: string|null,
 *   currentUserId: string|null,
 *   class?: string,
 * }}
 */
let {
	game,
	homePlayers = [],
	awayPlayers = [],
	homeTeamName = null,
	awayTeamName = null,
	currentUserId = null,
	class: className = "",
} = $props();

const { t } = getTranslate();

const homeScore = $derived(game?.score_home ?? 0);
const awayScore = $derived(game?.score_away ?? 0);

/**
 * Penalty-shootout winner overrides the regular-time score for
 * the per-side W/D/L tag in the lineup section. Without this, a
 * 1:1 (5:6 i.E.) renders both sides as "Unentschieden" even though
 * the shootout settled the match.
 */
const penaltyWinner = $derived(game?.penalty_shootout?.winner_side ?? null);

const homeWins = $derived(
	penaltyWinner ? penaltyWinner === "home" : homeScore > awayScore,
);
const awayWins = $derived(
	penaltyWinner ? penaltyWinner === "away" : awayScore > homeScore,
);
const isDraw = $derived(!homeWins && !awayWins);

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

/** "2 Tore · 1 Vorlage", or "" when the player has neither. */
function statsLine(playerId) {
	const goals = goalsMap.get(playerId) ?? 0;
	const assists = assistsMap.get(playerId) ?? 0;
	const parts = [];
	if (goals > 0)
		parts.push(
			`${goals} ${goals === 1 ? $t("match_hero.goal") : $t("match_hero.goals")}`,
		);
	if (assists > 0)
		parts.push(
			`${assists} ${assists === 1 ? $t("match_hero.assist") : $t("match_hero.assists")}`,
		);
	return parts.join(" · ");
}

function eloFor(playerId) {
	const d = eloMap.get(playerId)?.delta;
	return d != null ? Math.round(d) : null;
}

/** Signed ELO change with a real minus sign: "+12", "−5", "±0". */
function formatDelta(n) {
	if (n > 0) return `+${n}`;
	if (n < 0) return `−${Math.abs(n)}`;
	return "±0";
}

function deltaTone(n) {
	return n > 0 ? "win" : n < 0 ? "loss" : "draw";
}

function isMe(playerId) {
	return Boolean(currentUserId) && playerId === currentUserId;
}

/**
 * A side's result tag.
 * @param {boolean} wins Whether this side won (shootout included).
 */
function sideResult(wins) {
	if (isDraw) return { tone: "draw", label: $t("match_hero.draw_label") };
	if (wins) return { tone: "win", label: $t("match_hero.wins") };
	return { tone: "loss", label: $t("match_hero.loses") };
}

/** "Heim · Liverpool", or just "Heim" without a team name. */
function sideTitle(side, teamName) {
	const label =
		side === "home" ? $t("match_hero.home_label") : $t("match_hero.away_label");
	return teamName ? `${label} · ${teamName}` : label;
}
</script>

{#snippet lineup(side, players, teamName, result)}
	<div class="card lineup {side}">
		<div class="head">
			<span class="label team-name">{sideTitle(side, teamName)}</span>
			<span class="chip result-tag tag-{result.tone}">{result.label}</span>
		</div>
		<ul class="rows players">
			{#each players as p (p.player_id)}
				{@const stats = statsLine(p.player_id)}
				{@const elo = eloFor(p.player_id)}
				{@const me = isMe(p.player_id)}
				<li class="player">
					<PlayerAvatar
						player={{
							name: p.profiles?.username,
							avatarUrl: p.profiles?.avatar_url,
							id: p.player_id,
						}}
						size={36}
						self={me}
					/>
					<span class="info">
						<span class="name-line">
							<span class="name">{p.profiles?.username ?? "?"}</span>
							{#if me}
								<span class="chip chip-gold">{$t("leaderboard.you")}</span>
							{/if}
						</span>
						{#if stats}
							<span class="stats">{stats}</span>
						{/if}
					</span>
					{#if elo != null}
						<span class="delta delta-{deltaTone(elo)}">
							{formatDelta(elo)} <span class="elo-unit">ELO</span>
						</span>
					{/if}
				</li>
			{/each}
		</ul>
	</div>
{/snippet}

<Section title={$t("game_detail.section.lineups")} class={className}>
	{#snippet icon()}<UsersIcon size={22} strokeWidth={2} />{/snippet}
	<div class="lineups">
		{@render lineup("home", homePlayers, homeTeamName, sideResult(homeWins))}
		{@render lineup("away", awayPlayers, awayTeamName, sideResult(awayWins))}
	</div>
</Section>

<style>
/* Side by side once the column has room for two lineups. */
.lineups {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr));
	align-items: start;
	gap: 10px;
}

.lineup {
	padding: 0 16px 4px;
}

.head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 10px;
	min-height: 48px;
	border-bottom: 1px solid var(--color-line);
}

.team-name {
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	font-size: 13px;
}

.home .team-name {
	color: var(--color-home);
}

.away .team-name {
	color: var(--color-away);
}

.result-tag {
	flex-shrink: 0;
}

.tag-win {
	background: var(--color-win-soft);
	color: var(--color-win);
}

.tag-loss {
	background: var(--color-loss-soft);
	color: var(--color-loss);
}

.tag-draw {
	background: var(--color-draw);
	color: var(--color-on-draw);
}

.players {
	margin: 0;
	padding: 0;
	list-style: none;
}

.player {
	display: flex;
	align-items: center;
	gap: 12px;
	min-height: 60px;
	padding: 8px 0;
}

.info {
	display: flex;
	flex-direction: column;
	gap: 2px;
	flex: 1;
	min-width: 0;
}

.name-line {
	display: flex;
	align-items: center;
	gap: 8px;
	min-width: 0;
}

.name {
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	font-weight: 700;
	font-size: 15px;
}

.stats {
	color: var(--color-muted);
	font-size: 13px;
}

/* The ELO change is the shared `.delta`: coloured text in A, a pill in B. */
.delta {
	flex-shrink: 0;
	font-size: 16px;
}

.elo-unit {
	font-size: 12px;
}

/* Design B: lineups flat on the section card, the ELO change as a pill. */
:global([data-variant="b"]) .lineups {
	gap: 18px;
}

:global([data-variant="b"]) .delta {
	font-size: 14px;
}

:global([data-variant="b"]) .elo-unit {
	display: none;
}
</style>
