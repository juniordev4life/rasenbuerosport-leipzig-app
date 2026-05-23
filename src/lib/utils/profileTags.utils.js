/**
 * Derives the strengths / weaknesses / playstyle tag lists for a
 * player profile from the six perzentile axes. Mirrors the heuristic
 * from the roadmap spec — strong axes (≥75) become positive pills,
 * weak axes (≤40) become negative pills, and a handful of combination
 * rules yield neutral "Spielstil" pills.
 */

const AXIS_LABELS = {
	finisher: { de: "Vollstrecker", en: "Finisher" },
	playmaker: { de: "Vorbereiter", en: "Playmaker" },
	clutch: { de: "Schlussphase", en: "Clutch" },
	consistency: { de: "Konstanz", en: "Consistency" },
	discipline: { de: "Disziplin", en: "Discipline" },
	winner: { de: "Sieger-Faktor", en: "Winner" },
};

const STYLES_DE = {
	eiskalt: "Eiskalter Abschluss",
	bigGame: "Big-Game-Spieler",
	disziplinLimit: "Disziplin-Limit",
	spielmacher: "Spielmacher",
	geboren: "Geborener Sieger",
};

const STYLES_EN = {
	eiskalt: "Ice-cold finisher",
	bigGame: "Big-game player",
	disziplinLimit: "On the edge",
	spielmacher: "Playmaker",
	geboren: "Born winner",
};

/**
 * @param {{ finisher:number, playmaker:number, clutch:number, consistency:number, discipline:number, winner:number }} axes
 * @param {"de"|"en"} [locale]
 * @returns {{ strengths: Array<{label:string, perzentil:string}>, weaknesses: Array<{label:string, perzentil:string}>, character: string[] }}
 */
export function generatePlayerTags(axes, locale = "de") {
	const strengths = [];
	const weaknesses = [];
	const character = [];
	if (!axes) return { strengths, weaknesses, character };

	const list = Object.entries(axes);
	for (const [key, raw] of list) {
		const value = Number(raw) || 0;
		const meta = AXIS_LABELS[key];
		if (!meta) continue;
		const label = meta[locale] ?? meta.de;
		if (value >= 75) {
			strengths.push({
				label,
				perzentil: formatPerzentil(value, "top", locale),
			});
		} else if (value <= 40) {
			weaknesses.push({
				label,
				perzentil: formatPerzentil(value, "bottom", locale),
			});
		}
	}

	const STYLES = locale === "en" ? STYLES_EN : STYLES_DE;
	const { finisher, playmaker, clutch, consistency, discipline, winner } = axes;
	if (finisher > 80 && discipline < 40) character.push(STYLES.eiskalt);
	if (clutch > 75 && consistency < 50) character.push(STYLES.bigGame);
	if (discipline < 35) character.push(STYLES.disziplinLimit);
	if (playmaker > 70 && finisher < 50) character.push(STYLES.spielmacher);
	if (winner > 80) character.push(STYLES.geboren);

	return { strengths, weaknesses, character };
}

/**
 * @param {number} value perzentile (0–100)
 * @param {"top"|"bottom"} type
 * @param {"de"|"en"} locale
 * @returns {string}
 */
function formatPerzentil(value, type, locale) {
	if (type === "top") {
		const top = Math.max(1, Math.round(100 - value));
		return locale === "en" ? `Top ${top}%` : `Top ${top}%`;
	}
	const pct = Math.max(1, Math.round(value));
	return locale === "en" ? `Bot. ${pct}%` : `Unt. ${pct}%`;
}
