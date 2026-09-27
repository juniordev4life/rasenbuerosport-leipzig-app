import { describe, expect, it } from "vitest";
import { sortPlayersByGamesPlayed } from "$lib/utils/lobbyPlayers.utils.js";

const ids = (players) => players.map((p) => p.id);

describe("sortPlayersByGamesPlayed", () => {
	it("puts the players with the most games first", () => {
		// Arrange
		const players = [
			{ id: "ah", username: "AH", games_played: 2 },
			{ id: "jay", username: "Jay", games_played: 96 },
			{ id: "flo", username: "FlorAIn", games_played: 69 },
		];

		// Act
		const sorted = sortPlayersByGamesPlayed(players);

		// Assert
		expect(ids(sorted)).toEqual(["jay", "flo", "ah"]);
	});

	it("breaks ties by username", () => {
		// Arrange
		const players = [
			{ id: "fs", username: "FS", games_played: 2 },
			{ id: "ah", username: "AH", games_played: 2 },
		];

		// Act
		const sorted = sortPlayersByGamesPlayed(players);

		// Assert
		expect(ids(sorted)).toEqual(["ah", "fs"]);
	});

	it("treats a missing count as zero games", () => {
		// Arrange
		const players = [
			{ id: "new", username: "Anna" },
			{ id: "jay", username: "Jay", games_played: 1 },
		];

		// Act
		const sorted = sortPlayersByGamesPlayed(players);

		// Assert
		expect(ids(sorted)).toEqual(["jay", "new"]);
	});

	it("leaves the input array untouched", () => {
		// Arrange
		const players = [
			{ id: "ah", username: "AH", games_played: 2 },
			{ id: "jay", username: "Jay", games_played: 96 },
		];

		// Act
		sortPlayersByGamesPlayed(players);

		// Assert
		expect(ids(players)).toEqual(["ah", "jay"]);
	});
});
