/**
 * Client-side narrative-series detection. Walks the user's recent
 * games and flags the four canonical series types the home screen
 * surfaces. League-wide detection (other players' streaks) is a
 * follow-up — for V1 we only surface the logged-in user's own.
 */

/** Did the user win this game? `null` for a draw. */
function userResult(game, userId) {
	const player = game.game_players?.find((p) => p.player_id === userId);
	if (!player) return null;
	const homeScore = game.score_home ?? 0;
	const awayScore = game.score_away ?? 0;
	if (homeScore === awayScore) return null;
	const winnerSide = homeScore > awayScore ? "home" : "away";
	if (player.team === winnerSide) return "W";
	return "L";
}

/**
 * Count consecutive results matching `target` ('W' or 'L'), starting
 * from the most recent game. Stops as soon as a different result
 * appears (draws and missing player rows also break the streak).
 */
function consecutive(games, userId, target) {
	let count = 0;
	for (const game of games) {
		if (userResult(game, userId) === target) count += 1;
		else break;
	}
	return count;
}

/** Goals scored by the user in a given game. */
function userGoals(game, userId) {
	const timeline = Array.isArray(game.score_timeline)
		? game.score_timeline
		: [];
	return timeline.filter(
		(e) =>
			e.scored_by === userId &&
			e.event_type !== "red_card" &&
			e.event_type !== "card" &&
			e.event_type !== "penalty_missed",
	).length;
}

/** Goals the user's team conceded. */
function teamConceded(game, userId) {
	const player = game.game_players?.find((p) => p.player_id === userId);
	if (!player) return null;
	return player.team === "home"
		? (game.score_away ?? 0)
		: (game.score_home ?? 0);
}

/**
 * Build the home-screen series list for a single user: which runs are
 * active and how long they are. The texts live in the i18n files
 * (`home.series.<type>`). Games must be sorted newest-first.
 *
 * @param {object[]} games
 * @param {string} userId
 * @returns {Array<{ id: string, type: "win_streak"|"loss_streak"|"scoring"|"defensive", count: number }>}
 * @example
 *   const series = detectUserSeries(recentGames, "marco");
 *   series // → [{ id: "marco-win-streak", type: "win_streak", count: 4 }]
 */
export function detectUserSeries(games, userId) {
	const series = [];
	if (!games?.length || !userId) return series;

	const winStreak = consecutive(games, userId, "W");
	if (winStreak >= 3) {
		series.push({
			id: `${userId}-win-streak`,
			type: "win_streak",
			count: winStreak,
		});
	}

	const lossStreak = consecutive(games, userId, "L");
	if (lossStreak >= 3) {
		series.push({
			id: `${userId}-loss-streak`,
			type: "loss_streak",
			count: lossStreak,
		});
	}

	const lastFive = games.slice(0, 5);
	const bigScoring = lastFive.filter((g) => userGoals(g, userId) >= 3);
	if (bigScoring.length >= 2) {
		series.push({
			id: `${userId}-scoring`,
			type: "scoring",
			count: bigScoring.length,
		});
	}

	const cleanSheets = lastFive.filter((g) => teamConceded(g, userId) === 0);
	if (cleanSheets.length >= 2) {
		series.push({
			id: `${userId}-defensive`,
			type: "defensive",
			count: cleanSheets.length,
		});
	}

	return series;
}
