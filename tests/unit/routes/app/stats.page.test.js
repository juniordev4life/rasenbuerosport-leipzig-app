/**
 * Route test for /app/stats: the activity charts get the UI locale, so
 * their month and weekday names are not always German.
 */

import { render } from "@testing-library/svelte";
import { readable } from "svelte/store";
import { describe, expect, it, vi } from "vitest";

const { GamesPerMonthChart, WeekdayDistributionChart } = vi.hoisted(() => ({
	GamesPerMonthChart: vi.fn(),
	WeekdayDistributionChart: vi.fn(),
}));

vi.mock("@tolgee/svelte", () => ({
	getTranslate: () => ({ t: readable((key) => key) }),
}));
vi.mock("$lib/config/i18n.config.js", () => ({
	tolgee: { getLanguage: () => "en", on: vi.fn() },
}));
vi.mock("$lib/services/api.services.js", () => ({
	get: vi.fn((url) =>
		Promise.resolve({
			data: url.startsWith("/v1/stats/dashboard")
				? {
						games_per_month: [{ month: "2026-03", count: 4 }],
						games_per_weekday: [{ weekday: 2, count: 4 }],
					}
				: null,
		}),
	),
}));
// The chart wrappers draw on a canvas jsdom lacks; only their props matter.
vi.mock("$lib/components/stats/GamesPerMonthChart.svelte", () => ({
	default: GamesPerMonthChart,
}));
vi.mock("$lib/components/stats/WeekdayDistributionChart.svelte", () => ({
	default: WeekdayDistributionChart,
}));

import StatsPage from "../../../../src/routes/app/stats/+page.svelte";

describe("/app/stats", () => {
	it("hands the UI locale to both activity charts", async () => {
		// Arrange + Act
		render(StatsPage);

		// Assert
		await vi.waitFor(() => {
			expect(GamesPerMonthChart).toHaveBeenCalled();
			expect(WeekdayDistributionChart).toHaveBeenCalled();
		});
		expect(GamesPerMonthChart.mock.calls[0][1].locale).toBe("en-US");
		expect(WeekdayDistributionChart.mock.calls[0][1].locale).toBe("en-US");
	});
});
