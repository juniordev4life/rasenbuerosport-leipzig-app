/**
 * Component test for the match poster:
 *   - the manual team dialog names each team field by its visible
 *     "Home" / "Away" label, so screen readers do not announce two
 *     unnamed "Select team" fields;
 *   - an auto-roll that cannot reach the team catalogue shows the load
 *     error instead of ending in an unhandled rejection.
 */

import { fireEvent, render, screen } from "@testing-library/svelte";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@tolgee/svelte", async () => {
	const { readable } = await import("svelte/store");
	return {
		getTranslate: () => ({
			t: readable((key) => key),
		}),
	};
});

vi.mock("$lib/services/teams.services.js", () => ({
	getAllTeams: vi.fn().mockResolvedValue([]),
	getTeamByName: vi.fn().mockResolvedValue(null),
	searchTeams: vi.fn().mockResolvedValue([]),
}));

vi.mock("$lib/utils/randomTeams.utils.js", () => ({
	rollRandomTeams: vi.fn().mockResolvedValue(null),
}));

import MatchPosterStep from "../../../../src/lib/components/games/MatchPosterStep.svelte";
import { rollRandomTeams } from "../../../../src/lib/utils/randomTeams.utils.js";

/** Renders the poster with both teams set and opens the manual dialog. */
async function openManualDialog() {
	render(MatchPosterStep, {
		homePlayers: ["jay"],
		awayPlayers: ["flo"],
		allPlayers: [],
		homeTeam: "RB Leipzig",
		awayTeam: "FC Bayern",
		onAnpfiff: vi.fn(),
		onBack: vi.fn(),
	});
	await fireEvent.click(
		screen.getByRole("button", { name: "new_game.poster.action_manual" }),
	);
}

describe("MatchPosterStep — manual team dialog", () => {
	it.each([
		["new_game.home", "RB Leipzig"],
		["new_game.away", "FC Bayern"],
	])("names the %s field by its label", async (label, team) => {
		// Arrange + Act
		await openManualDialog();

		// Assert
		expect(screen.getByRole("textbox", { name: label })).toHaveValue(team);
	});
});

describe("MatchPosterStep — auto-roll", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("shows the load error when the team catalogue is unreachable", async () => {
		// Arrange
		vi.mocked(rollRandomTeams).mockRejectedValueOnce(new Error("offline"));
		vi.spyOn(console, "error").mockImplementation(() => {});

		// Act: no teams yet, so mounting rolls a pair
		render(MatchPosterStep, {
			homePlayers: ["jay"],
			awayPlayers: ["flo"],
			allPlayers: [],
			homeTeam: "",
			awayTeam: "",
			onAnpfiff: vi.fn(),
			onBack: vi.fn(),
		});

		// Assert
		expect(await screen.findByText("teams.error_loading")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "new_game.poster.action_roll" }),
		).toBeEnabled();
	});
});
