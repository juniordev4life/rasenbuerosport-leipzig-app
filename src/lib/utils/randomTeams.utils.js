/**
 * Random team-picker helpers shared by the new-game wizard's Step 2
 * (auto-roll on mount + 🎲 Würfeln button) and the RandomTeamPicker
 * modal (manual min/max-stars dialog).
 *
 * The "fair pick" contract: both returned teams have the *same* exact
 * star rating, drawn from the configured min..max range. The picker
 * first collects every rating with ≥2 candidates inside the range and
 * then picks two distinct teams from a uniformly-chosen rating bucket.
 */

import { getAllTeams } from "$lib/services/teams.services.js";

/**
 * @typedef {object} RandomTeamPair
 * @property {import('$lib/services/teams.services.js').TeamData} home
 * @property {import('$lib/services/teams.services.js').TeamData} away
 */

/**
 * Pick two distinct teams with the same star rating within the
 * inclusive [minStars, maxStars] range. Returns `null` when no
 * rating bucket inside the range contains two teams.
 *
 * @param {object} args
 * @param {number} args.minStars
 * @param {number} args.maxStars
 * @returns {Promise<RandomTeamPair|null>}
 * @example
 *   const pair = await rollRandomTeams({ minStars: 4, maxStars: 5 });
 *   pair?.home.name // "Arsenal"
 */
export async function rollRandomTeams({ minStars, maxStars }) {
	if (minStars > maxStars) return null;
	const teams = await getAllTeams();
	const inRange = teams.filter(
		(t) =>
			t.star_rating !== null &&
			t.star_rating >= minStars &&
			t.star_rating <= maxStars,
	);

	/** @type {Map<number, number>} */
	const counts = new Map();
	for (const t of inRange) {
		counts.set(t.star_rating, (counts.get(t.star_rating) ?? 0) + 1);
	}
	const eligible = [...counts.entries()]
		.filter(([, c]) => c >= 2)
		.map(([rating]) => rating);
	if (eligible.length === 0) return null;

	const chosen = eligible[Math.floor(Math.random() * eligible.length)];
	const pool = inRange.filter((t) => t.star_rating === chosen);

	const i = Math.floor(Math.random() * pool.length);
	let j = Math.floor(Math.random() * (pool.length - 1));
	if (j >= i) j += 1;

	return { home: pool[i], away: pool[j] };
}
