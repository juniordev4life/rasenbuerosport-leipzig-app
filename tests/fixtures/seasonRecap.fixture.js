/**
 * @file A recap payload matching `GET /v1/seasons/:seasonId/recap/me` in
 * `season-fc27-api-contract.md`, for reuse across recap-story tests.
 * `buildSeasonRecapFixture` returns a deep-enough clone so individual
 * tests can safely mutate/delete fields to exercise "data missing"
 * slide-skipping without affecting other tests.
 */

const BASE_RECAP = {
	season: {
		id: "fc26",
		name: "EA FC 26",
		game_version: "FC26",
		starts_at: "2026-03-13T00:00:00.000Z",
		ends_at: "2026-09-22T13:00:00.000Z",
	},
	generated_at: "2026-09-23T06:00:00.000Z",
	player: {
		player_id: "p1",
		username: "FlorAIn",
		avatar_url: null,
	},
	stats: {
		games: 219,
		wins: 113,
		draws: 5,
		losses: 101,
		win_rate: 0.516,
		goals: 300,
		assists: 120,
		goals_per_game: 1.37,
		goals_against: 250,
		clean_sheets: 12,
		hattricks: 4,
		comeback_wins: 6,
		shootouts: { played: 5, won: 3 },
		cards: { yellow: 10, red: 1 },
		by_mode: {
			"1v1": { games: 40, wins: 20, draws: 2, losses: 18 },
			"2v2": { games: 150, wins: 80, draws: 3, losses: 67 },
			"1v2": { games: 29, wins: 13, draws: 0, losses: 16 },
		},
		longest_win_streak: 7,
		biggest_win: { game_id: "g1", score: "7:0", played_at: "2026-05-02T12:00:00.000Z", opponents: ["Jay"] },
		highest_scoring_game: { game_id: "g2", score: "6:5", played_at: "2026-04-11T12:30:00.000Z" },
		most_common_score: { score: "2:1", count: 14 },
		favorite_weekday: { weekday: 3, games: 50 },
		best_weekday: { weekday: 4, win_rate: 0.64, games: 30 },
		lunch_break_share: 0.78,
		favorite_hour: { hour: 12, games: 120 },
		favorite_club: { name: "Liverpool", games: 40 },
		best_club: { name: "Inter", win_rate: 0.7, games: 10 },
		best_partner: { player_id: "p2", username: "Nikinho", avatar_url: null, games: 112, wins: 63, win_rate: 0.56 },
		nemesis: { player_id: "p3", username: "Tobi", avatar_url: null, games: 30, losses: 18 },
		favorite_victim: { player_id: "p4", username: "Jay", avatar_url: null, games: 25, wins: 17 },
		match_of_season: {
			game_id: "g3",
			score: "4:4",
			played_at: "2026-06-20T18:00:00.000Z",
			result_type: "penalty",
			highlight_url: "https://storage.googleapis.com/rbs/highlights/g3.mp4",
			home_players: ["FlorAIn"],
			away_players: ["Tobi"],
		},
		ranks: {
			games: { rank: 1, of: 9 },
			goals: { rank: 2, of: 9 },
			wins: { rank: 1, of: 9 },
			assists: { rank: 3, of: 9 },
		},
	},
	elo: {
		start: 1500,
		end: 1570,
		rank: 3,
		of: 9,
		peak: { value: 1620, played_at: "2026-07-01T12:00:00.000Z" },
		history: [1500, 1512, 1560, 1540, 1570],
		old_rating: 1844,
		new_rating: 1600,
		drivers: { yellow_cards: 10, one_vs_two_games: 45, draws: 5, shootouts: 5 },
	},
	awards_won: ["top_scorer"],
	ai_summary: { persona: "euphoriker", text: "Was für eine Saison, FlorAIn!" },
	league: {
		games: 397,
		goals: 1977,
		shootouts: 20,
		players: 9,
		awards: [
			{
				key: "champion",
				player_ids: ["p2"],
				players: [{ player_id: "p2", username: "Nikinho", avatar_url: null }],
				value: 1624,
				unit: "elo",
			},
			{
				key: "top_scorer",
				player_ids: ["p1"],
				players: [{ player_id: "p1", username: "FlorAIn", avatar_url: null }],
				value: 300,
				unit: "goals",
			},
		],
		talkrunde: { status: "ready", audio_url: "https://storage.googleapis.com/rbs/talkrunde/fc26.mp3" },
	},
};

/**
 * Deep-clone the base FC26 recap fixture, optionally applying
 * overrides (shallow-merged at the top level; nested objects you want
 * to change should be passed in full).
 *
 * @param {Partial<typeof BASE_RECAP>} [overrides]
 * @returns {object}
 * @example
 *   const recap = buildSeasonRecapFixture({ elo: { ...BASE, old_rating: null } });
 *   const noRecap = buildSeasonRecapFixture({ ai_summary: null });
 */
export function buildSeasonRecapFixture(overrides = {}) {
	const clone = structuredClone(BASE_RECAP);
	return { ...clone, ...overrides };
}
