import { describe, it, expect } from "vitest";
import { buildRematchUrl, parseRematchParams } from "$lib/utils/rematch.utils.js";

describe("buildRematchUrl", () => {
	it("builds correct URL for 1v1 rematch", () => {
		const url = buildRematchUrl({
			homePlayers: ["p1"],
			awayPlayers: ["p2"],
			homeTeam: "Bayern",
			awayTeam: "Dortmund",
		});

		const params = new URLSearchParams(url.split("?")[1]);
		expect(params.get("hp")).toBe("p1");
		expect(params.get("ap")).toBe("p2");
		expect(params.get("ht")).toBe("Bayern");
		expect(params.get("at")).toBe("Dortmund");
		expect(url.startsWith("/app/games/new?")).toBe(true);
	});

	it("builds correct URL for 2v2 rematch", () => {
		const url = buildRematchUrl({
			homePlayers: ["p1", "p2"],
			awayPlayers: ["p3", "p4"],
			homeTeam: "Bayern",
			awayTeam: "Real Madrid",
		});

		const params = new URLSearchParams(url.split("?")[1]);
		expect(params.get("hp")).toBe("p1,p2");
		expect(params.get("ap")).toBe("p3,p4");
		expect(params.get("ht")).toBe("Bayern");
		expect(params.get("at")).toBe("Real Madrid");
	});

	it("swaps sides when swap=true", () => {
		const url = buildRematchUrl({
			homePlayers: ["p1"],
			awayPlayers: ["p2"],
			homeTeam: "Bayern",
			awayTeam: "Dortmund",
			swap: true,
		});

		const params = new URLSearchParams(url.split("?")[1]);
		expect(params.get("hp")).toBe("p2");
		expect(params.get("ap")).toBe("p1");
		expect(params.get("ht")).toBe("Dortmund");
		expect(params.get("at")).toBe("Bayern");
	});

	it("handles team names with special characters", () => {
		const url = buildRematchUrl({
			homePlayers: ["p1"],
			awayPlayers: ["p2"],
			homeTeam: "FC St. Pauli",
			awayTeam: "1. FC Köln",
		});

		const params = new URLSearchParams(url.split("?")[1]);
		expect(params.get("ht")).toBe("FC St. Pauli");
		expect(params.get("at")).toBe("1. FC Köln");
	});
});

describe("parseRematchParams", () => {
	it("parses valid 1v1 params", () => {
		const params = new URLSearchParams("hp=p1&ap=p2&ht=Bayern&at=Dortmund");
		const result = parseRematchParams(params);

		expect(result).toEqual({
			homePlayers: ["p1"],
			awayPlayers: ["p2"],
			homeTeam: "Bayern",
			awayTeam: "Dortmund",
		});
	});

	it("parses valid 2v2 params", () => {
		const params = new URLSearchParams("hp=p1,p2&ap=p3,p4&ht=Bayern&at=Dortmund");
		const result = parseRematchParams(params);

		expect(result).toEqual({
			homePlayers: ["p1", "p2"],
			awayPlayers: ["p3", "p4"],
			homeTeam: "Bayern",
			awayTeam: "Dortmund",
		});
	});

	it("returns null when hp is missing", () => {
		const params = new URLSearchParams("ap=p2&ht=Bayern&at=Dortmund");
		expect(parseRematchParams(params)).toBeNull();
	});

	it("returns null when ap is missing", () => {
		const params = new URLSearchParams("hp=p1&ht=Bayern&at=Dortmund");
		expect(parseRematchParams(params)).toBeNull();
	});

	it("returns null when ht is missing", () => {
		const params = new URLSearchParams("hp=p1&ap=p2&at=Dortmund");
		expect(parseRematchParams(params)).toBeNull();
	});

	it("returns null when at is missing", () => {
		const params = new URLSearchParams("hp=p1&ap=p2&ht=Bayern");
		expect(parseRematchParams(params)).toBeNull();
	});

	it("returns null for empty search params", () => {
		const params = new URLSearchParams("");
		expect(parseRematchParams(params)).toBeNull();
	});

	it("filters empty strings from player arrays", () => {
		const params = new URLSearchParams("hp=p1,,p2&ap=p3&ht=Bayern&at=Dortmund");
		const result = parseRematchParams(params);

		expect(result.homePlayers).toEqual(["p1", "p2"]);
	});
});
