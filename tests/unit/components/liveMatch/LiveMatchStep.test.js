/**
 * Component test for the onboarding demo bridge in LiveMatchStep. The
 * live-match tour drives the step through `window.__rblLiveDemo`, so
 * these tests replay the tour's action sequence and check that the
 * goal editor stays open until `confirm` and that a demo event lands
 * in the pill strip, including in 1v1 games, which have no teammate
 * to pick for the assist.
 */

import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@tolgee/svelte", async () => {
	const { readable } = await import("svelte/store");
	return {
		getTranslate: () => ({
			t: readable((key) => key),
		}),
	};
});

vi.mock("../../../../src/lib/services/teams.services.js", () => ({
	getTeamByName: vi.fn().mockResolvedValue(null),
}));

import LiveMatchStep from "../../../../src/lib/components/liveMatch/LiveMatchStep.svelte";

const ALL_PLAYERS = [
	{ id: "anna", username: "Anna" },
	{ id: "ben", username: "Ben" },
	{ id: "carl", username: "Carl" },
	{ id: "dana", username: "Dana" },
];

/** Tour actions in the order `TOUR_DEFINITIONS[NEW_GAME_LIVE]` fires them. */
const TOUR_ACTIONS = [
	"select-scorer",
	"select-assister",
	"set-minute",
	"set-stoppage",
	"confirm",
];

function renderStep({ homePlayers, awayPlayers }) {
	return render(LiveMatchStep, {
		homePlayers,
		awayPlayers,
		allPlayers: ALL_PLAYERS,
		homeTeam: "",
		awayTeam: "",
		onEndMatch: vi.fn(),
		onBack: vi.fn(),
	});
}

async function runDemo(action) {
	window.__rblLiveDemo(action);
	await tick();
}

function queryMinuteField() {
	return screen.queryByLabelText("live_match.editor.minute_label");
}

describe("LiveMatchStep onboarding demo", () => {
	afterEach(() => {
		delete window.__rblLiveDemo;
	});

	it("keeps the goal editor open through the assist step in a 1v1 game", async () => {
		// Arrange
		renderStep({ homePlayers: ["anna"], awayPlayers: ["ben"] });
		await tick();
		await runDemo("select-scorer");

		// Act
		await runDemo("select-assister");

		// Assert
		expect(queryMinuteField()).toBeInTheDocument();
		expect(screen.getByText("live_match.role.scorer")).toBeInTheDocument();
		expect(
			screen.queryByText("live_match.role.assister"),
		).not.toBeInTheDocument();
	});

	it("creates the demo event in a 1v1 game", async () => {
		// Arrange
		renderStep({ homePlayers: ["anna"], awayPlayers: ["ben"] });
		await tick();

		// Act
		for (const action of TOUR_ACTIONS) await runDemo(action);

		// Assert
		expect(queryMinuteField()).not.toBeInTheDocument();
		expect(screen.getByText("1:0")).toBeInTheDocument();
		expect(screen.getByText("45+3'")).toBeInTheDocument();
	});

	it("marks the teammate as assister in a 2v2 game", async () => {
		// Arrange
		renderStep({ homePlayers: ["anna", "carl"], awayPlayers: ["ben", "dana"] });
		await tick();
		await runDemo("select-scorer");

		// Act
		await runDemo("select-assister");

		// Assert
		expect(queryMinuteField()).toBeInTheDocument();
		expect(screen.getByText("live_match.role.assister")).toBeInTheDocument();
	});
});
