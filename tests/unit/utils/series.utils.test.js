import { describe, expect, it } from "vitest";
import { detectUserSeries } from "../../../src/lib/utils/series.utils.js";

/** A finished 1v1 game; the user plays home. */
function game(scoreHome, scoreAway) {
	return {
		score_home: scoreHome,
		score_away: scoreAway,
		game_players: [
			{ player_id: "me", team: "home" },
			{ player_id: "rival", team: "away" },
		],
		score_timeline: [],
	};
}

describe("detectUserSeries", () => {
	it("returns a win streak with its length and no text", () => {
		// Arrange: newest first, three wins then a loss
		const games = [game(3, 1), game(2, 0), game(4, 2), game(0, 1)];

		// Act
		const series = detectUserSeries(games, "me");

		// Assert
		const streak = series.find((s) => s.type === "win_streak");
		expect(streak).toEqual({ id: "me-win-streak", type: "win_streak", count: 3 });
	});

	it("returns nothing without games or user", () => {
		// Arrange + Act + Assert
		expect(detectUserSeries([], "me")).toEqual([]);
		expect(detectUserSeries([game(1, 0)], null)).toEqual([]);
	});
});
