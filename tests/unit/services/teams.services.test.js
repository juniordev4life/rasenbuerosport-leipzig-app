/**
 * Service test for the team lookup the match screens use to decorate a
 * team name with its crest. Fired from effects without a `catch`, a
 * rejection would be unhandled, so the lookup must resolve `undefined`
 * when the catalogue cannot be loaded, and try again on the next call.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { get } = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock("$lib/services/api.services.js", () => ({ get }));

import {
	getAllTeams,
	getTeamByName,
	invalidateTeamsCache,
} from "../../../src/lib/services/teams.services.js";

const LEIPZIG = { id: "1", name: "RB Leipzig", logo_url: "leipzig.png" };

describe("getTeamByName", () => {
	beforeEach(() => {
		invalidateTeamsCache();
		get.mockReset();
		vi.spyOn(console, "warn").mockImplementation(() => {});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("resolves the catalogue entry for a known name", async () => {
		// Arrange
		get.mockResolvedValue({ data: [LEIPZIG] });

		// Act
		const team = await getTeamByName("RB Leipzig");

		// Assert
		expect(team).toEqual(LEIPZIG);
	});

	it("resolves undefined instead of rejecting when the catalogue fails", async () => {
		// Arrange
		get.mockRejectedValue(new Error("offline"));

		// Act
		const team = await getTeamByName("RB Leipzig");

		// Assert
		expect(team).toBeUndefined();
		expect(console.warn).toHaveBeenCalledOnce();
	});

	it("fetches the catalogue again on the next lookup after a failure", async () => {
		// Arrange
		get
			.mockRejectedValueOnce(new Error("offline"))
			.mockResolvedValueOnce({ data: [LEIPZIG] });
		await getTeamByName("RB Leipzig");

		// Act
		const team = await getTeamByName("RB Leipzig");

		// Assert
		expect(team).toEqual(LEIPZIG);
		expect(get).toHaveBeenCalledTimes(2);
	});

	it("leaves getAllTeams rejecting, so pages can show their error state", async () => {
		// Arrange
		get.mockRejectedValue(new Error("offline"));

		// Act + Assert
		await expect(getAllTeams()).rejects.toThrow("offline");
	});
});
