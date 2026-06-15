/**
 * Whether a game has a ready-to-watch highlight reel.
 *
 * The games-list endpoint (`/v1/games`) returns `video_status` and
 * `highlight_url` for every row, so this single predicate drives both
 * the dashboard "Recent Highlights" tile and the game-detail cinema
 * layout switch — keeping the two in sync.
 *
 * @param {{ video_status?: string|null, highlight_url?: string|null }|null|undefined} game
 * @returns {boolean} True when a finished highlight video is available.
 * @example
 * games.filter(hasHighlight); // → only games with a playable reel
 */
export function hasHighlight(game) {
	return game?.video_status === "ready" && Boolean(game?.highlight_url);
}
