import { get, post } from "./api.services.js";

/**
 * Office recording agent calls. The command calls (start/stop/abort) are
 * fire-and-forget: capture is a nice-to-have running on a separate box — a
 * failed command must never block or break the match flow, so errors are
 * logged and swallowed. fetchRecordingStatus returns a value but swallows
 * errors the same way (returns null).
 */

/**
 * Asks the office agent to start recording the match.
 * @param {string} recordingId - Client-generated provisional id; the real
 *   game id does not exist until the game is saved after the final whistle
 * @returns {Promise<void>}
 * @example
 * requestRecordingStart(crypto.randomUUID());
 */
export function requestRecordingStart(recordingId) {
	return post("/v1/recording/command", {
		action: "start",
		game_id: recordingId,
	}).catch((err) => console.warn("recording start command failed:", err));
}

/**
 * Asks the office agent to stop recording and upload the capture.
 * @param {string} gameId - Real game id after saving; falls back to the
 *   provisional recording id when the match is abandoned without saving
 * @returns {Promise<void>}
 * @example
 * requestRecordingStop(savedGame.id);
 */
export function requestRecordingStop(gameId) {
	return post("/v1/recording/command", {
		action: "stop",
		game_id: gameId,
	}).catch((err) => console.warn("recording stop command failed:", err));
}

/**
 * Asks the office agent to abort recording: stop AND discard the file (vs.
 * stop, which keeps it for the highlight pipeline). Sent when the user backs
 * out of the live step or dismisses the recording-error dialog.
 * @param {string} recordingId - Provisional recording id to discard
 * @returns {Promise<void>}
 * @example
 * requestRecordingAbort(recordingId);
 */
export function requestRecordingAbort(recordingId) {
	return post("/v1/recording/command", {
		action: "abort",
		game_id: recordingId,
	}).catch((err) => console.warn("recording abort command failed:", err));
}

/**
 * Polls the agent-reported capture status for a recording id during the live
 * step. Swallows errors (returns null) so a flaky poll never breaks the match
 * flow — the caller's own timeout decides when an absent status means failure.
 * @param {string} recordingId - The provisional recording id being polled
 * @returns {Promise<"recording"|"failed"|"stopped"|"aborted"|null>} Reported
 *   status, or null when not yet reported / unknown / the request failed
 * @example
 * if ((await fetchRecordingStatus(recordingId)) === "failed") showError();
 */
export async function fetchRecordingStatus(recordingId) {
	try {
		const res = await get(
			`/v1/recording/status?recording_id=${encodeURIComponent(recordingId)}`,
		);
		return res.data?.status ?? null;
	} catch (err) {
		console.warn("recording status poll failed:", err);
		return null;
	}
}
