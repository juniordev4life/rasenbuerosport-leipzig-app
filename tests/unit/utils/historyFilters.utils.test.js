import { describe, expect, it } from "vitest";
import {
	getPlayerResult,
	getWindowStart,
	isHistoryComplete,
	matchesHistoryFilters,
	ownGamesOnly,
} from "../../../src/lib/utils/historyFilters.utils.js";

// Wednesday 7 Oct 2026, 15:30 local time.
const NOW = new Date(2026, 9, 7, 15, 30);
const MONDAY = new Date(2026, 9, 5).getTime();

/**
 * A game the signed-in player "me" played on the home side.
 * @param {object} [overrides]
 */
function game(overrides = {}) {
	return {
		id: "g1",
		played_at: new Date(2026, 9, 6, 12, 0).toISOString(),
		score_home: 2,
		score_away: 1,
		game_players: [
			{ player_id: "me", team: "home" },
			{ player_id: "flo", team: "away" },
		],
		...overrides,
	};
}

const ALL = { who: "all", erg: "all", windowStart: null, userId: "me" };

describe("getWindowStart", () => {
	it.each([
		["today", new Date(2026, 9, 7).getTime()],
		["thisweek", MONDAY],
		["thismonth", new Date(2026, 9, 1).getTime()],
		["all", null],
	])("starts %s at local midnight", (zeit, expected) => {
		expect(getWindowStart(zeit, NOW)).toBe(expected);
	});
});

describe("ownGamesOnly", () => {
	it.each([
		["me", "all", true],
		["all", "wins", true],
		["all", "losses", true],
		["all", "zunull", false],
		["all", "all", false],
	])("who=%s erg=%s → %s", (who, erg, expected) => {
		expect(ownGamesOnly(who, erg)).toBe(expected);
	});
});

describe("getPlayerResult", () => {
	it("reads a win, a loss and a draw from the player's side", () => {
		expect(getPlayerResult(game(), "me")).toBe("W");
		expect(getPlayerResult(game(), "flo")).toBe("L");
		expect(getPlayerResult(game({ score_away: 2 }), "me")).toBe("D");
	});

	it("lets the penalty shootout decide a level score", () => {
		// Arrange
		const shootout = game({
			score_away: 2,
			penalty_shootout: { winner_side: "away" },
		});

		// Act + Assert
		expect(getPlayerResult(shootout, "flo")).toBe("W");
		expect(getPlayerResult(shootout, "me")).toBe("L");
	});

	it("has no result for a game still being analysed or one the player missed", () => {
		expect(
			getPlayerResult(game({ pending: true, score_home: 0, score_away: 0 }), "me"),
		).toBeNull();
		expect(getPlayerResult(game(), "ben")).toBeNull();
		expect(getPlayerResult(game(), null)).toBeNull();
	});
});

describe("matchesHistoryFilters", () => {
	it("keeps games from the window start on and drops older ones", () => {
		// Arrange
		const filters = { ...ALL, windowStart: MONDAY };
		const atStart = game({ played_at: new Date(MONDAY).toISOString() });
		const sundayNight = game({ played_at: new Date(MONDAY - 1).toISOString() });

		// Act + Assert
		expect(matchesHistoryFilters(atStart, filters)).toBe(true);
		expect(matchesHistoryFilters(sundayNight, filters)).toBe(false);
	});

	it("keeps only the player's games under Meine Spiele", () => {
		const others = game({
			game_players: [{ player_id: "ben", team: "home" }],
		});

		expect(matchesHistoryFilters(game(), { ...ALL, who: "me" })).toBe(true);
		expect(matchesHistoryFilters(others, { ...ALL, who: "me" })).toBe(false);
	});

	it("reads Nur Siege as the player's wins under Alle Spiele, not home wins", () => {
		// Arrange: the home side wins, the player is on the away side
		const awayLoss = game({
			game_players: [
				{ player_id: "ben", team: "home" },
				{ player_id: "me", team: "away" },
			],
		});
		const awayWin = game({ ...awayLoss, score_home: 0, score_away: 3 });
		const wins = { ...ALL, erg: "wins" };
		const losses = { ...ALL, erg: "losses" };

		// Act + Assert
		expect(matchesHistoryFilters(awayLoss, wins)).toBe(false);
		expect(matchesHistoryFilters(awayWin, wins)).toBe(true);
		expect(matchesHistoryFilters(awayLoss, losses)).toBe(true);
	});

	it("counts a shootout win as a win, like the match card does", () => {
		const shootoutWin = game({
			score_away: 2,
			penalty_shootout: { winner_side: "home" },
		});

		expect(matchesHistoryFilters(shootoutWin, { ...ALL, erg: "wins" })).toBe(
			true,
		);
	});

	it("keeps clean sheets under Zu Null but not a game still being analysed", () => {
		const zuNull = { ...ALL, erg: "zunull" };

		expect(matchesHistoryFilters(game({ score_away: 0 }), zuNull)).toBe(true);
		expect(matchesHistoryFilters(game(), zuNull)).toBe(false);
		expect(
			matchesHistoryFilters(
				game({ pending: true, score_home: 0, score_away: 0 }),
				zuNull,
			),
		).toBe(false);
	});

	it("drops a game without a valid date", () => {
		expect(matchesHistoryFilters(game({ played_at: "nope" }), ALL)).toBe(false);
	});
});

describe("isHistoryComplete", () => {
	const thisWeek = game({ played_at: new Date(2026, 9, 6).toISOString() });
	const lastWeek = game({ played_at: new Date(2026, 9, 2).toISOString() });

	it("is complete once the API has no more pages", () => {
		expect(
			isHistoryComplete({ games: [thisWeek], hasMore: false, windowStart: null }),
		).toBe(true);
	});

	it("is complete once a loaded game is older than the window", () => {
		expect(
			isHistoryComplete({
				games: [thisWeek, lastWeek],
				hasMore: true,
				windowStart: MONDAY,
			}),
		).toBe(true);
	});

	it("stays incomplete while every loaded game is inside the window", () => {
		expect(
			isHistoryComplete({ games: [thisWeek], hasMore: true, windowStart: MONDAY }),
		).toBe(false);
	});

	it("stays incomplete without a window until the last page", () => {
		expect(
			isHistoryComplete({
				games: [thisWeek, lastWeek],
				hasMore: true,
				windowStart: null,
			}),
		).toBe(false);
	});
});
