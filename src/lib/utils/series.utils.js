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
 * Build the home-screen series list for a single user. Games must be
 * sorted newest-first.
 *
 * @param {object[]} games
 * @param {string} userId
 * @param {string} userName
 * @returns {Array<{ id: string, type: string, headline: string, detail: string }>}
 * @example
 *   const series = detectUserSeries(recentGames, "marco", "Marco");
 *   series // → [{ type: "win_streak", headline: "Marco hat eine Siegesserie!", ... }]
 */
export function detectUserSeries(games, userId, userName) {
	const series = [];
	if (!games?.length || !userId) return series;

	const winStreak = consecutive(games, userId, "W");
	if (winStreak >= 3) {
		series.push({
			id: `${userId}-win-streak`,
			type: "win_streak",
			headline: `${userName} hat eine Siegesserie!`,
			detail: `${winStreak} Siege in Folge`,
		});
	}

	const lossStreak = consecutive(games, userId, "L");
	if (lossStreak >= 3) {
		series.push({
			id: `${userId}-loss-streak`,
			type: "loss_streak",
			headline: `${userName} steckt in einer Durststrecke...`,
			detail: `${lossStreak} Niederlagen in Folge`,
		});
	}

	const lastFive = games.slice(0, 5);
	const bigScoring = lastFive.filter((g) => userGoals(g, userId) >= 3);
	if (bigScoring.length >= 2) {
		series.push({
			id: `${userId}-scoring`,
			type: "scoring",
			headline: `${userName} ist ein Torjäger!`,
			detail: `${bigScoring.length} Spiele mit 3+ Toren`,
		});
	}

	const cleanSheets = lastFive.filter((g) => teamConceded(g, userId) === 0);
	if (cleanSheets.length >= 2) {
		series.push({
			id: `${userId}-defensive`,
			type: "defensive",
			headline: `${userName} ist eine Mauer!`,
			detail: `${cleanSheets.length} Spiele zu Null`,
		});
	}

	return series;
}
