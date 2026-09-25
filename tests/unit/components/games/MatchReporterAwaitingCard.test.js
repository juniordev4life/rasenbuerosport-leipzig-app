/**
 * Component test for the match-stats screenshot upload. The card must only
 * send files that storage.rules accepts, so the user sees a translated
 * message instead of a raw storage/unauthorized error.
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/svelte";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MATCH_STATS_MAX_BYTES } from "../../../../src/lib/constants/upload.constants.js";

const { getDownloadURL, post, ref, resizeImage, uploadBytes } = vi.hoisted(
	() => ({
		getDownloadURL: vi.fn(),
		post: vi.fn(),
		ref: vi.fn((_storage, path) => ({ path })),
		resizeImage: vi.fn(),
		uploadBytes: vi.fn(),
	}),
);

vi.mock("@tolgee/svelte", async () => {
	const { readable } = await import("svelte/store");
	return {
		getTranslate: () => ({
			t: readable((key) => key),
		}),
	};
});
vi.mock("firebase/storage", () => ({ getDownloadURL, ref, uploadBytes }));
vi.mock("$lib/config/firebase.config.js", () => ({ storage: {} }));
vi.mock("$lib/services/api.services.js", () => ({ post }));
// Keep the real type check; jsdom cannot decode images for resizeImage.
vi.mock("$lib/utils/image.utils.js", async (importOriginal) => ({
	...(await importOriginal()),
	resizeImage,
}));

import MatchReporterAwaitingCard from "../../../../src/lib/components/games/MatchReporterAwaitingCard.svelte";

const GAME_ID = "0b3f8a52-4c1e-4f5e-9a7d-2e6c1d9b8f40";

/**
 * Picks files in the card's hidden file input.
 * @param {HTMLElement} container
 * @param {File[]} files
 */
async function pick(container, files) {
	await fireEvent.change(container.querySelector('input[type="file"]'), {
		target: { files },
	});
}

describe("MatchReporterAwaitingCard", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		uploadBytes.mockResolvedValue();
		getDownloadURL.mockResolvedValue(
			"https://firebasestorage.googleapis.com/v0/b/test/o/x?alt=media&token=t",
		);
		post.mockResolvedValue({});
	});

	it("uploads a screenshot through resizeImage with the Storage size cap", async () => {
		const file = new File(["png"], "shot.png", { type: "image/png" });
		resizeImage.mockResolvedValue(file);
		const { container } = render(MatchReporterAwaitingCard, {
			props: { gameId: GAME_ID },
		});

		await pick(container, [file]);

		await waitFor(() => expect(post).toHaveBeenCalledOnce());
		expect(resizeImage).toHaveBeenCalledWith(file, 1920, MATCH_STATS_MAX_BYTES);
		expect(ref).toHaveBeenCalledWith({}, `match-stats/${GAME_ID}/overview.jpg`);
	});

	it("rejects an SVG with the file-type message", async () => {
		const { container } = render(MatchReporterAwaitingCard, {
			props: { gameId: GAME_ID },
		});

		await pick(container, [
			new File(["<svg/>"], "shot.svg", { type: "image/svg+xml" }),
		]);

		expect(
			await screen.findByText("match_stats.error_file_type"),
		).toBeInTheDocument();
		expect(uploadBytes).not.toHaveBeenCalled();
	});

	it("rejects a screenshot that is still over the cap after resizing", async () => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		resizeImage.mockResolvedValue({ size: MATCH_STATS_MAX_BYTES + 1 });
		const { container } = render(MatchReporterAwaitingCard, {
			props: { gameId: GAME_ID },
		});

		await pick(container, [
			new File(["png"], "huge.png", { type: "image/png" }),
		]);

		expect(
			await screen.findByText("match_stats.error_file_size"),
		).toBeInTheDocument();
		expect(uploadBytes).not.toHaveBeenCalled();
	});
});
