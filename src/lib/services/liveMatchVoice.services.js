import { post } from "./api.services.js";

/**
 * Send a German live-match transcript to the API for intent
 * extraction.
 *
 * @param {object} args
 * @param {string} args.transcript - The raw user transcript from STT.
 * @param {Array<{ id: string, username: string, side: "home"|"away" }>} args.players
 * @param {number} args.currentMinute
 * @returns {Promise<
 *   | { ok: true, eventType: "goal"|"yellow_card"|"red_card"|"penalty_missed", playerId: string, side: "home"|"away", minute: number, transcript: string }
 *   | { ok: false, reason: string, transcript: string }
 * >}
 */
export async function parseLiveMatchVoiceEvent({
	transcript,
	players,
	currentMinute,
}) {
	const response = await post("/v1/live-match/voice-event", {
		transcript,
		players,
		currentMinute,
	});
	return response.data;
}
