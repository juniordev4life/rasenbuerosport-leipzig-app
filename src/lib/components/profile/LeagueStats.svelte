<script>
	import { getTranslate } from "@tolgee/svelte";
	import { user } from "$lib/stores/auth.stores.js";
	import { getTeamByName, getCountryFlag } from "$lib/constants/teams.constants.js";

	/**
	 * LeagueStats - Shows win rate per football league
	 * @param {object[]} games - User's games with game_players
	 */
	let { games = [] } = $props();

	const { t } = getTranslate();

	const userId = $derived($user?.id);

	/**
	 * Aggregate W/D/L per league from game data
	 * @returns {{ league: string, country: string, wins: number, draws: number, losses: number, total: number, winRate: number }[]}
	 */
	const leagueData = $derived.by(() => {
		const leagueMap = {};

		for (const game of games) {
			if (!game.game_players) continue;

			// Find which team the user was on and what team_name they used
			const userEntry = game.game_players.find((p) => p.player_id === userId);
			if (!userEntry?.team_name) continue;

			const teamInfo = getTeamByName(userEntry.team_name);
			if (!teamInfo) continue;

			const league = teamInfo.league;
			const country = teamInfo.country;

			if (!leagueMap[league]) {
				leagueMap[league] = { league, country, wins: 0, draws: 0, losses: 0, total: 0 };
			}

			leagueMap[league].total++;

			const userTeam = userEntry.team;
			const isHomeWin = game.score_home > game.score_away;
			const isDraw = game.score_home === game.score_away;
			const isUserWin =
				(userTeam === "home" && isHomeWin) ||
				(userTeam === "away" && !isHomeWin && !isDraw);

			if (isDraw) {
				leagueMap[league].draws++;
			} else if (isUserWin) {
				leagueMap[league].wins++;
			} else {
				leagueMap[league].losses++;
			}
		}

		// Calculate win rate and sort by it (min 2 games)
		return Object.values(leagueMap)
			.filter((l) => l.total >= 2)
			.map((l) => ({
				...l,
				winRate: Math.round((l.wins / l.total) * 100),
			}))
			.sort((a, b) => b.winRate - a.winRate)
			.slice(0, 5);
	});
</script>

{#if leagueData.length > 0}
	<section>
		<h2 class="text-lg font-bold mb-3">{$t("profile.league_stats")}</h2>
		<div class="flex flex-col gap-2">
			{#each leagueData as league (league.league)}
				<div class="bg-bg-secondary border border-border rounded-lg px-3 py-2.5">
					<div class="flex items-center justify-between mb-1.5">
						<span class="text-sm text-text-primary font-medium">
							{getCountryFlag(league.country)} {league.league}
						</span>
						<span class="text-xs text-text-secondary">
							{$t("profile.league_win_rate", { rate: league.winRate })}
						</span>
					</div>
					<!-- Win rate bar -->
					<div class="flex h-2 rounded-full overflow-hidden bg-bg-input">
						<div class="bg-success rounded-full" style="width: {league.winRate}%"></div>
					</div>
					<p class="text-[10px] text-text-secondary mt-1">
						{league.wins}S · {league.draws}U · {league.losses}N · {league.total} {$t("leaderboard.games_short")}
					</p>
				</div>
			{/each}
		</div>
	</section>
{/if}
