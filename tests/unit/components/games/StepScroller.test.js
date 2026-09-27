/**
 * Component test for the scroll-snap step picker behind the star-range
 * selectors in RandomTeamPicker: which values it renders, how it marks
 * the active one, and how the arrow keys step it within [min, max].
 * jsdom has no layout, so the scroll-driven path is not covered here.
 */

import { fireEvent, render, screen } from "@testing-library/svelte";
import { beforeAll, describe, expect, it, vi } from "vitest";
import StepScroller from "../../../../src/lib/components/games/StepScroller.svelte";

const STAR_RANGE = { min: 0.5, max: 5, step: 0.5 };

beforeAll(() => {
	// The picker re-centres itself via `scrollTo`, which jsdom lacks.
	if (typeof Element.prototype.scrollTo !== "function") {
		Element.prototype.scrollTo = vi.fn();
	}
});

/** Rendered item labels, in strip order. */
function itemLabels() {
	return [...document.querySelectorAll("[data-value]")].map((el) =>
		el.textContent.trim(),
	);
}

describe("StepScroller", () => {
	it("renders every half step and marks the active value and its neighbours", () => {
		// Arrange + Act
		render(StepScroller, { value: 4, ...STAR_RANGE });

		// Assert
		expect(itemLabels()).toEqual([
			"0.5",
			"1",
			"1.5",
			"2",
			"2.5",
			"3",
			"3.5",
			"4",
			"4.5",
			"5",
		]);
		const item = (v) => document.querySelector(`[data-value="${v}"]`);
		expect(item(4)).toHaveClass("active");
		expect(item(3.5)).toHaveClass("near");
		expect(item(4.5)).toHaveClass("near");
		expect(item(3)).not.toHaveClass("active");
		expect(item(3)).not.toHaveClass("near");
	});

	it("exposes the range and current value as a slider", () => {
		// Arrange + Act
		render(StepScroller, { value: 4, ...STAR_RANGE });

		// Assert
		const slider = screen.getByRole("slider");
		expect(slider).toHaveAttribute("aria-valuemin", "0.5");
		expect(slider).toHaveAttribute("aria-valuemax", "5");
		expect(slider).toHaveAttribute("aria-valuenow", "4");
	});

	it("steps by one increment on Arrow Left / Right", async () => {
		// Arrange
		const onChange = vi.fn();
		render(StepScroller, { value: 4, ...STAR_RANGE, onChange });
		const slider = screen.getByRole("slider");

		// Act
		await fireEvent.keyDown(slider, { key: "ArrowRight" });
		await fireEvent.keyDown(slider, { key: "ArrowLeft" });
		await fireEvent.keyDown(slider, { key: "ArrowLeft" });

		// Assert
		expect(onChange.mock.calls.map(([v]) => v)).toEqual([4.5, 4, 3.5]);
		expect(slider).toHaveAttribute("aria-valuenow", "3.5");
	});

	it.each([
		["ArrowLeft", 0.5],
		["ArrowRight", 5],
	])("ignores %s at the edge of the range", async (key, value) => {
		// Arrange
		const onChange = vi.fn();
		render(StepScroller, { value, ...STAR_RANGE, onChange });

		// Act
		await fireEvent.keyDown(screen.getByRole("slider"), { key });

		// Assert
		expect(onChange).not.toHaveBeenCalled();
	});
});
