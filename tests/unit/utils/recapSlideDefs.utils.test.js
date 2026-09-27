/**
 * Exercises the recap story's real slide list (`RECAP_SLIDE_DEFS`)
 * against a realistic fixture, on top of the synthetic cases in
 * `recapStory.utils.test.js` — this is what actually catches a
 * `hasData` guard that drifts from the fields a slide reads.
 */

import { describe, expect, it } from "vitest";
import {
	availableSlides,
	RECAP_SLIDE_DEFS,
} from "$lib/utils/recapStory.utils.js";
import { buildSeasonRecapFixture } from "../../fixtures/seasonRecap.fixture.js";

const ALL_SLIDE_IDS = [
	"intro",
	"numbers",
	"goals",
	"timing",
	"relations",
	"match_of_season",
	"elo_journey",
	"new_elo",
	"awards",
	"finale",
];

function slideIds(recap) {
	return availableSlides(RECAP_SLIDE_DEFS, recap).map((s) => s.id);
}

describe("RECAP_SLIDE_DEFS", () => {
	it("shows every slide for a fully populated recap", () => {
		expect(slideIds(buildSeasonRecapFixture())).toEqual(ALL_SLIDE_IDS);
	});

	it("skips timing/relations/match_of_season when their fields are all absent", () => {
		const recap = buildSeasonRecapFixture();
		delete recap.stats.favorite_weekday;
		delete recap.stats.best_weekday;
		delete recap.stats.lunch_break_share;
		delete recap.stats.favorite_hour;
		delete recap.stats.best_partner;
		delete recap.stats.nemesis;
		delete recap.stats.favorite_victim;
		delete recap.stats.match_of_season;
		delete recap.stats.biggest_win;
		delete recap.stats.highest_scoring_game;
		delete recap.stats.most_common_score;
		delete recap.stats.favorite_club;
		delete recap.stats.best_club;

		expect(slideIds(recap)).toEqual([
			"intro",
			"numbers",
			"goals",
			"elo_journey",
			"new_elo",
			"awards",
			"finale",
		]);
	});

	it("skips the awards slide when the league has no awards yet", () => {
		const recap = buildSeasonRecapFixture();
		recap.league.awards = [];

		expect(slideIds(recap)).not.toContain("awards");
	});

	it("keeps the new_elo slide even when old_rating is unknown for this player", () => {
		const recap = buildSeasonRecapFixture();
		recap.elo.old_rating = null;

		expect(slideIds(recap)).toContain("new_elo");
	});

	it("only ever shows intro and finale when stats/elo/league are entirely missing", () => {
		const recap = buildSeasonRecapFixture({ stats: null, elo: null });
		recap.league.awards = [];

		expect(slideIds(recap)).toEqual(["intro", "finale"]);
	});
});
