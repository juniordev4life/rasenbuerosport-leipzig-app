/**
 * Component test for TrophyDetailSheet — the sheet behind a tapped
 * trophy card. Covers the three states it explains (earned with date,
 * locked with progress, hidden) and both ways to close it.
 */

import { fireEvent, render, screen } from "@testing-library/svelte";
import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@tolgee/svelte", async () => {
	const { readable } = await import("svelte/store");
	return {
		getTranslate: () => ({
			t: readable((key) => key),
		}),
	};
});

import TrophyDetailSheet from "../../../../src/lib/components/trophies/TrophyDetailSheet.svelte";

beforeAll(() => {
	// Sheet's transitions run on the Web Animations API, which jsdom
	// lacks. Finish every animation at once.
	if (typeof Element.prototype.animate !== "function") {
		Element.prototype.animate = () => {
			const animation = { onfinish: null, cancel: vi.fn(), currentTime: 0 };
			queueMicrotask(() => animation.onfinish?.());
			return animation;
		};
	}
});

const earnedTrophy = {
	id: "W1",
	category: "win",
	name: "Erster Sieg",
	description: "Gewinne dein erstes Match",
	rarity: "bronze",
	unlocked: true,
	unlockedAt: "2025-03-12T18:00:00Z",
};

describe("TrophyDetailSheet", () => {
	it("titles the dialog with the trophy and shows rarity, category and date", () => {
		render(TrophyDetailSheet, {
			props: { trophy: earnedTrophy, onClose: vi.fn() },
		});

		expect(
			screen.getByRole("dialog", { name: "Erster Sieg" }),
		).toBeInTheDocument();
		expect(screen.getByText("trophies.rarity.bronze")).toBeInTheDocument();
		expect(screen.getByText("trophies.category.win")).toBeInTheDocument();
		expect(screen.getByText(/12\. März 2025/)).toBeInTheDocument();
	});

	it("shows the progress of a locked trophy", () => {
		render(TrophyDetailSheet, {
			props: {
				trophy: {
					...earnedTrophy,
					unlocked: false,
					unlockedAt: null,
					progress: { current: 110, target: 250, percent: 44 },
				},
				onClose: vi.fn(),
			},
		});

		expect(screen.getByText("trophies.detail.progress")).toBeInTheDocument();
		expect(screen.getByText(/110 \/ 250/)).toBeInTheDocument();
	});

	it("keeps a hidden trophy's name and category out of the sheet", () => {
		render(TrophyDetailSheet, {
			props: {
				trophy: {
					id: "HD1",
					category: "hidden",
					name: "Geheim",
					rarity: "silver",
					masked: true,
					unlocked: false,
				},
				onClose: vi.fn(),
			},
		});

		expect(
			screen.getByRole("dialog", { name: "trophies.masked.name" }),
		).toBeInTheDocument();
		expect(screen.queryByText("Geheim")).toBeNull();
		expect(screen.queryByText("trophies.category.hidden")).toBeNull();
		expect(screen.getByText("trophies.detail.locked_hint")).toBeInTheDocument();
	});

	it("closes from the close button and from the X", async () => {
		const onClose = vi.fn();
		render(TrophyDetailSheet, { props: { trophy: earnedTrophy, onClose } });

		await fireEvent.click(
			screen.getByRole("button", { name: "trophies.detail.close" }),
		);
		await fireEvent.click(screen.getByRole("button", { name: "common.close" }));

		expect(onClose).toHaveBeenCalledTimes(2);
	});
});
