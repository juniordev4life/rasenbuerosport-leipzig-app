/**
 * Derive a small set of "character tags" describing the personality
 * of a match (e.g. late drama, lucky win, defensive battle) from the
 * existing game payload — no extra DB columns needed.
 *
 * Tags are purely cosmetic; they decorate the match hero card and
 * are not stored or used for ranking.
 */

/** @typedef {"late_drama"|"lucky_win"|"defensive_battle"|"penalty_decision"|"goal_fest"|"clear_win"|"draw"|"comeback"} CharacterTagId */

/** @typedef {{ id: CharacterTagId, variant: "warning"|"red"|"success"|"info" }} CharacterTag */

const LATE_MINUTE_THRESHOLD = 80;
const CLEAR_WIN_MARGIN = 3;
const GOAL_FEST_TOTAL = 5;
const DEFENSIVE_TOTAL_GOALS = 1;

/**
 * Compute character tags for one game. Returns at most 4 entries,
 * in the order they were detected. Empty array when the game has no
 * discernible personality (rare — most games trigger at least one).
 *
 * @param {object} game - Game row as returned by `/v1/games/:id`.
 * @returns {CharacterTag[]}
 * @example
 *   const tags = getMatchCharacterTags(game);
 *   // → [{ id: "late_drama", variant: "success" }, { id: "penalty_decision", variant: "warning" }]
 */
export function getMatchCharacterTags(game) {
	if (!game) return [];
	/** @type {CharacterTag[]} */
	const tags = [];
	const home = game.score_home ?? 0;
	const away = game.score_away ?? 0;
	const total = home + away;
	const margin = Math.abs(home - away);
	const timeline = Array.isArray(game.score_timeline)
		? game.score_timeline
		: [];

	const lastGoal = [...timeline]
		.reverse()
		.find(
			(e) =>
				e.event_type !== "red_card" &&
				e.event_type !== "card" &&
				e.event_type !== "penalty_missed",
		);
	const lastGoalMinute =
		typeof lastGoal?.minute === "number" ? lastGoal.minute : null;

	if (home === away && total > 0) {
		tags.push({ id: "draw", variant: "info" });
	}

	if (margin >= CLEAR_WIN_MARGIN) {
		tags.push({ id: "clear_win", variant: "success" });
	}

	if (total >= GOAL_FEST_TOTAL) {
		tags.push({ id: "goal_fest", variant: "warning" });
	}

	if (
		margin === 1 &&
		lastGoalMinute !== null &&
		lastGoalMinute >= LATE_MINUTE_THRESHOLD
	) {
		tags.push({ id: "late_drama", variant: "success" });
	}

	if (lastGoal?.goal_type === "penalty" && margin >= 1) {
		tags.push({ id: "penalty_decision", variant: "warning" });
	}

	if (total <= DEFENSIVE_TOTAL_GOALS) {
		tags.push({ id: "defensive_battle", variant: "info" });
	}

	const stats = game.match_stats ?? null;
	if (stats && margin === 1) {
		const xgHome = stats.xg?.home;
		const xgAway = stats.xg?.away;
		if (typeof xgHome === "number" && typeof xgAway === "number") {
			const winnerXg = home > away ? xgHome : xgAway;
			const loserXg = home > away ? xgAway : xgHome;
			if (loserXg > winnerXg + 0.5) {
				tags.push({ id: "lucky_win", variant: "red" });
			}
		}
	}

	if (timeline.length > 0 && margin >= 1) {
		const winnerSide = home > away ? "home" : "away";
		let leadFlippedToLoser = false;
		let prevHome = 0;
		let prevAway = 0;
		for (const entry of timeline) {
			if (
				entry.event_type === "red_card" ||
				entry.event_type === "card" ||
				entry.event_type === "penalty_missed"
			) {
				continue;
			}
			const isHomeGoal = entry.home > prevHome;
			prevHome = entry.home;
			prevAway = entry.away;
			const leaderAfter =
				entry.home > entry.away
					? "home"
					: entry.home < entry.away
						? "away"
						: null;
			if (leaderAfter && leaderAfter !== winnerSide) {
				leadFlippedToLoser = true;
			}
			// silence unused
			void isHomeGoal;
			void prevAway;
		}
		if (leadFlippedToLoser) {
			tags.push({ id: "comeback", variant: "success" });
		}
	}

	return tags.slice(0, 4);
}
