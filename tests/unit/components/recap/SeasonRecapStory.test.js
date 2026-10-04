/**
 * Component test for the season recap story. Whatever the story looks
 * like, its mechanics must hold: it opens as a labelled modal dialog on
 * the intro, every slide with data renders in order, the arrow keys and
 * the tap thirds of the story frame step back and on (on desktop the
 * thirds are measured on the phone-shaped frame, not the window), the
 * desktop step buttons do the same, and Escape or ✕ close it.
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
vi.mock("$app/navigation", () => ({ goto: vi.fn() }));

import SeasonRecapStory from "$lib/components/recap/SeasonRecapStory.svelte";
import { buildSeasonRecapFixture } from "../../../fixtures/seasonRecap.fixture.js";

/** Headline of each slide of the full fixture, in story order. */
const SLIDE_TITLES = [
	"season_recap.intro.title",
	"season_recap.numbers.title",
	"season_recap.goals.title",
	"season_recap.timing.title",
	"season_recap.relations.title",
	"season_recap.match_of_season.title",
	"season_recap.elo_journey.title",
	"season_recap.new_elo.title",
	"season_recap.awards.title",
];

beforeAll(() => {
	// The slide transition runs on the Web Animations API, which jsdom
	// lacks. Finish every animation at once.
	if (typeof Element.prototype.animate !== "function") {
		Element.prototype.animate = () => {
			const animation = { onfinish: null, cancel: vi.fn(), currentTime: 0 };
			queueMicrotask(() => animation.onfinish?.());
			return animation;
		};
	}
});

function renderStory(onClose = vi.fn()) {
	render(SeasonRecapStory, {
		props: { recap: buildSeasonRecapFixture(), onClose },
	});
	return onClose;
}

function showsSlide(title) {
	return screen.queryByRole("heading", { name: title }) !== null;
}

/**
 * A tap: pointer down and up at the same spot, well under 250 ms. jsdom
 * has no PointerEvent, so the pointer events are dispatched as mouse
 * events, which carry `clientX`.
 */
async function tapAt(clientX) {
	const dialog = screen.getByRole("dialog");
	const init = { bubbles: true, clientX };
	await fireEvent(dialog, new MouseEvent("pointerdown", init));
	await fireEvent(dialog, new MouseEvent("pointerup", init));
}

describe("SeasonRecapStory", () => {
	it("opens as a modal dialog on the intro slide", () => {
		renderStory();

		const dialog = screen.getByRole("dialog", {
			name: "season_recap.dialog_label",
		});
		expect(dialog).toHaveAttribute("aria-modal", "true");
		expect(showsSlide("season_recap.intro.title")).toBe(true);
	});

	it("steps through every slide with data and ends on the finale", async () => {
		renderStory();

		for (const title of SLIDE_TITLES) {
			expect(showsSlide(title)).toBe(true);
			await fireEvent.keyDown(window, { key: "ArrowRight" });
		}

		expect(
			screen.getByRole("button", { name: "season_recap.finale.cta" }),
		).toBeInTheDocument();
	});

	it("steps back and on with the arrow keys", async () => {
		renderStory();

		await fireEvent.keyDown(window, { key: "ArrowRight" });
		expect(showsSlide("season_recap.numbers.title")).toBe(true);

		await fireEvent.keyDown(window, { key: "ArrowLeft" });
		expect(showsSlide("season_recap.intro.title")).toBe(true);
	});

	it("reads taps on the left and right third of a full-screen frame", async () => {
		renderStory();
		const third = window.innerWidth / 3;

		await tapAt(third * 2.5);
		expect(showsSlide("season_recap.numbers.title")).toBe(true);

		await tapAt(third * 1.5);
		expect(showsSlide("season_recap.numbers.title")).toBe(true);

		await tapAt(third * 0.5);
		expect(showsSlide("season_recap.intro.title")).toBe(true);
	});

	it("measures the tap thirds on the centred desktop frame, not the window", async () => {
		renderStory();
		const frame = screen.getByRole("dialog").querySelector(".frame");
		vi.spyOn(frame, "getBoundingClientRect").mockReturnValue({
			left: 400,
			right: 700,
			width: 300,
			top: 0,
			bottom: 600,
			height: 600,
			x: 400,
			y: 0,
		});

		// Right third of the frame, though in the middle of the window.
		await tapAt(650);
		expect(showsSlide("season_recap.numbers.title")).toBe(true);

		// Middle of the frame: no step.
		await tapAt(550);
		expect(showsSlide("season_recap.numbers.title")).toBe(true);

		// Left third of the frame.
		await tapAt(420);
		expect(showsSlide("season_recap.intro.title")).toBe(true);

		// Beside the frame counts as its nearer side.
		await tapAt(900);
		expect(showsSlide("season_recap.numbers.title")).toBe(true);
		await tapAt(100);
		expect(showsSlide("season_recap.intro.title")).toBe(true);
	});

	it("offers previous / next buttons beside the desktop frame", async () => {
		renderStory();
		// Hidden below lg by CSS; query them regardless of layout.
		const previous = screen.getByRole("button", {
			name: "season_recap.previous_slide",
			hidden: true,
		});
		const next = screen.getByRole("button", {
			name: "season_recap.next_slide",
			hidden: true,
		});

		// aria-disabled, not disabled: focus must not drop out of the dialog.
		expect(previous).toHaveAttribute("aria-disabled", "true");
		await fireEvent.click(previous);
		expect(showsSlide("season_recap.intro.title")).toBe(true);

		await fireEvent.click(next);
		expect(showsSlide("season_recap.numbers.title")).toBe(true);
		expect(previous).toHaveAttribute("aria-disabled", "false");

		await fireEvent.click(previous);
		expect(showsSlide("season_recap.intro.title")).toBe(true);
	});

	it("closes on Escape and on the close button", async () => {
		const onClose = renderStory();

		await fireEvent.keyDown(window, { key: "Escape" });
		expect(onClose).toHaveBeenCalledTimes(1);

		await fireEvent.click(
			screen.getByRole("button", { name: "season_recap.close" }),
		);
		expect(onClose).toHaveBeenCalledTimes(2);
	});
});
