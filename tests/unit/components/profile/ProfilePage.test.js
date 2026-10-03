/**
 * Component test for ProfilePage: the player-character section gets the
 * UI language, so its strength and weakness tags are not always German.
 */

import { render } from "@testing-library/svelte";
import { readable } from "svelte/store";
import { describe, expect, it, vi } from "vitest";

const { ProfileSpiderSection } = vi.hoisted(() => ({
	ProfileSpiderSection: vi.fn(),
}));

vi.mock("@tolgee/svelte", () => ({
	getTranslate: () => ({ t: readable((key) => key) }),
}));
vi.mock("$lib/config/i18n.config.js", () => ({
	tolgee: { getLanguage: () => "en", on: vi.fn() },
}));
vi.mock("$app/navigation", () => ({ goto: vi.fn() }));
vi.mock("$lib/services/api.services.js", () => ({
	get: vi.fn().mockResolvedValue({ data: [] }),
}));
vi.mock("$lib/services/playerProfile.services.js", () => ({
	getPlayerProfile: vi.fn().mockResolvedValue({
		player: { id: "p1", name: "Anna" },
		axes: {
			finisher: 92,
			playmaker: 50,
			clutch: 50,
			consistency: 50,
			discipline: 50,
			winner: 8,
		},
	}),
	getPlayerCareerStats: vi.fn().mockResolvedValue(null),
}));
vi.mock("$lib/services/trophies.services.js", () => ({
	getPlayerTrophies: vi.fn().mockResolvedValue(null),
}));
// The section renders its tags from these props; only the props matter here.
vi.mock("$lib/components/profile/ProfileSpiderSection.svelte", () => ({
	default: ProfileSpiderSection,
}));

import ProfilePage from "$lib/components/profile/ProfilePage.svelte";

describe("ProfilePage", () => {
	it("hands the UI language to the player-character section", async () => {
		// Arrange + Act
		render(ProfilePage, { playerId: "p1" });

		// Assert
		await vi.waitFor(() => expect(ProfileSpiderSection).toHaveBeenCalled());
		const [, props] = ProfileSpiderSection.mock.calls[0];
		expect(props.locale).toBe("en");
	});
});
