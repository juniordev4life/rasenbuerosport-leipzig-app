/**
 * Component test for the live-match minute editor: the minute and the
 * stoppage time are typed into number fields, every valid keystroke is
 * reported upwards, and Save refuses a time that is out of range or
 * before the last event.
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

import MinuteEditor from "../../../../src/lib/components/liveMatch/MinuteEditor.svelte";

function renderEditor(props = {}) {
	const handlers = {
		onMinuteChange: vi.fn(),
		onStoppageChange: vi.fn(),
		onGoalTypeClick: vi.fn(),
		onCancel: vi.fn(),
		onConfirm: vi.fn(),
	};
	const view = render(MinuteEditor, {
		minute: 1,
		stoppageMinutes: null,
		goalType: "open_play",
		previousEvents: [],
		eventKind: "goal",
		...handlers,
		...props,
	});
	return {
		...view,
		...handlers,
		minuteField: screen.getByLabelText("live_match.editor.minute_label"),
		stoppageField: screen.getByLabelText("live_match.editor.stoppage_label"),
		save: screen.getByRole("button", { name: "live_match.editor.confirm" }),
	};
}

describe("MinuteEditor", () => {
	it("pre-fills the minute and reports a typed one", async () => {
		// Arrange
		const { minuteField, onMinuteChange } = renderEditor({ minute: 12 });

		// Act
		await fireEvent.input(minuteField, { target: { value: "37" } });

		// Assert
		expect(minuteField).toHaveAttribute("inputmode", "numeric");
		expect(minuteField).toHaveValue("37");
		expect(onMinuteChange).toHaveBeenLastCalledWith(37);
	});

	it("drops anything that is not a digit", async () => {
		// Arrange
		const { minuteField, onMinuteChange } = renderEditor();

		// Act
		await fireEvent.input(minuteField, { target: { value: "4a5" } });

		// Assert
		expect(minuteField).toHaveValue("45");
		expect(onMinuteChange).toHaveBeenLastCalledWith(45);
	});

	it("unlocks the stoppage field only at 45, 90 and 120", async () => {
		// Arrange
		const { stoppageField, rerender } = renderEditor({ minute: 44 });

		// Assert
		expect(stoppageField).toBeDisabled();

		// Act
		await rerender({ minute: 90 });

		// Assert
		expect(stoppageField).toBeEnabled();
	});

	it("reports typed stoppage time and treats an empty field as none", async () => {
		// Arrange
		const { stoppageField, onStoppageChange } = renderEditor({ minute: 90 });

		// Act
		await fireEvent.input(stoppageField, { target: { value: "3" } });
		await fireEvent.input(stoppageField, { target: { value: "" } });

		// Assert
		expect(onStoppageChange).toHaveBeenNthCalledWith(1, 3);
		expect(onStoppageChange).toHaveBeenNthCalledWith(2, null);
	});

	it("saves a valid time", async () => {
		// Arrange
		const { minuteField, save, onConfirm } = renderEditor();
		await fireEvent.input(minuteField, { target: { value: "23" } });

		// Act
		await fireEvent.click(save);

		// Assert
		expect(onConfirm).toHaveBeenCalledOnce();
	});

	it("does not save a minute above 120 and says why", async () => {
		// Arrange
		const { minuteField, save, onConfirm, onMinuteChange } = renderEditor();
		await fireEvent.input(minuteField, { target: { value: "130" } });

		// Act
		await fireEvent.click(save);

		// Assert
		expect(onConfirm).not.toHaveBeenCalled();
		expect(onMinuteChange).not.toHaveBeenCalledWith(130);
		expect(minuteField).toHaveAttribute("aria-invalid", "true");
		expect(screen.getByText("live_match.editor.error_range")).toBeInTheDocument();
	});

	it("does not save a time before the last event", async () => {
		// Arrange
		const { minuteField, save, onConfirm } = renderEditor({
			minute: 31,
			previousEvents: [{ minute: 30, stoppage: 0 }],
		});
		await fireEvent.input(minuteField, { target: { value: "20" } });

		// Act
		await fireEvent.click(save);

		// Assert
		expect(onConfirm).not.toHaveBeenCalled();
		expect(screen.getByText("live_match.editor.error_floor")).toBeInTheDocument();
	});

	it("follows a minute set from outside, e.g. by the tour", async () => {
		// Arrange
		const { minuteField, stoppageField, rerender } = renderEditor();

		// Act
		await rerender({ minute: 45, stoppageMinutes: 3 });

		// Assert
		expect(minuteField).toHaveValue("45");
		expect(stoppageField).toHaveValue("3");
	});
});
