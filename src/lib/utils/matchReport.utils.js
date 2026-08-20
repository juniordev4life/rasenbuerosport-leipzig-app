/**
 * How long a recorded game may wait for the capture pipeline before the match
 * report is generated regardless. A normal run reaches a terminal status within
 * minutes; this bound exists only so a capture that never reported one cannot
 * block the report forever.
 */
export const ANALYSIS_GRACE_MINUTES = 60;

/**
 * Whether the match report must still be withheld for this game.
 *
 * The reporter narrates the finished match, so the text has to wait for the
 * real result: never while the game is `pending` (score is still 0:0 with an
 * empty timeline), and for recorded games not until the capture pipeline
 * reached a terminal `video_status` — the API generates the report on that
 * final status PATCH.
 *
 * The wait for the pipeline is deliberately time-bounded. A capture that dies
 * before it can report anything (ffmpeg failing instantly on a full disk)
 * leaves `video_status` empty indefinitely; unbounded, that showed a "preparing"
 * spinner which never resolved and never asked for a report — six games sat
 * like that in August 2026. `pending` stays unbounded on purpose: such a game
 * genuinely has no result yet, and the API refuses to narrate it.
 *
 * @param {{pending?: boolean, recording_id?: string|null, video_status?: string|null, played_at?: string|null}|null|undefined} game
 * @param {number} [now=Date.now()] - Reference time in ms; injectable for tests
 * @returns {boolean} True while the report must not be generated yet
 * @example
 * isReportBlocked({ recording_id: "r1", video_status: "processing", played_at: new Date().toISOString() }); // true
 * isReportBlocked({ recording_id: "r1", video_status: "ready" }); // false
 */
export function isReportBlocked(game, now = Date.now()) {
	if (!game) return false;
	if (game.pending) return true;
	if (!game.recording_id) return false;
	if (game.video_status === "ready" || game.video_status === "failed") {
		return false;
	}
	const playedAt = game.played_at ? Date.parse(game.played_at) : Number.NaN;
	// No usable timestamp: keep the old behaviour and wait for the pipeline.
	if (Number.isNaN(playedAt)) return true;
	return now - playedAt <= ANALYSIS_GRACE_MINUTES * 60_000;
}
