/**
 * Route test for the /app layout's account check. An account the API
 * rejects must be signed out and sent to the login page — never deleted —
 * and the redirect must happen even when signing out fails, so the user is
 * not left on the loading spinner.
 */

import { render } from "@testing-library/svelte";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { deleteAccount, get, goto, logout } = vi.hoisted(() => ({
	deleteAccount: vi.fn(),
	get: vi.fn(),
	goto: vi.fn(),
	logout: vi.fn(),
}));

vi.mock("$app/environment", () => ({ browser: true }));
vi.mock("$app/navigation", () => ({ goto }));
vi.mock("$app/state", () => ({
	page: { url: new URL("http://localhost/app/dashboard") },
}));
vi.mock("$lib/services/api.services.js", () => ({ get }));
vi.mock("$lib/services/auth.services.js", () => ({ logout }));
vi.mock("$lib/config/firebase.config.js", () => ({
	auth: { currentUser: { delete: deleteAccount } },
}));
// The app chrome is never rendered on the rejection path; stub it so the
// test does not pull in the stores and services those components use.
vi.mock("$lib/components/layout/BottomNav.svelte", () => ({ default: vi.fn() }));
vi.mock("$lib/components/layout/Header.svelte", () => ({ default: vi.fn() }));
vi.mock("$lib/components/layout/Sidebar.svelte", () => ({ default: vi.fn() }));
vi.mock("$lib/components/layout/Topbar.svelte", () => ({ default: vi.fn() }));
vi.mock("$lib/components/profile/PushSoftPrompt.svelte", () => ({
	default: vi.fn(),
}));

import { ROUTES } from "../../../../src/lib/constants/routes.constants.js";
import AppLayout from "../../../../src/routes/app/+layout.svelte";

describe("/app layout", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		get.mockRejectedValue(new Error("User not authorized"));
	});

	it("signs a rejected account out and redirects without deleting it", async () => {
		logout.mockResolvedValue();

		render(AppLayout);

		await vi.waitFor(() => expect(goto).toHaveBeenCalledWith(ROUTES.LOGIN));
		expect(logout).toHaveBeenCalledOnce();
		expect(deleteAccount).not.toHaveBeenCalled();
	});

	it("still redirects to the login page when signing out fails", async () => {
		logout.mockRejectedValue(new Error("sign-out failed"));
		const consoleError = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});

		render(AppLayout);

		await vi.waitFor(() => expect(goto).toHaveBeenCalledWith(ROUTES.LOGIN));
		expect(consoleError).toHaveBeenCalled();
		consoleError.mockRestore();
	});
});
