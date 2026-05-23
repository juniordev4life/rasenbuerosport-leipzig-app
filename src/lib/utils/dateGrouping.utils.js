/**
 * Groups a newest-first list of matches into Historie date buckets:
 *   HEUTE → GESTERN → DIESE WOCHE → LETZTE WOCHE → DIESER MONAT
 *   → "MONAT YEAR" for everything older. Empty groups are dropped.
 *
 * Pure helper — no Svelte deps so it stays unit-testable.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * @typedef {{ id: string, played_at: string, [key: string]: any }} GameLike
 */

/**
 * Split games into ordered date groups for the Historie list.
 *
 * @param {GameLike[]} games Newest-first.
 * @param {"de"|"en"} [locale]
 * @returns {Array<{ key: string, label: string, matches: GameLike[] }>}
 *
 * @example
 *   groupMatchesByDate(games);
 *   // → [{ key: "today", label: "HEUTE", matches: [...] }, …]
 */
export function groupMatchesByDate(games, locale = "de") {
	const labels = locale === "en" ? LABELS_EN : LABELS_DE;
	const now = new Date();
	const today = startOfDay(now);
	const yesterday = today - DAY_MS;
	const weekStart = startOfWeek(now);
	const lastWeekStart = weekStart - 7 * DAY_MS;
	const monthStart = startOfMonth(now);

	const buckets = {
		today: [],
		yesterday: [],
		thisWeek: [],
		lastWeek: [],
		thisMonth: [],
		older: new Map(),
	};

	for (const game of games ?? []) {
		const ts = new Date(game.played_at).getTime();
		if (!Number.isFinite(ts)) continue;
		if (ts >= today) buckets.today.push(game);
		else if (ts >= yesterday) buckets.yesterday.push(game);
		else if (ts >= weekStart) buckets.thisWeek.push(game);
		else if (ts >= lastWeekStart) buckets.lastWeek.push(game);
		else if (ts >= monthStart) buckets.thisMonth.push(game);
		else {
			const d = new Date(ts);
			const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
			if (!buckets.older.has(key)) buckets.older.set(key, []);
			buckets.older.get(key).push(game);
		}
	}

	const result = [
		{ key: "today", label: labels.today, matches: buckets.today },
		{ key: "yesterday", label: labels.yesterday, matches: buckets.yesterday },
		{ key: "thisWeek", label: labels.thisWeek, matches: buckets.thisWeek },
		{ key: "lastWeek", label: labels.lastWeek, matches: buckets.lastWeek },
		{ key: "thisMonth", label: labels.thisMonth, matches: buckets.thisMonth },
	];
	for (const [key, matches] of buckets.older.entries()) {
		const [yr, mo] = key.split("-").map(Number);
		const d = new Date(yr, mo - 1, 1);
		const label = d
			.toLocaleDateString(locale === "en" ? "en-US" : "de-DE", {
				month: "long",
				year: "numeric",
			})
			.toUpperCase();
		result.push({ key, label, matches });
	}
	return result.filter((g) => g.matches.length > 0);
}

/**
 * Sum of ELO deltas for a player across a list of games. Returns 0 if
 * the player has no snapshot in any of them.
 *
 * @param {GameLike[]} games
 * @param {string|null} playerId
 * @returns {number}
 */
export function computeGroupEloDelta(games, playerId) {
	if (!playerId) return 0;
	let sum = 0;
	for (const g of games ?? []) {
		const snap = g.elo_snapshot;
		if (!snap) continue;
		const entry = [...(snap.teamA ?? []), ...(snap.teamB ?? [])].find(
			(e) => e.playerId === playerId,
		);
		if (entry?.delta != null) sum += entry.delta;
	}
	return Math.round(sum);
}

function startOfDay(date) {
	const d = new Date(date);
	d.setHours(0, 0, 0, 0);
	return d.getTime();
}

function startOfWeek(date) {
	const d = new Date(date);
	const dayNum = (d.getDay() + 6) % 7;
	d.setDate(d.getDate() - dayNum);
	d.setHours(0, 0, 0, 0);
	return d.getTime();
}

function startOfMonth(date) {
	const d = new Date(date);
	d.setDate(1);
	d.setHours(0, 0, 0, 0);
	return d.getTime();
}

const LABELS_DE = {
	today: "HEUTE",
	yesterday: "GESTERN",
	thisWeek: "DIESE WOCHE",
	lastWeek: "LETZTE WOCHE",
	thisMonth: "DIESER MONAT",
};
const LABELS_EN = {
	today: "TODAY",
	yesterday: "YESTERDAY",
	thisWeek: "THIS WEEK",
	lastWeek: "LAST WEEK",
	thisMonth: "THIS MONTH",
};
