/**
 * Component smoke test for TrophyHero.
 *
 * Catches the class of bugs where a new component calls `t("...")`
 * instead of `$t("...")` on the Tolgee store — the very regression
 * this whole trophy room shipped with on the first deploy. Vitest +
 * Testing Library + jsdom rerun the component the same way the
 * browser would, so calling a store as a function throws and the
 * test fails.
 *
 * The Tolgee mock replaces `getTranslate` with a Svelte readable
 * store whose subscribed value is the identity-translator
 * `(key) => key`. That gives every `$t("trophies.hero.tag")` call
 * the literal key back, so we can assert on key strings instead of
 * baking translations into the test (and the test stays language-
 * agnostic).
 */

import { render, screen } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";

vi.mock("@tolgee/svelte", async () => {
	const { readable } = await import("svelte/store");
	return {
		getTranslate: () => ({
			t: readable((key) => key),
		}),
	};
});

import TrophyHero from "../../../../src/lib/components/trophies/TrophyHero.svelte";

describe("TrophyHero", () => {
	it("renders without throwing the 'store is not a function' regression", () => {
		const summary = {
			total: 64,
			unlocked: 31,
			byRarity: { bronze: 10, silver: 16, gold: 4, diamond: 1 },
		};

		render(TrophyHero, { props: { summary } });

		// If the component still called `t(...)` instead of `$t(...)`, the
		// render would have thrown before reaching the DOM. Assert a couple
		// of slots to prove the template actually rendered.
		expect(screen.getByText("trophies.hero.tag")).toBeInTheDocument();
		expect(screen.getByText("trophies.hero.title")).toBeInTheDocument();
	});

	it("shows the unlocked count and per-rarity numbers", () => {
		const summary = {
			total: 64,
			unlocked: 31,
			byRarity: { bronze: 10, silver: 16, gold: 4, diamond: 1 },
		};

		render(TrophyHero, { props: { summary } });

		expect(screen.getByText("31")).toBeInTheDocument();
		expect(screen.getByText("10")).toBeInTheDocument();
		expect(screen.getByText("16")).toBeInTheDocument();
		expect(screen.getByText("4")).toBeInTheDocument();
		expect(screen.getByText("1")).toBeInTheDocument();
	});

	it("survives a missing byRarity map without throwing", () => {
		render(TrophyHero, {
			props: { summary: { total: 64, unlocked: 0 } },
		});

		expect(screen.getByText("trophies.hero.title")).toBeInTheDocument();
		// All four rarity counters fall back to 0.
		expect(screen.getAllByText("0").length).toBeGreaterThanOrEqual(4);
	});
});
