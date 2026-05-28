import { describe, expect, it } from "vitest";
import {
	computePenaltyShotEloDeltas,
	computeRunningScore,
	countShotsTaken,
	getBoardCellCount,
	getCurrentRound,
	getNextShootingTeam,
	isPenaltyShootoutDecided,
	PENALTY_ELO_DELTAS,
} from "$lib/utils/penaltyShootout.utils.js";

const goalHome = { team: "home", result: "goal" };
const missHome = { team: "home", result: "missed" };
const goalAway = { team: "away", result: "goal" };
const missAway = { team: "away", result: "missed" };

describe("computeRunningScore", () => {
	it("returns 0:0 for empty shot list", () => {
		expect(computeRunningScore([])).toEqual({ home: 0, away: 0 });
	});

	it("counts only goals", () => {
		const shots = [goalHome, missAway, goalHome, goalAway];
		expect(computeRunningScore(shots)).toEqual({ home: 2, away: 1 });
	});
});

describe("countShotsTaken", () => {
	it("tracks shots per side regardless of result", () => {
		const shots = [goalHome, missAway, missHome, goalAway, goalHome];
		expect(countShotsTaken(shots)).toEqual({ home: 3, away: 2 });
	});
});

describe("getNextShootingTeam", () => {
	it("starts with home", () => {
		expect(getNextShootingTeam([])).toBe("home");
	});

	it("alternates every shot", () => {
		expect(getNextShootingTeam([goalHome])).toBe("away");
		expect(getNextShootingTeam([goalHome, missAway])).toBe("home");
		expect(getNextShootingTeam([goalHome, missAway, goalHome])).toBe("away");
	});
});

describe("getCurrentRound", () => {
	it("is round 1 before any shot", () => {
		expect(getCurrentRound([])).toBe(1);
	});

	it("stays in the current round until both sides have shot", () => {
		expect(getCurrentRound([goalHome])).toBe(1);
		expect(getCurrentRound([goalHome, goalAway])).toBe(2);
	});

	it("advances correctly into sudden death", () => {
		// 10 shots = round 5 done → round 6 next
		const tenShots = [
			goalHome,
			goalAway,
			goalHome,
			goalAway,
			goalHome,
			goalAway,
			goalHome,
			goalAway,
			goalHome,
			goalAway,
		];
		expect(getCurrentRound(tenShots)).toBe(6);
	});
});

describe("isPenaltyShootoutDecided", () => {
	it("is not decided on empty list", () => {
		expect(isPenaltyShootoutDecided([])).toEqual({
			decided: false,
			winnerSide: null,
		});
	});

	it("ends regular phase early when home is mathematically out of reach", () => {
		// Home 3:0 after 3 shots each, away has 2 remaining → away can at best tie at 2
		// → home leads by more than away can catch.
		const shots = [
			goalHome,
			missAway,
			goalHome,
			missAway,
			goalHome,
			missAway,
		];
		expect(isPenaltyShootoutDecided(shots)).toEqual({
			decided: true,
			winnerSide: "home",
		});
	});

	it("ends regular phase early when away is out of reach", () => {
		const shots = [
			missHome,
			goalAway,
			missHome,
			goalAway,
			missHome,
			goalAway,
		];
		expect(isPenaltyShootoutDecided(shots)).toEqual({
			decided: true,
			winnerSide: "away",
		});
	});

	it("does not call decision while regular phase is still mathematically open", () => {
		// 1:1 after 3 shots each — both can still catch up
		const shots = [
			goalHome,
			goalAway,
			missHome,
			missAway,
			missHome,
			missAway,
		];
		expect(isPenaltyShootoutDecided(shots)).toEqual({
			decided: false,
			winnerSide: null,
		});
	});

	it("waits for parity in sudden death", () => {
		// 5+5 tied 4:4, then home scores → still need away's shot
		const shots = [
			goalHome,
			goalAway,
			goalHome,
			goalAway,
			goalHome,
			goalAway,
			goalHome,
			goalAway,
			missHome,
			missAway,
			goalHome, // 11th shot, sudden death round 6
		];
		expect(isPenaltyShootoutDecided(shots)).toEqual({
			decided: false,
			winnerSide: null,
		});
	});

	it("ends sudden death when score diverges at even shot count", () => {
		const shots = [
			goalHome,
			goalAway,
			goalHome,
			goalAway,
			goalHome,
			goalAway,
			goalHome,
			goalAway,
			missHome,
			missAway,
			goalHome,
			missAway, // 6th round done, home 5 - away 4
		];
		expect(isPenaltyShootoutDecided(shots)).toEqual({
			decided: true,
			winnerSide: "home",
		});
	});
});

describe("computePenaltyShotEloDeltas", () => {
	it("rewards a converted penalty with the goal bonus only", () => {
		expect(
			computePenaltyShotEloDeltas({ shooterId: "alice", result: "goal" }),
		).toEqual({ alice: PENALTY_ELO_DELTAS.GOAL_SCORED });
	});

	it("penalises the shooter and rewards the keeper on a save", () => {
		expect(
			computePenaltyShotEloDeltas({
				shooterId: "alice",
				result: "missed",
				keeperId: "bob",
			}),
		).toEqual({
			alice: PENALTY_ELO_DELTAS.PENALTY_MISSED,
			bob: PENALTY_ELO_DELTAS.PENALTY_SAVED,
		});
	});

	it("penalises only the shooter when the ball misses the goal entirely", () => {
		expect(
			computePenaltyShotEloDeltas({
				shooterId: "alice",
				result: "missed",
				keeperId: null,
			}),
		).toEqual({ alice: PENALTY_ELO_DELTAS.PENALTY_MISSED });
	});
});

describe("getBoardCellCount", () => {
	it("renders the regular 5 cells before sudden death", () => {
		expect(getBoardCellCount([])).toBe(5);
		expect(getBoardCellCount([goalHome, missAway])).toBe(5);
	});

	it("grows by one per sudden-death round", () => {
		// 5+5 done → round 6 → 6 cells
		const tenShots = Array(10).fill(goalHome);
		expect(getBoardCellCount(tenShots)).toBe(6);
	});
});
