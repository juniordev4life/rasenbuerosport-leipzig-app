<script>
import { getTranslate } from "@tolgee/svelte";
import {
	formatEloDelta,
	getEloDeltaByPlayer,
} from "$lib/utils/matchEloSnapshot.utils.js";
import { formatMinute } from "$lib/utils/minute.utils.js";

/**
 * Lineups & performance panel — one column per team, with each player's
 * ELO delta, goals scored, and any cards they picked up. Mirrors the
 * football-card spirit of the desktop mockup.
 *
 * @type {{
 *   game: object,
 *   homePlayers: object[],
 *   awayPlayers: object[],
 *   homeTeamName?: string|null,
 *   awayTeamName?: string|null,
 * }}
 */
let {
	game,
	homePlayers,
	awayPlayers,
	homeTeamName = null,
	awayTeamName = null,
} = $props();

const { t } = getTranslate();

const eloByPlayer = $derived(getEloDeltaByPlayer(game?.elo_snapshot));
const timeline = $derived(
	Array.isArray(game?.score_timeline) ? game.score_timeline : [],
);

function playerStats(playerId) {
	let goals = 0;
	const cards = [];
	for (const e of timeline) {
		if (e.event_type === "red_card" && e.player_id === playerId) {
			cards.push({ type: "red", minute: e.minute, stoppage: e.stoppage });
		} else if (e.event_type === "card" && e.player_id === playerId) {
			cards.push({
				type: e.card_type === "yellow" ? "yellow" : "red",
				minute: e.minute,
				stoppage: e.stoppage,
			});
		} else if (
			e.event_type === "goal" ||
			(!e.event_type && e.scored_by === playerId)
		) {
			if (e.scored_by === playerId) goals += 1;
		}
	}
	return { goals, cards };
}

const homeWins = $derived(game.score_home > game.score_away);
const awayWins = $derived(game.score_away > game.score_home);
const isDraw = $derived(game.score_home === game.score_away);

function resultLabel(side) {
	if (isDraw) return $t("game_detail.lineup.result_draw");
	if (side === "home")
		return homeWins
			? $t("game_detail.lineup.result_win")
			: $t("game_detail.lineup.result_loss");
	return awayWins
		? $t("game_detail.lineup.result_win")
		: $t("game_detail.lineup.result_loss");
}

function resultClass(side) {
	if (isDraw) return "text-text-secondary";
	if (side === "home") return homeWins ? "text-accent-red" : "text-text-muted";
	return awayWins ? "text-success" : "text-text-muted";
}
</script>

{#snippet lineupColumn(players, side, teamName)}
	<div class="rounded-xl bg-bg-input p-3.5">
		<div class="flex items-center justify-between mb-3">
			<div class="text-[11px] tracking-[0.06em] uppercase font-semibold {side === 'home' ? 'text-accent-red' : 'text-success'}">
				{side === "home" ? $t("game_detail.home_team") : $t("game_detail.away_team")}
				{#if teamName} · {teamName}{/if}
			</div>
			<div class="text-[11px] font-medium {resultClass(side)}">
				{resultLabel(side)}
			</div>
		</div>
		<ul class="flex flex-col list-none p-0 m-0">
			{#each players as player (player.player_id)}
				{@const stats = playerStats(player.player_id)}
				{@const elo = eloByPlayer[player.player_id]?.delta ?? null}
				<li class="flex items-center gap-3 py-2 border-b border-border last:border-b-0">
					{#if player.profiles?.avatar_url}
						<img
							src={player.profiles.avatar_url}
							alt={player.profiles?.username || ""}
							class="w-8 h-8 rounded-full object-cover ring-1 {side === 'home' ? 'ring-accent-red' : 'ring-success'} shrink-0"
						/>
					{:else}
						<div class="w-8 h-8 rounded-full {side === 'home' ? 'bg-accent-red/20' : 'bg-success/20'} flex items-center justify-center text-xs font-bold shrink-0">
							{(player.profiles?.username || "?").charAt(0).toUpperCase()}
						</div>
					{/if}
					<span class="flex-1 min-w-0 text-sm font-medium truncate">
						{player.profiles?.username || "?"}
					</span>
					<span class="flex items-center gap-2 text-[11px] text-text-secondary">
						{#if stats.goals > 0}
							<span class="text-success font-medium" aria-label={$t("match_stats.goals")}>⚽ {stats.goals}</span>
						{/if}
						{#each stats.cards as card, i (i)}
							<span class="{card.type === 'yellow' ? 'text-warning' : 'text-accent-red'}">
								{card.type === "yellow" ? "🟨" : "🟥"} {formatMinute({ minute: card.minute ?? 0, stoppage: card.stoppage ?? 0 })}
							</span>
						{/each}
					</span>
					{#if elo !== null}
						<span class="text-xs font-semibold tabular-nums min-w-[40px] text-right {elo > 0 ? 'text-success' : elo < 0 ? 'text-accent-red' : 'text-text-muted'}">
							{formatEloDelta(elo)}
						</span>
					{/if}
				</li>
			{/each}
		</ul>
	</div>
{/snippet}

<section class="rounded-2xl border border-border bg-bg-secondary p-4 sm:p-5">
	<h3 class="text-[11px] tracking-[0.08em] uppercase text-text-muted font-semibold mb-3">
		{$t("game_detail.section.lineups")}
	</h3>
	<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
		{@render lineupColumn(homePlayers, "home", homeTeamName)}
		{@render lineupColumn(awayPlayers, "away", awayTeamName)}
	</div>
</section>
