/**
 * Component test for RandomTeamPicker:
 *   - each star-range slider is named by the text above it and
 *     announces its value in stars;
 *   - a search that cannot reach the team catalogue shows the load
 *     error instead of ending in an unhandled rejection.
 */

import { fireEvent, render, screen } from "@testing-library/svelte";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@tolgee/svelte", async () => {
	const { readable } = await import("svelte/store");
	return {
		getTranslate: () => ({
			t: readable((key, params) => (params ? `${key}:${params.stars}` : key)),
		}),
	};
});

vi.mock("$lib/services/teams.services.js", () => ({ getAllTeams: vi.fn() }));

import RandomTeamPicker from "../../../../src/lib/components/games/RandomTeamPicker.svelte";
import { getAllTeams } from "../../../../src/lib/services/teams.services.js";

beforeAll(() => {
	// The star sliders re-centre themselves via `scrollTo`, which jsdom lacks.
	if (typeof Element.prototype.scrollTo !== "function") {
		Element.prototype.scrollTo = vi.fn();
	}
});

describe("RandomTeamPicker — reroll buttons", () => {
	it("names each team's reroll button by its side", async () => {
		// Arrange
		vi.mocked(getAllTeams).mockResolvedValue([
			{ name: "Home FC", star_rating: 4.5, overall_rating: 80, logo_url: null },
			{ name: "Away FC", star_rating: 4.5, overall_rating: 79, logo_url: null },
		]);
		render(RandomTeamPicker, { onClose: vi.fn(), onConfirm: vi.fn() });

		// Act
		screen.getByRole("button", { name: "new_game.random_search" }).click();

		// Assert
		expect(
			await screen.findByRole("button", { name: "new_game.random_reroll_home" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "new_game.random_reroll_away" }),
		).toBeInTheDocument();
	});
});

describe("RandomTeamPicker — star-range sliders", () => {
	it.each([
		["new_game.random_min_stars", 4],
		["new_game.random_max_stars", 5],
	])("names the %s slider and announces %s stars", (name, stars) => {
		// Arrange + Act
		render(RandomTeamPicker, { onClose: vi.fn(), onConfirm: vi.fn() });

		// Assert
		expect(screen.getByRole("slider", { name })).toHaveAttribute(
			"aria-valuetext",
			`new_game.random_stars_value:${stars}`,
		);
	});
});

describe("RandomTeamPicker — search", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("shows the load error when the team catalogue is unreachable", async () => {
		// Arrange
		vi.mocked(getAllTeams).mockRejectedValueOnce(new Error("offline"));
		vi.spyOn(console, "error").mockImplementation(() => {});
		render(RandomTeamPicker, { onClose: vi.fn(), onConfirm: vi.fn() });

		// Act
		await fireEvent.click(
			screen.getByRole("button", { name: "new_game.random_search" }),
		);

		// Assert
		expect(await screen.findByText("teams.error_loading")).toBeInTheDocument();
	});

	it("confirms with the range the pair was rolled in, not the sliders' latest", async () => {
		// Arrange: a 4–5★ search, then the min slider moved down to 3★
		vi.mocked(getAllTeams).mockResolvedValue([
			{ name: "Arsenal", star_rating: 4.5, overall_rating: 80 },
			{ name: "Chelsea", star_rating: 4.5, overall_rating: 79 },
		]);
		const onConfirm = vi.fn();
		render(RandomTeamPicker, { onClose: vi.fn(), onConfirm });
		await fireEvent.click(
			screen.getByRole("button", { name: "new_game.random_search" }),
		);
		const minSlider = screen.getByRole("slider", {
			name: "new_game.random_min_stars",
		});
		await fireEvent.keyDown(minSlider, { key: "ArrowLeft" });
		await fireEvent.keyDown(minSlider, { key: "ArrowLeft" });
		expect(minSlider).toHaveAttribute("aria-valuenow", "3");

		// Act
		await fireEvent.click(
			await screen.findByRole("button", { name: "new_game.random_confirm" }),
		);

		// Assert
		expect(onConfirm).toHaveBeenCalledWith(
			expect.any(String),
			expect.any(String),
			{ minStars: 4, maxStars: 5 },
		);
	});
});
