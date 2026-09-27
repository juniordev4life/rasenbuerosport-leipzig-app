/**
 * Component test for the star-range sliders in RandomTeamPicker: each
 * slider is named by the text above it and announces its value in stars.
 */

import { render, screen } from "@testing-library/svelte";
import { beforeAll, describe, expect, it, vi } from "vitest";

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

beforeAll(() => {
	// The star sliders re-centre themselves via `scrollTo`, which jsdom lacks.
	if (typeof Element.prototype.scrollTo !== "function") {
		Element.prototype.scrollTo = vi.fn();
	}
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
