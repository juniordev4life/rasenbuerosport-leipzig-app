import { describe, expect, it } from "vitest";
import {
	buildDuoId,
	sortPlayers,
	sortTableRows,
} from "$lib/utils/leaderboard.utils.js";

describe("sortPlayers", () => {
	it("sorts by rating desc for the 'current' view", () => {
		const players = [
			{ username: "Bob", rating: 1500 },
			{ username: "Alice", rating: 1600 },
			{ username: "Carl", rating: 1550 },
		];

		const result = sortPlayers(players, "current");

		expect(result.map((p) => p.username)).toEqual(["Alice", "Carl", "Bob"]);
	});

	it("breaks rating ties by username ascending", () => {
		const players = [
			{ username: "Zoe", rating: 1500 },
			{ username: "Amy", rating: 1500 },
		];

		const result = sortPlayers(players, "current");

		expect(result.map((p) => p.username)).toEqual(["Amy", "Zoe"]);
	});

	it("sorts by form_delta desc for the 'form' view", () => {
		const players = [
			{ username: "Bob", rating: 1600, form_delta: -10 },
			{ username: "Alice", rating: 1500, form_delta: 40 },
		];

		const result = sortPlayers(players, "form");

		expect(result.map((p) => p.username)).toEqual(["Alice", "Bob"]);
	});

	it("treats a missing form_delta as the lowest value", () => {
		const players = [
			{ username: "NoForm", rating: 1500, form_delta: null },
			{ username: "HasForm", rating: 1500, form_delta: 5 },
		];

		const result = sortPlayers(players, "form");

		expect(result.map((p) => p.username)).toEqual(["HasForm", "NoForm"]);
	});

	it("does not mutate the input array", () => {
		const players = [
			{ username: "Bob", rating: 1500 },
			{ username: "Alice", rating: 1600 },
		];
		const original = [...players];

		sortPlayers(players, "current");

		expect(players).toEqual(original);
	});
});

describe("sortTableRows", () => {
	const rows = [
		{ username: "A", points: 20, points_per_game: 2.5, goal_diff: 4, goals_for: 10 },
		{ username: "B", points: 25, points_per_game: 2.08, goal_diff: 12, goals_for: 30 },
		{ username: "C", points: 25, points_per_game: 2.08, goal_diff: 15, goals_for: 28 },
	];

	it("sorts by points desc, then points_per_game, then goal_diff for 'total'", () => {
		const result = sortTableRows(rows, "total");

		expect(result.map((r) => r.username)).toEqual(["C", "B", "A"]);
	});

	it("leads with points_per_game for 'per_game'", () => {
		const result = sortTableRows(rows, "per_game");

		expect(result.map((r) => r.username)).toEqual(["A", "C", "B"]);
	});

	it("does not mutate the input array", () => {
		const original = [...rows];

		sortTableRows(rows, "total");

		expect(rows).toEqual(original);
	});
});

describe("buildDuoId", () => {
	it("sorts the two ids regardless of call order", () => {
		expect(buildDuoId("bob", "alice")).toBe("alice_bob");
		expect(buildDuoId("alice", "bob")).toBe("alice_bob");
	});
});
