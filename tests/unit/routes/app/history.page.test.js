/**
 * Route test for /app/history. The API filters by player only, so the
 * page filters the pages it has loaded; the match count and the empty
 * state may only claim what those pages prove, and "Nur Siege" asks the
 * API for the player's own games. Date buckets and match times follow the
 * UI language.
 */

import { render, screen } from "@testing-library/svelte";
import { readable } from "svelte/store";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { get, uiLanguage } = vi.hoisted(() => ({
	get: vi.fn(),
	uiLanguage: { value: "de" },
}));

vi.mock("@tolgee/svelte", () => ({
	getTranslate: () => ({
		t: readable((key, params) =>
			params ? `${key}(${Object.values(params).join("-")})` : key,
		),
	}),
}));
vi.mock("$lib/config/i18n.config.js", () => ({
	tolgee: { getLanguage: () => uiLanguage.value, on: vi.fn() },
}));
vi.mock("$app/navigation", () => ({ replaceState: vi.fn() }));
vi.mock("$lib/services/api.services.js", () => ({ get }));
vi.mock("$lib/stores/auth.stores.js", () => ({
	user: readable({ uid: "me" }),
}));

import HistoryPage from "../../../../src/routes/app/history/+page.svelte";

// Wednesday 7 Oct 2026; "Diese Woche" starts on Monday 5 Oct.
const NOW = new Date(2026, 9, 7, 15, 30);

/**
 * `count` games, one an hour back from `start`.
 * @param {number} count
 * @param {Date} start
 * @param {{ score_home?: number, score_away?: number }} [score]
 */
function games(count, start, score = { score_home: 2, score_away: 1 }) {
	return Array.from({ length: count }, (_, i) => ({
		id: `${start.getDate()}-${i}`,
		mode: "1v1",
		played_at: new Date(start.getTime() - i * 3_600_000).toISOString(),
		...score,
		game_players: [
			{ player_id: "me", team: "home", profiles: { username: "Me" } },
			{ player_id: "flo", team: "away", profiles: { username: "Flo" } },
		],
	}));
}

/** Opens the page with these filter params in the URL. */
function renderHistory(search = "") {
	window.history.replaceState({}, "", `/app/history${search}`);
	render(HistoryPage);
}

describe("/app/history", () => {
	beforeEach(() => {
		vi.useFakeTimers({ toFake: ["Date"] });
		vi.setSystemTime(NOW);
		get.mockReset();
		uiLanguage.value = "de";
	});

	afterEach(() => {
		vi.useRealTimers();
		window.history.replaceState({}, "", "/");
	});

	it("counts a minimum while this week's matches fill the first page", async () => {
		// Arrange: 20 games, all from this week — the next page may hold more
		get.mockResolvedValue({ data: games(20, new Date(2026, 9, 7, 14)) });

		// Act
		renderHistory();

		// Assert: today's 15 games are complete, yesterday's 5 may go on
		expect(
			await screen.findByText("20+ historie.matches", { selector: ".count" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("heading", { name: /^gestern 5\+ historie\.matches$/ }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("heading", { name: /^heute 15 historie\.matches$/ }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "historie.load_more" }),
		).toBeInTheDocument();
	});

	it("gives the exact count and no load button once the week is complete", async () => {
		// Arrange: 3 games this week, then older ones on the same page
		get.mockResolvedValue({
			data: [
				...games(3, new Date(2026, 9, 6, 12)),
				...games(17, new Date(2026, 9, 2, 12)),
			],
		});

		// Act
		renderHistory();

		// Assert
		expect(
			await screen.findByText("3 historie.matches", { selector: ".count" }),
		).toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: "historie.load_more" }),
		).not.toBeInTheDocument();
	});

	it("asks the API for the player's own games for Nur Siege under Alle Spiele", async () => {
		// Arrange
		get.mockResolvedValue({ data: [] });

		// Act
		renderHistory("?erg=wins");

		// Assert
		await vi.waitFor(() => expect(get).toHaveBeenCalled());
		expect(get.mock.calls[0][0]).toContain("mine=true");
	});

	it("only says the loaded matches do not fit while older pages could", async () => {
		// Arrange: all time, Zu Null, and none of the 20 newest games fits
		get.mockResolvedValue({ data: games(20, new Date(2026, 9, 7, 14)) });

		// Act
		renderHistory("?zeit=all&erg=zunull");

		// Assert
		expect(
			await screen.findByText("historie.empty.partial(20)"),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "historie.load_more" }),
		).toBeInTheDocument();
	});

	it("shows the load error instead of an empty list when loading fails", async () => {
		// Arrange
		vi.spyOn(console, "error").mockImplementation(() => {});
		get.mockRejectedValue(new Error("offline"));

		// Act
		renderHistory();

		// Assert
		expect(await screen.findByRole("alert")).toHaveTextContent(
			"historie.load_error",
		);
		expect(screen.queryByText(/historie\.empty/)).not.toBeInTheDocument();
		expect(
			screen.getByText("– historie.matches", { selector: ".count" }),
		).toBeInTheDocument();
	});

	it("labels the date bucket and the match time in English", async () => {
		// Arrange
		uiLanguage.value = "en";
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
		renderHistory();

		// Assert
		expect(await screen.findByText("today")).toBeInTheDocument();
		expect(screen.getByText("today, 14:32")).toBeInTheDocument();
	});
});
