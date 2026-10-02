/**
 * Route test for /app/recap/[season]. A recap that has been on screen once
 * must count as seen, however the viewer leaves it, so the auto-launcher
 * does not reopen it on the next app start.
 */

import { render, screen } from "@testing-library/svelte";
import { readable } from "svelte/store";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getSeasonRecap } = vi.hoisted(() => ({ getSeasonRecap: vi.fn() }));

vi.mock("@tolgee/svelte", () => ({
	getTranslate: () => ({ t: readable((key) => key) }),
}));
vi.mock("$app/navigation", () => ({ goto: vi.fn() }));
vi.mock("$app/state", () => ({ page: { params: { season: "fc26" } } }));
vi.mock("$lib/services/seasons.services.js", () => ({ getSeasonRecap }));
// The story itself is covered by its own tests; only the route's
// load-and-mark behaviour matters here.
vi.mock("$lib/components/recap/SeasonRecapStory.svelte", () => ({
	default: vi.fn(),
}));

import { isRecapSeen } from "$lib/utils/recapStory.utils.js";
import RecapPage from "../../../../src/routes/app/recap/[season]/+page.svelte";

describe("/app/recap/[season]", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		window.localStorage.clear();
	});

	it("marks the recap as seen as soon as it is shown, without waiting for ✕", async () => {
		getSeasonRecap.mockResolvedValue({ player: { username: "Marco" } });

		render(RecapPage);

		await vi.waitFor(() => expect(isRecapSeen("fc26")).toBe(true));
		expect(getSeasonRecap).toHaveBeenCalledWith("fc26");
	});

	it("leaves it unseen when the recap could not be loaded", async () => {
		getSeasonRecap.mockRejectedValue(new Error("offline"));

		render(RecapPage);

		expect(await screen.findByText("season_recap.error")).toBeInTheDocument();
		expect(isRecapSeen("fc26")).toBe(false);
	});

	it("leaves it unseen when there is no recap for this player", async () => {
		getSeasonRecap.mockResolvedValue(null);

		render(RecapPage);

		expect(await screen.findByText("season_recap.empty")).toBeInTheDocument();
		expect(isRecapSeen("fc26")).toBe(false);
	});
});
