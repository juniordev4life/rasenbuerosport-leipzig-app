/**
 * Pure helpers that turn a (completed, total, hoursRemaining) triple
 * into a status headline + detail line for the Challenges hero. Output
 * is i18n key + interpolation params so the page layer stays in
 * control of localisation.
 */

/**
 * @param {number} completed
 * @param {number} total
 * @param {number} hoursRemaining
 * @returns {{ key: string, params?: object }}
 */
export function challengeStatusKey(completed, total, hoursRemaining) {
	const remaining = Math.max(0, total - completed);
	if (total === 0) return { key: "headline_empty" };
	if (completed === total) return { key: "headline_perfect" };
	if (completed === 0) {
		if (hoursRemaining < 24) return { key: "headline_last_chance" };
		return { key: "headline_start" };
	}
	if (completed >= total * 0.66) {
		return { key: "headline_solid", params: { remaining } };
	}
	if (hoursRemaining < 48) {
		return {
			key: "headline_endspurt",
			params: { remaining, hours: Math.round(hoursRemaining) },
		};
	}
	return { key: "headline_keep_going", params: { completed, remaining } };
}

/**
 * @param {number} ms
 * @returns {string} e.g. "1T 14h" / "8h 22m"
 */
export function formatCountdown(ms) {
	if (!Number.isFinite(ms) || ms <= 0) return "—";
	const totalMinutes = Math.floor(ms / 60000);
	const days = Math.floor(totalMinutes / (60 * 24));
	const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
	const minutes = totalMinutes % 60;
	if (days > 0) return `${days}T ${hours}h`;
	if (hours > 0) return `${hours}h ${minutes}m`;
	return `${minutes}m`;
}

/**
 * Streak banner derivation across the most recent N weeks.
 *
 * @param {Array<{ completed_count: number, challenges: Array<object> }>} weeks
 * @returns {{ key: string, params?: object }}
 */
export function streakBannerKey(weeks) {
	if (!weeks?.length) return { key: "streak_empty" };
	let totalCompleted = 0;
	let totalChallenges = 0;
	let perfectStreak = 0;
	let stillStreaking = true;
	for (const w of weeks) {
		const c = w.completed_count ?? 0;
		const t = w.challenges?.length ?? 0;
		totalCompleted += c;
		totalChallenges += t;
		if (stillStreaking && t > 0 && c === t) perfectStreak += 1;
		else stillStreaking = false;
	}
	if (perfectStreak >= 3) {
		return { key: "streak_perfect_streak", params: { count: perfectStreak } };
	}
	const rate = totalChallenges > 0 ? totalCompleted / totalChallenges : 0;
	if (rate >= 0.85) {
		return {
			key: "streak_outstanding",
			params: { completed: totalCompleted, total: totalChallenges },
		};
	}
	if (rate >= 0.6) {
		return {
			key: "streak_solid",
			params: { completed: totalCompleted, total: totalChallenges },
		};
	}
	if (totalCompleted === 0) return { key: "streak_none_yet" };
	return {
		key: "streak_keep_pushing",
		params: { completed: totalCompleted, total: totalChallenges },
	};
}

/**
 * Visual difficulty bucket — maps the API's easy/medium/hard onto the
 * leicht/mittel/schwer labels used by the design.
 *
 * @param {"easy"|"medium"|"hard"|string} difficulty
 * @returns {"leicht"|"mittel"|"schwer"}
 */
export function difficultyBucket(difficulty) {
	if (difficulty === "easy") return "leicht";
	if (difficulty === "hard") return "schwer";
	return "mittel";
}

/**
 * Pick the progress-bar state given the current week timing.
 *
 * @param {{ current: number, target: number, completed: boolean }} progress
 * @param {number} hoursRemaining
 * @returns {"done"|"in-progress"|"behind"}
 */
export function progressState(progress, hoursRemaining) {
	if (progress?.completed) return "done";
	const rate = progress?.target > 0 ? progress.current / progress.target : 0;
	const elapsedRatio = 1 - Math.max(0, Math.min(1, hoursRemaining / (7 * 24)));
	if (rate < elapsedRatio * 0.7 && elapsedRatio > 0.25) return "behind";
	return "in-progress";
}
