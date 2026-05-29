/**
 * Component test for TrophyCard — covers the three render modes the
 * card has to express (earned / locked-with-progress / masked) and
 * the tap-to-open callback. Together with the smoke test for
 * TrophyHero this also exercises the `$t(...)` script-block + template
 * pattern in a `$derived` context, which is where the original
 * regression hid.
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

import TrophyCard from "../../../../src/lib/components/trophies/TrophyCard.svelte";

const earnedTrophy = {
	id: "W1",
	category: "win",
	name: "Erster Sieg",
	description: "Gewinne dein erstes Match",
	rarity: "bronze",
	hidden: false,
	scope: "player",
	unlocked: true,
	unlockedAt: "2025-03-12T18:00:00Z",
	triggeredByMatchId: "game-1",
};

const lockedThresholdTrophy = {
	id: "W4",
	category: "win",
	name: "Veteran",
	description: "Sammle 250 Siege",
	rarity: "gold",
	hidden: false,
	scope: "player",
	unlocked: false,
	progress: { current: 110, target: 250, percent: 44 },
};

const maskedTrophy = {
	id: "HD1",
	category: "hidden",
	rarity: "silver",
	hidden: true,
	masked: true,
	unlocked: false,
};

describe("TrophyCard — earned", () => {
	it("shows name, description, rarity pill and unlock date", () => {
		render(TrophyCard, { props: { trophy: earnedTrophy } });

		expect(screen.getByText("Erster Sieg")).toBeInTheDocument();
		expect(screen.getByText("Gewinne dein erstes Match")).toBeInTheDocument();
		expect(screen.getByText("trophies.rarity.bronze")).toBeInTheDocument();
		// Date formatted in the default `de-DE` locale, dd.mm.yyyy.
		expect(screen.getByText("12.03.2025")).toBeInTheDocument();
	});

	it("calls onSelect with the trophy when clicked", async () => {
		const onSelect = vi.fn();
		render(TrophyCard, { props: { trophy: earnedTrophy, onSelect } });

		await fireEvent.click(screen.getByRole("button"));
		expect(onSelect).toHaveBeenCalledExactlyOnceWith(earnedTrophy);
	});
});

describe("TrophyCard — locked with progress", () => {
	it("shows the progress numbers and the threshold target", () => {
		render(TrophyCard, { props: { trophy: lockedThresholdTrophy } });

		expect(screen.getByText("Veteran")).toBeInTheDocument();
		expect(screen.getByText("110 / 250")).toBeInTheDocument();
		// Locked → no unlock date string in the DOM.
		expect(screen.queryByText(/\d{2}\.\d{2}\.\d{4}/)).toBeNull();
	});
});

describe("TrophyCard — masked", () => {
	it("hides the name + description, renders the placeholder", () => {
		render(TrophyCard, { props: { trophy: maskedTrophy } });

		expect(screen.getByText("trophies.masked.name")).toBeInTheDocument();
		expect(
			screen.getByText("trophies.masked.description"),
		).toBeInTheDocument();
		// The real name must NOT leak into the DOM.
		expect(screen.queryByText("Erster Sieg")).toBeNull();
	});
});
