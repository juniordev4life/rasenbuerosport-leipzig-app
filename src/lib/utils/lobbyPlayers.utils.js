/**
 * Order players for the new-game lobby: most games played first, so the
 * regulars fill the first visible tiles. Ties (and players the API sent
 * without a `games_played` count) fall back to the username.
 *
 * @param {Array<{ id: string, username: string, games_played?: number }>} players
 * @returns {Array<{ id: string, username: string, games_played?: number }>} a new, sorted array
 * @example
 * sortPlayersByGamesPlayed([
 *   { id: "a", username: "AH", games_played: 2 },
 *   { id: "b", username: "Jay", games_played: 96 },
 * ]);
 * // → [{ id: "b", … }, { id: "a", … }]
 */
export function sortPlayersByGamesPlayed(players) {
	return [...players].sort(
		(a, b) =>
			(b.games_played ?? 0) - (a.games_played ?? 0) ||
			a.username.localeCompare(b.username),
	);
}
