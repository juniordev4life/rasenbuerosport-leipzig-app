/**
 * Component test for the season-recap auto-launcher. It must run its
 * one check per mount, skip immersive/recap routes, and stay silent on
 * any failure — the app must never be blocked or interrupted by it.
 */

import { render } from "@testing-library/svelte";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getLeagueSeasons, getSeasonRecap, goto, isRecapSeen, pageState } =
	vi.hoisted(() => ({
		getLeagueSeasons: vi.fn(),
		getSeasonRecap: vi.fn(),
		goto: vi.fn(),
		isRecapSeen: vi.fn(),
		pageState: { url: new URL("http://localhost/app/dashboard") },
	}));

vi.mock("$app/navigation", () => ({ goto }));
vi.mock("$app/state", () => ({ page: pageState }));
vi.mock("$lib/services/seasons.services.js", () => ({
	getLeagueSeasons,
	getSeasonRecap,
}));
// findClosedSeasonWithRecap is pure and already covered by its own unit
// tests — keep the real implementation here and only stub isRecapSeen.
vi.mock("$lib/utils/recapStory.utils.js", async (importOriginal) => {
	const actual = await importOriginal();
	return { ...actual, isRecapSeen };
});

import SeasonRecapLauncher from "$lib/components/recap/SeasonRecapLauncher.svelte";

const seasons = [
	{ id: "fc27", is_current: true, has_recap: false },
	{ id: "fc26", is_current: false, has_recap: true },
];

describe("SeasonRecapLauncher", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		pageState.url = new URL("http://localhost/app/dashboard");
		getLeagueSeasons.mockResolvedValue(seasons);
		isRecapSeen.mockReturnValue(false);
		getSeasonRecap.mockResolvedValue({
			generated_at: "2026-09-20T00:00:00.000Z",
		});
	});

	it("navigates to the most recent closed season's recap when unseen and available", async () => {
		render(SeasonRecapLauncher);

		await vi.waitFor(() => expect(goto).toHaveBeenCalledWith("/app/recap/fc26"));
	});

	it("does not navigate when this device has already seen it", async () => {
		isRecapSeen.mockReturnValue(true);

		render(SeasonRecapLauncher);

		await vi.waitFor(() => expect(getLeagueSeasons).toHaveBeenCalled());
		expect(goto).not.toHaveBeenCalled();
	});

	it("does not navigate when the player has no recap for that season", async () => {
		getSeasonRecap.mockResolvedValue(null);

		render(SeasonRecapLauncher);

		await vi.waitFor(() => expect(getSeasonRecap).toHaveBeenCalled());
		expect(goto).not.toHaveBeenCalled();
	});

	it("does not navigate when no season is closed with a recap", async () => {
		getLeagueSeasons.mockResolvedValue([
			{ id: "fc27", is_current: true, has_recap: false },
		]);

		render(SeasonRecapLauncher);

		await vi.waitFor(() => expect(getLeagueSeasons).toHaveBeenCalled());
		expect(goto).not.toHaveBeenCalled();
	});

	it("skips the check entirely on an immersive route", async () => {
		pageState.url = new URL("http://localhost/app/games/new");

		render(SeasonRecapLauncher);
		await new Promise((resolve) => setTimeout(resolve, 0));

		expect(getLeagueSeasons).not.toHaveBeenCalled();
	});

	it("skips the check entirely on a recap route", async () => {
		pageState.url = new URL("http://localhost/app/recap/fc26");

		render(SeasonRecapLauncher);
		await new Promise((resolve) => setTimeout(resolve, 0));

		expect(getLeagueSeasons).not.toHaveBeenCalled();
	});

	it("never throws when the season lookup fails", async () => {
		getLeagueSeasons.mockRejectedValue(new Error("network down"));
		const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

		expect(() => render(SeasonRecapLauncher)).not.toThrow();
		await vi.waitFor(() => expect(consoleError).toHaveBeenCalled());
		expect(goto).not.toHaveBeenCalled();

		consoleError.mockRestore();
	});
});
