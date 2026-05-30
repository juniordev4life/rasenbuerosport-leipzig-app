import { get } from "./api.services.js";

/**
 * Fetch the most recently persisted Friday-talkshow episode for the
 * dashboard's Talkrunde card.
 *
 * Returns the trimmed projection the backend emits: `week_start`,
 * `week_end`, `generated_at`, `audio_url`, `turn_count`, `summary`.
 * Returns `null` when no episode has been generated yet — the card
 * falls back to its empty-state placeholder in that case.
 *
 * @returns {Promise<object|null>}
 * @example
 *   const episode = await getLatestTalkshowEpisode();
 *   if (episode?.audio_url) {
 *     // → render the audio player
 *   }
 */
export async function getLatestTalkshowEpisode() {
	const response = await get("/v1/talkshow/latest");
	return response.data ?? null;
}
