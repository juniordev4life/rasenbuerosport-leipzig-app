/**
 * Component test for the scroll-snap step picker behind the star-range
 * selectors in RandomTeamPicker: which values it renders, how it marks
 * the active one, how the arrow keys step it within [min, max], and how
 * it is named and announced to screen readers.
 * jsdom has no layout, so the scroll-driven path is not covered here.
 */

import { fireEvent, render, screen } from "@testing-library/svelte";
import { beforeAll, describe, expect, it, onTestFinished, vi } from "vitest";
import StepScroller from "../../../../src/lib/components/games/StepScroller.svelte";

const STAR_RANGE = { min: 0.5, max: 5, step: 0.5 };

beforeAll(() => {
	// The picker re-centres itself via `scrollTo`, which jsdom lacks.
	if (typeof Element.prototype.scrollTo !== "function") {
		Element.prototype.scrollTo = vi.fn();
	}
});

/**
 * Adds a visible label outside the component, as RandomTeamPicker does,
 * and removes it again when the test ends.
 * @param {string} id
 * @param {string} text
 */
function addLabel(id, text) {
	const label = document.createElement("span");
	label.id = id;
	label.textContent = text;
	document.body.append(label);
	onTestFinished(() => label.remove());
}

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

	it("takes its accessible name from the element it is labelled by", () => {
		// Arrange
		addLabel("min-stars-label", "Min. Stars");

		// Act
		render(StepScroller, {
			value: 4,
			...STAR_RANGE,
			labelledBy: "min-stars-label",
		});

		// Assert
		expect(screen.getByRole("slider", { name: "Min. Stars" })).toHaveAttribute(
			"aria-valuenow",
			"4",
		);
	});

	it("announces the formatted value text and keeps it in step", async () => {
		// Arrange
		const valueText = (v) => `${v} stars`;
		render(StepScroller, { value: 3.5, ...STAR_RANGE, valueText });
		const slider = screen.getByRole("slider");
		expect(slider).toHaveAttribute("aria-valuetext", "3.5 stars");

		// Act
		await fireEvent.keyDown(slider, { key: "ArrowRight" });

		// Assert
		expect(slider).toHaveAttribute("aria-valuetext", "4 stars");
	});

	it("renders no naming or value-text attributes when they are not given", () => {
		// Arrange + Act
		render(StepScroller, { value: 4, ...STAR_RANGE });

		// Assert
		const slider = screen.getByRole("slider");
		expect(slider).not.toHaveAttribute("aria-labelledby");
		expect(slider).not.toHaveAttribute("aria-valuetext");
	});
});
