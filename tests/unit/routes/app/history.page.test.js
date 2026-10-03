/**
 * Route test for /app/history: the date buckets and each match card's
 * time follow the UI language instead of always being German.
 */

import { render, screen } from "@testing-library/svelte";
import { readable } from "svelte/store";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { get } = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock("@tolgee/svelte", () => ({
	getTranslate: () => ({ t: readable((key) => key) }),
}));
vi.mock("$lib/config/i18n.config.js", () => ({
	tolgee: { getLanguage: () => "en", on: vi.fn() },
}));
vi.mock("$app/navigation", () => ({ replaceState: vi.fn() }));
vi.mock("$lib/services/api.services.js", () => ({ get }));

import HistoryPage from "../../../../src/routes/app/history/+page.svelte";

describe("/app/history", () => {
	beforeEach(() => {
		// Only Date is faked: Wednesday, 7 October 2026, 18:00 local time.
		vi.useFakeTimers({ toFake: ["Date"] });
		vi.setSystemTime(new Date(2026, 9, 7, 18, 0));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("labels the date bucket and the match time in English", async () => {
		// Arrange
		get.mockResolvedValue({
			data: [
				{
					id: "g1",
					played_at: new Date(2026, 9, 7, 14, 32).toISOString(),
					score_home: 2,
					score_away: 1,
					game_players: [],
				},
			],
		});

		// Act
		render(HistoryPage);

		// Assert
		expect(await screen.findByText("today")).toBeInTheDocument();
		expect(screen.getByText("today, 14:32")).toBeInTheDocument();
	});
});
