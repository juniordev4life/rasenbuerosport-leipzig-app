/**
 * Component test for ProfileEditor's save — `avatar_url` must only be sent
 * after a new upload. Re-sending the current avatar would be checked against
 * the API's avatar allow-list and could block a plain username change.
 * The file checks mirror storage.rules, so a file Storage would deny never
 * gets uploaded.
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/svelte";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AVATAR_MAX_BYTES } from "../../../../src/lib/constants/upload.constants.js";

const DOWNLOAD_URL =
	"https://firebasestorage.googleapis.com/v0/b/test-bucket/o/avatars%2Fuid-1%2Favatar.png?alt=media&token=t";

const { getDownloadURL, patch, updateProfile, uploadBytes } = vi.hoisted(
	() => ({
		getDownloadURL: vi.fn(),
		patch: vi.fn(),
		updateProfile: vi.fn(),
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
vi.mock("firebase/auth", () => ({ updateProfile }));
vi.mock("firebase/storage", () => ({
	getDownloadURL,
	ref: vi.fn(() => ({})),
	uploadBytes,
}));
vi.mock("$lib/config/firebase.config.js", () => ({
	auth: { currentUser: { uid: "uid-1" } },
	storage: {},
}));
vi.mock("$lib/services/api.services.js", () => ({ patch }));

import ProfileEditor from "../../../../src/lib/components/profile/ProfileEditor.svelte";

describe("ProfileEditor", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		patch.mockResolvedValue({});
		updateProfile.mockResolvedValue();
		uploadBytes.mockResolvedValue();
		getDownloadURL.mockResolvedValue(DOWNLOAD_URL);
		// jsdom has no object URLs; the editor uses one for the preview.
		URL.createObjectURL = vi.fn(() => "blob:avatar-preview");
	});

	it("does not send avatar_url when only the username is saved", async () => {
		render(ProfileEditor, {
			props: {
				currentUsername: "Marco",
				currentAvatarUrl: "https://lh3.googleusercontent.com/a/photo",
			},
		});

		await fireEvent.click(
			screen.getByRole("button", { name: "profile.edit.save" }),
		);

		await waitFor(() =>
			expect(patch).toHaveBeenCalledWith("/v1/auth/profile", {
				username: "Marco",
			}),
		);
		expect(uploadBytes).not.toHaveBeenCalled();
	});

	it("sends the download URL after a new upload", async () => {
		const { container } = render(ProfileEditor, {
			props: { currentUsername: "Marco", currentAvatarUrl: null },
		});
		const file = new File(["png"], "avatar.png", { type: "image/png" });

		await fireEvent.change(container.querySelector("#avatar-upload"), {
			target: { files: [file] },
		});
		await fireEvent.click(
			screen.getByRole("button", { name: "profile.edit.save" }),
		);

		await waitFor(() =>
			expect(patch).toHaveBeenCalledWith("/v1/auth/profile", {
				username: "Marco",
				avatar_url: DOWNLOAD_URL,
			}),
		);
		expect(uploadBytes).toHaveBeenCalledOnce();
	});

	it.each([
		[
			"an SVG",
			new File(["<svg/>"], "avatar.svg", { type: "image/svg+xml" }),
			"profile.edit.error_file_type",
		],
		[
			"a file over AVATAR_MAX_BYTES",
			new File([new Uint8Array(AVATAR_MAX_BYTES + 1)], "avatar.png", {
				type: "image/png",
			}),
			"profile.edit.error_file_size",
		],
	])("rejects %s with a translated message", async (_label, file, message) => {
		const { container } = render(ProfileEditor, {
			props: { currentUsername: "Marco", currentAvatarUrl: null },
		});

		await fireEvent.change(container.querySelector("#avatar-upload"), {
			target: { files: [file] },
		});

		expect(screen.getByText(message)).toBeInTheDocument();
	});

	it("keeps a rejected file out of the save", async () => {
		const { container } = render(ProfileEditor, {
			props: { currentUsername: "Marco", currentAvatarUrl: null },
		});
		const svg = new File(["<svg/>"], "avatar.svg", { type: "image/svg+xml" });

		await fireEvent.change(container.querySelector("#avatar-upload"), {
			target: { files: [svg] },
		});
		await fireEvent.click(
			screen.getByRole("button", { name: "profile.edit.save" }),
		);

		await waitFor(() =>
			expect(patch).toHaveBeenCalledWith("/v1/auth/profile", {
				username: "Marco",
			}),
		);
		expect(uploadBytes).not.toHaveBeenCalled();
	});
});
