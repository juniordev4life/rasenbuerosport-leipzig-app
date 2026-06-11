import { post } from "./api.services.js";

/**
 * Office recording agent commands. Both calls are fire-and-forget: capture
 * is a nice-to-have running on a separate box — a failed command must never
 * block or break the match flow, so errors are logged and swallowed.
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
