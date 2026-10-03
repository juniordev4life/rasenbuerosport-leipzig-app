/**
 * Component test for AwardsSection — the profile's "Top-Auszeichnungen".
 * Each award names its rarity in text, fresh unlocks get the "Neu" chip,
 * and the way into the trophy room stays available even before the
 * first trophy.
 */

import { fireEvent, render, screen } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";

vi.mock("@tolgee/svelte", async () => {
	const { readable } = await import("svelte/store");
	return {
		getTranslate: () => ({
			t: readable((key) => key),
		}),
	};
});

import AwardsSection from "../../../../src/lib/components/profile/AwardsSection.svelte";

const DAY_MS = 24 * 60 * 60 * 1000;

const awards = [
	{
		id: "G1",
		name: "Spätes Drama",
		description: "Siegtreffer in der 90. Minute",
		type: "diamond",
		category: "special",
		unlockedAt: new Date(Date.now() - 2 * DAY_MS).toISOString(),
	},
	{
		id: "S1",
		name: "Kontrolliert",
		description: "Sieg mit 5+ Toren Differenz",
		type: "silver",
		category: "win",
		unlockedAt: new Date(Date.now() - 40 * DAY_MS).toISOString(),
	},
];

describe("AwardsSection", () => {
	it("lists each award with its rarity in text and marks fresh ones", () => {
		render(AwardsSection, { props: { awards, totalCount: 18 } });

		expect(screen.getByText("Spätes Drama")).toBeInTheDocument();
		expect(screen.getByText("trophies.rarity.diamond")).toBeInTheDocument();
		expect(screen.getByText("trophies.rarity.silver")).toBeInTheDocument();
		expect(screen.getAllByText("profile.awards_new")).toHaveLength(1);
		expect(
			screen.getByText("profile.awards_unlocked_count"),
		).toBeInTheDocument();
	});

	it("offers the trophy room even without any award yet", async () => {
		const onViewAll = vi.fn();
		render(AwardsSection, {
			props: { awards: [], totalCount: 0, onViewAll },
		});

		expect(screen.getByText("profile.awards_empty")).toBeInTheDocument();
		expect(screen.queryByText("profile.awards_unlocked_count")).toBeNull();

		await fireEvent.click(
			screen.getByRole("button", { name: "profile.awards_view_all" }),
		);
		expect(onViewAll).toHaveBeenCalledOnce();
	});
});
