import { describe, expect, it } from "vitest";
import {
	ANALYSIS_GRACE_MINUTES,
	isReportBlocked,
} from "$lib/utils/matchReport.utils.js";

const NOW = Date.parse("2026-08-20T18:00:00.000Z");
const minutesAgo = (m) => new Date(NOW - m * 60_000).toISOString();

const recorded = (video_status, minutes = 5) => ({
	recording_id: "rec-1",
	video_status,
	played_at: minutesAgo(minutes),
});

describe("isReportBlocked", () => {
	it("does not block when there is no game", () => {
		expect(isReportBlocked(null, NOW)).toBe(false);
		expect(isReportBlocked(undefined, NOW)).toBe(false);
	});

	it("blocks a pending game regardless of age", () => {
		const old = { pending: true, played_at: minutesAgo(60 * 24) };
		expect(isReportBlocked(old, NOW)).toBe(true);
	});

	it("does not block a purely manual game", () => {
		expect(isReportBlocked({ played_at: minutesAgo(1) }, NOW)).toBe(false);
	});

	it.each(["ready", "failed"])(
		"does not block once the pipeline reported %s",
		(status) => {
			expect(isReportBlocked(recorded(status), NOW)).toBe(false);
		},
	);

	it.each(["processing", "uploaded", null, undefined])(
		"blocks a fresh recorded game while status is %s",
		(status) => {
			expect(isReportBlocked(recorded(status), NOW)).toBe(true);
		},
	);

	it("stops blocking once the grace period has passed", () => {
		// The regression this guards: a capture that died before reporting any
		// status left video_status empty forever, so the page showed a
		// "preparing" spinner that never resolved and never asked for a report.
		const stale = recorded(null, ANALYSIS_GRACE_MINUTES + 1);
		expect(isReportBlocked(stale, NOW)).toBe(false);
	});

	it("still blocks exactly at the grace boundary", () => {
		const atBoundary = recorded("processing", ANALYSIS_GRACE_MINUTES);
		expect(isReportBlocked(atBoundary, NOW)).toBe(true);
	});

	it("keeps blocking a recorded game without a usable timestamp", () => {
		const noDate = { recording_id: "rec-1", video_status: null, played_at: null };
		expect(isReportBlocked(noDate, NOW)).toBe(true);
		const badDate = { recording_id: "rec-1", played_at: "nicht-datum" };
		expect(isReportBlocked(badDate, NOW)).toBe(true);
	});
});
