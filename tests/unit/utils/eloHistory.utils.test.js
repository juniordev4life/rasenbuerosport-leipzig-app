import { describe, expect, it } from "vitest";
import { buildEloHistory } from "$lib/utils/eloHistory.utils.js";

/**
 * Build one newest-first game (the shape `/v1/games` returns) for a single
 * player on the home side. An `elo_snapshot` carrying `ratingAfter` is
 * attached unless `rated` is false, mirroring games that predate the ELO
 * system.
 *
 * @param {string} playerId
 * @param {{ home: number, away: number, ratingAfter?: number, rated?: boolean }} opts
 * @returns {object}
 * @example
 *   game("p1", { home: 3, away: 0, ratingAfter: 1040 }); // a rated win
 */
function game(playerId, { home, away, ratingAfter = 1000, rated = true }) {
	return {
		score_home: home,
		score_away: away,
		played_at: "2020-01-01T00:00:00.000Z",
		game_players: [{ player_id: playerId, team: "home" }],
		elo_snapshot: rated
			? { teamA: [{ playerId, ratingAfter, delta: 0 }], teamB: [] }
			: undefined,
	};
}

describe("buildEloHistory ratingOutcomes", () => {
	it("returns ratingOutcomes oldest-first and aligned 1:1 with ratings", () => {
		// Newest-first (as /v1/games returns): W W W L L — 3 recent wins, 2
		// older losses (the screenshot-1 scenario). Oldest-first the ELO must
		// dip then climb, ending on a win.
		const games = [
			game("p1", { home: 3, away: 0, ratingAfter: 1040 }), // newest — win
			game("p1", { home: 2, away: 1, ratingAfter: 1020 }), // win
			game("p1", { home: 1, away: 0, ratingAfter: 1000 }), // win
			game("p1", { home: 0, away: 2, ratingAfter: 980 }), // loss
			game("p1", { home: 0, away: 1, ratingAfter: 990 }), // oldest — loss
		];

		const me = buildEloHistory(games).get("p1");

		// Oldest-first, climbing to the most recent game.
		expect(me.ratings).toEqual([990, 980, 1000, 1020, 1040]);
		expect(me.ratingOutcomes).toEqual(["loss", "loss", "win", "win", "win"]);
		// Same length → FormSection can colour sparkline point i by
		// ratingOutcomes[i] without a second, differently-ordered source.
		expect(me.ratingOutcomes).toHaveLength(me.ratings.length);
		// The reported bug: the newest point (highest rating) is a WIN, so the
		// right-most dot must be green — not red as the old newest-first pills,
		// indexed against the oldest-first curve, made it.
		expect(me.ratingOutcomes.at(-1)).toBe("win");
		expect(me.ratings.at(-1)).toBe(1040);
	});

	it("skips games without an ELO snapshot in BOTH arrays, keeping them aligned", () => {
		const games = [
			game("p1", { home: 2, away: 0, ratingAfter: 1010 }), // newest — rated win
			game("p1", { home: 0, away: 3, rated: false }), // unrated loss — no snapshot
			game("p1", { home: 1, away: 0, ratingAfter: 1000 }), // oldest — rated win
		];

		const me = buildEloHistory(games).get("p1");

		// Only the two rated games appear in the series — still aligned.
		expect(me.ratings).toEqual([1000, 1010]);
		expect(me.ratingOutcomes).toEqual(["win", "win"]);
		expect(me.ratingOutcomes).toHaveLength(me.ratings.length);
		// The unrated game is still counted in the win/loss tally.
		expect(me.games).toBe(3);
		expect(me.losses).toBe(1);
		expect(me.wins).toBe(2);
	});
});
