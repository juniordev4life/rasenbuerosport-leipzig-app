/**
 * Component test for the match poster:
 *   - the manual team dialog names each team field by its visible
 *     "Home" / "Away" label, so screen readers do not announce two
 *     unnamed "Select team" fields;
 *   - an auto-roll that cannot reach the team catalogue shows the load
 *     error instead of ending in an unhandled rejection;
 *   - the line under the poster names the star range only for a rolled
 *     pair and flags a hand-picked pair whose stars differ.
 */

import { fireEvent, render, screen } from "@testing-library/svelte";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@tolgee/svelte", async () => {
	const { readable } = await import("svelte/store");
	return {
		getTranslate: () => ({
			t: readable((key, params) =>
				params ? `${key}(${Object.values(params).join("-")})` : key,
			),
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
import { getTeamByName } from "../../../../src/lib/services/teams.services.js";
import { rollRandomTeams } from "../../../../src/lib/utils/randomTeams.utils.js";

/** Star ratings of the catalogue the lookup mock answers from. */
const STARS = {
	"RB Leipzig": 4,
	"FC Bayern": 5,
	"Hertha BSC": 4,
	Arsenal: 4.5,
	Chelsea: 4.5,
};

/** Lets the lookup mock answer every name from STARS. */
function useCatalogue() {
	vi.mocked(getTeamByName).mockImplementation(async (name) =>
		name in STARS ? { name, star_rating: STARS[name] } : undefined,
	);
}

/**
 * Renders the poster; without teams it rolls a pair on mount.
 * @param {{ homeTeam?: string, awayTeam?: string }} [teams]
 */
function renderPoster({ homeTeam = "", awayTeam = "" } = {}) {
	render(MatchPosterStep, {
		homePlayers: ["jay"],
		awayPlayers: ["flo"],
		allPlayers: [],
		homeTeam,
		awayTeam,
		onAnpfiff: vi.fn(),
		onBack: vi.fn(),
	});
}

/** Renders the poster with both teams set and opens the manual dialog. */
async function openManualDialog() {
	renderPoster({ homeTeam: "RB Leipzig", awayTeam: "FC Bayern" });
	await fireEvent.click(
		screen.getByRole("button", { name: "new_game.poster.action_manual" }),
	);
}

afterEach(() => {
	vi.restoreAllMocks();
	vi.mocked(getTeamByName).mockResolvedValue(null);
});

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
	it("shows the load error when the team catalogue is unreachable", async () => {
		// Arrange
		vi.mocked(rollRandomTeams).mockRejectedValueOnce(new Error("offline"));
		vi.spyOn(console, "error").mockImplementation(() => {});

		// Act: no teams yet, so mounting rolls a pair
		renderPoster();

		// Assert
		expect(await screen.findByText("teams.error_loading")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "new_game.poster.action_roll" }),
		).toBeEnabled();
	});
});

describe("MatchPosterStep — pair info line", () => {
	it("names the star range and the balance of a rolled pair", async () => {
		// Arrange
		vi.mocked(rollRandomTeams).mockResolvedValueOnce({
			home: { name: "Arsenal", star_rating: 4.5 },
			away: { name: "Chelsea", star_rating: 4.5 },
		});

		// Act
		renderPoster();

		// Assert
		expect(
			await screen.findByText(
				"new_game.poster.generation_info(4-5) · new_game.poster.balanced",
			),
		).toBeInTheDocument();
	});

	it("flags a hand-picked pair whose stars differ", async () => {
		// Arrange
		useCatalogue();

		// Act
		renderPoster({ homeTeam: "RB Leipzig", awayTeam: "FC Bayern" });

		// Assert: no roll range — these teams were not rolled
		expect(
			await screen.findByText("new_game.poster.imbalanced"),
		).toBeInTheDocument();
	});

	it("calls a hand-picked pair with equal stars balanced", async () => {
		// Arrange
		useCatalogue();

		// Act
		renderPoster({ homeTeam: "RB Leipzig", awayTeam: "Hertha BSC" });

		// Assert
		expect(
			await screen.findByText("new_game.poster.balanced"),
		).toBeInTheDocument();
	});

	it("drops the roll range once the teams are typed in by hand", async () => {
		// Arrange: a rolled pair, then the manual dialog
		useCatalogue();
		vi.mocked(rollRandomTeams).mockResolvedValueOnce({
			home: { name: "Arsenal", star_rating: 4.5 },
			away: { name: "Chelsea", star_rating: 4.5 },
		});
		renderPoster();
		await screen.findByText(/generation_info/);
		await fireEvent.click(
			screen.getByRole("button", { name: "new_game.poster.action_manual" }),
		);

		// Act
		await fireEvent.input(
			screen.getByRole("textbox", { name: "new_game.home" }),
			{ target: { value: "RB Leipzig" } },
		);
		await fireEvent.input(
			screen.getByRole("textbox", { name: "new_game.away" }),
			{ target: { value: "FC Bayern" } },
		);
		await fireEvent.click(
			screen.getByRole("button", { name: "live_match.editor.confirm" }),
		);

		// Assert
		expect(
			await screen.findByText("new_game.poster.imbalanced"),
		).toBeInTheDocument();
		expect(screen.queryByText(/generation_info/)).not.toBeInTheDocument();
	});

	it("hides the line when the teams are not in the catalogue", async () => {
		// Arrange
		useCatalogue();

		// Act
		renderPoster({ homeTeam: "Bolzplatz FC", awayTeam: "Kreisliga 04" });

		// Assert: both lookups ran, but there is nothing to say
		await vi.waitFor(() =>
			expect(getTeamByName).toHaveBeenCalledWith("Kreisliga 04"),
		);
		expect(
			screen.queryByText(/generation_info|poster\.balanced|imbalanced/),
		).not.toBeInTheDocument();
	});
});
