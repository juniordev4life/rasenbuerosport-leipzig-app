/**
 * Component test for LoginForm — covers the three outcomes of the Google
 * sign-in: a user without a profile goes to the setup page, a known user to
 * the dashboard, and an account the API rejects is signed out. A rejected
 * account must never be deleted: after a wrong rejection the next sign-in
 * would get a new uid and lose the link to its profile and match history.
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/svelte";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { deleteAccount, get, goto, loginWithGoogle, logout } = vi.hoisted(
	() => ({
		deleteAccount: vi.fn(),
		get: vi.fn(),
		goto: vi.fn(),
		loginWithGoogle: vi.fn(),
		logout: vi.fn(),
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
vi.mock("$app/navigation", () => ({ goto }));
vi.mock("$lib/services/api.services.js", () => ({ get }));
vi.mock("$lib/services/auth.services.js", () => ({ loginWithGoogle, logout }));
vi.mock("$lib/config/firebase.config.js", () => ({
	auth: { currentUser: { delete: deleteAccount } },
}));

import LoginForm from "../../../../src/lib/components/auth/LoginForm.svelte";
import { ROUTES } from "../../../../src/lib/constants/routes.constants.js";

describe("LoginForm", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		loginWithGoogle.mockResolvedValue({});
		logout.mockResolvedValue();
	});

	it("signs a rejected account out without deleting it", async () => {
		get.mockRejectedValue(new Error("User not authorized"));
		render(LoginForm);

		await fireEvent.click(screen.getByRole("button"));

		expect(
			await screen.findByText("auth.errors.not_authorized"),
		).toBeInTheDocument();
		expect(logout).toHaveBeenCalledOnce();
		expect(deleteAccount).not.toHaveBeenCalled();
		expect(goto).not.toHaveBeenCalled();
	});

	it("sends a user without a profile to the setup page", async () => {
		get.mockResolvedValue({ data: { needsSetup: true } });
		render(LoginForm);

		await fireEvent.click(screen.getByRole("button"));

		await waitFor(() => expect(goto).toHaveBeenCalledWith(ROUTES.SETUP));
		expect(logout).not.toHaveBeenCalled();
	});

	it("sends a user with a profile to the dashboard", async () => {
		get.mockResolvedValue({ data: { needsSetup: false } });
		render(LoginForm);

		await fireEvent.click(screen.getByRole("button"));

		await waitFor(() => expect(goto).toHaveBeenCalledWith(ROUTES.DASHBOARD));
		expect(logout).not.toHaveBeenCalled();
	});
});
