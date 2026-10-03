/**
 * Route test for /app/leaderboard: a closed season's award values are
 * written in the UI locale, so a ratio is not "0,12" in English.
 */

import { render, screen } from "@testing-library/svelte";
import { readable } from "svelte/store";
import { describe, expect, it, vi } from "vitest";

vi.mock("@tolgee/svelte", () => ({
	getTranslate: () => ({ t: readable((key) => key) }),
}));
vi.mock("$lib/config/i18n.config.js", () => ({
	tolgee: { getLanguage: () => "en", on: vi.fn() },
}));
vi.mock("$app/navigation", () => ({ goto: vi.fn(), replaceState: vi.fn() }));
vi.mock("$lib/services/seasons.services.js", () => ({
	getLeagueSeasons: vi.fn().mockResolvedValue([]),
	getSeasonRating: vi.fn().mockResolvedValue({
		season: { id: "fc26", is_current: false },
		players: [],
		duos: [],
	}),
	getSeasonAwards: vi.fn().mockResolvedValue({
		awards: [
			{
				key: "fair_play",
				players: [{ player_id: "p1", username: "Anna", avatar_url: null }],
				value: 0.12,
				unit: "cards_per_game",
			},
		],
	}),
	getSeasonRecap: vi.fn().mockResolvedValue(null),
}));

import LeaderboardPage from "../../../../src/routes/app/leaderboard/+page.svelte";

describe("/app/leaderboard", () => {
	it("writes a closed season's award ratio in the UI locale", async () => {
		// Arrange + Act
		render(LeaderboardPage);

		// Assert
		expect(await screen.findByText("0.12")).toBeInTheDocument();
	});
});
