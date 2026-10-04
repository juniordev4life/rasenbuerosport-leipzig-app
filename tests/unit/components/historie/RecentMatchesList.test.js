/**
 * Component test for RecentMatchesList — the recent-match rows the
 * dashboard and the duo page share: one link per match, the result
 * marker, the opponent line with the optional mode, the signed ELO
 * change and the empty state.
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

import RecentMatchesList from "../../../../src/lib/components/historie/RecentMatchesList.svelte";

const win = {
	id: "game-1",
	opponent: "Alex & Ben",
	dateLabel: "03. Okt.",
	mode: "2v2",
	result: "win",
	score: "3:1",
	eloDelta: 12.4,
};

describe("RecentMatchesList — rows", () => {
	it("links each match to its detail page", () => {
		const matches = [win, { ...win, id: "game-2" }];

		render(RecentMatchesList, { props: { matches } });

		const hrefs = screen
			.getAllByRole("link")
			.map((link) => link.getAttribute("href"));
		expect(hrefs).toEqual(["/app/games/game-1", "/app/games/game-2"]);
	});

	it("shows the result letter, the opponent, the date and the mode", () => {
		render(RecentMatchesList, { props: { matches: [win] } });

		const link = screen.getByRole("link");
		expect(link).toHaveTextContent("historie.w_short");
		expect(link).toHaveTextContent("common.vs Alex & Ben");
		expect(link).toHaveTextContent("03. Okt. · 2v2");
	});

	it("leaves the mode out when a row has none", () => {
		render(RecentMatchesList, {
			props: { matches: [{ ...win, mode: undefined }] },
		});

		expect(screen.getByText("03. Okt.")).toBeInTheDocument();
	});

	it("shows a neutral marker when the viewer was not in the match", () => {
		const { container } = render(RecentMatchesList, {
			props: { matches: [{ ...win, result: null }] },
		});

		const marker = container.querySelector(".marker");
		expect(marker).toHaveTextContent("–");
		expect(marker).toHaveClass("result-d");
	});
});

describe("RecentMatchesList — ELO change", () => {
	it.each([
		[12.4, "+12", "delta-win"],
		[-7.6, "−8", "delta-loss"],
		[0.3, "±0", "delta-draw"],
	])("shows %s as %s", (eloDelta, text, toneClass) => {
		const { container } = render(RecentMatchesList, {
			props: { matches: [{ ...win, eloDelta }] },
		});

		const delta = container.querySelector(".delta");
		expect(delta).toHaveTextContent(`${text} ELO`);
		expect(delta).toHaveClass(toneClass);
	});

	it("hides the change when there is none", () => {
		const { container } = render(RecentMatchesList, {
			props: { matches: [{ ...win, eloDelta: null }] },
		});

		expect(container.querySelector(".delta")).toBeNull();
	});
});

describe("RecentMatchesList — empty", () => {
	it("shows the empty text when there are no matches", () => {
		render(RecentMatchesList, {
			props: { matches: [], emptyText: "Noch keine Spiele" },
		});

		expect(screen.getByText("Noch keine Spiele")).toBeInTheDocument();
		expect(screen.queryByRole("list")).toBeNull();
	});

	it("renders nothing without matches or empty text", () => {
		const { container } = render(RecentMatchesList, {
			props: { matches: [] },
		});

		expect(container.querySelector(".card")).toBeNull();
	});
});
