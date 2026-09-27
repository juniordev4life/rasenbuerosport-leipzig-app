import { describe, expect, it } from "vitest";
import {
	buildDuoId,
	findSeasonLeader,
	firstUnqualifiedIndex,
	sortPlayers,
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

	it("puts qualified players before non-qualified ones regardless of rating", () => {
		// Hendrik outrates everyone but hasn't reached the season's
		// min_games yet — a closed-season quirk the API itself sorts
		// past, and the client re-applies defensively.
		const players = [
			{ username: "Hendrik", rating: 1623, qualified: false },
			{ username: "Nikinho", rating: 1613, qualified: true },
			{ username: "Frank", rating: 1500, qualified: true },
		];

		const result = sortPlayers(players, "current");

		expect(result.map((p) => p.username)).toEqual([
			"Nikinho",
			"Frank",
			"Hendrik",
		]);
	});

	it("treats a missing qualified flag as qualified (current-season shape)", () => {
		const players = [
			{ username: "Bob", rating: 1500 },
			{ username: "Alice", rating: 1600 },
		];

		const result = sortPlayers(players, "current");

		expect(result.map((p) => p.username)).toEqual(["Alice", "Bob"]);
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

describe("buildDuoId", () => {
	it("sorts the two ids regardless of call order", () => {
		expect(buildDuoId("bob", "alice")).toBe("alice_bob");
		expect(buildDuoId("alice", "bob")).toBe("alice_bob");
	});
});

describe("findSeasonLeader", () => {
	it("skips a higher-rated but non-qualified player", () => {
		const players = [
			{ username: "Hendrik", rating: 1623, qualified: false },
			{ username: "Nikinho", rating: 1613, qualified: true },
		];

		expect(findSeasonLeader(players)?.username).toBe("Nikinho");
	});

	it("takes the first player when the qualified flag is absent", () => {
		const players = [{ username: "Alice", rating: 1600 }];

		expect(findSeasonLeader(players)?.username).toBe("Alice");
	});

	it("returns null for an empty list", () => {
		expect(findSeasonLeader([])).toBeNull();
	});
});

describe("firstUnqualifiedIndex", () => {
	it("finds the boundary between qualified and non-qualified players", () => {
		const players = [
			{ qualified: true },
			{ qualified: true },
			{ qualified: false },
		];

		expect(firstUnqualifiedIndex(players)).toBe(2);
	});

	it("returns -1 when every player qualifies", () => {
		expect(firstUnqualifiedIndex([{ qualified: true }])).toBe(-1);
	});
});
