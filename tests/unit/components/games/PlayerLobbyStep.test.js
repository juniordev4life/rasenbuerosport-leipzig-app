/**
 * Component test for the lobby's tile order: the regulars (most games
 * played) come first so they fill the tiles visible without scrolling,
 * and the rarely used guest tile ends each half.
 */

import { render, screen, within } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";

vi.mock("@tolgee/svelte", async () => {
	const { readable } = await import("svelte/store");
	return {
		getTranslate: () => ({
			t: readable((key) => key),
		}),
	};
});

import PlayerLobbyStep from "../../../../src/lib/components/games/PlayerLobbyStep.svelte";

const players = [
	{ id: "ah", username: "AH", avatar_url: null, games_played: 2 },
	{ id: "jay", username: "Jay", avatar_url: null, games_played: 96 },
	{ id: "flo", username: "FlorAIn", avatar_url: null, games_played: 69 },
];

/** Tile labels of one pitch half, in DOM (= grid flow) order. */
function tileLabels(half) {
	const strip = document.querySelector(`[data-onboarding="lobby-${half}"]`);
	return within(strip)
		.getAllByRole("button")
		.map((button) => button.getAttribute("aria-label"));
}

describe("PlayerLobbyStep — tile order", () => {
	it.each(["home", "away"])(
		"orders the %s half by games played and ends it with the guest",
		(half) => {
			// Arrange + Act
			render(PlayerLobbyStep, {
				allPlayers: players,
				onNext: vi.fn(),
				onCancel: vi.fn(),
			});

			// Assert
			expect(tileLabels(half)).toEqual([
				"Jay",
				"FlorAIn",
				"AH",
				"new_game.guest",
			]);
		},
	);

	it("keeps the onboarding anchor on the home guest tile", () => {
		// Arrange + Act
		render(PlayerLobbyStep, {
			allPlayers: players,
			onNext: vi.fn(),
			onCancel: vi.fn(),
		});

		// Assert
		const anchor = document.querySelector('[data-onboarding="lobby-guest"]');
		expect(anchor).toHaveAttribute("aria-label", "new_game.guest");
		expect(
			screen.getAllByRole("button", { name: "new_game.guest" }),
		).toHaveLength(2);
	});
});
