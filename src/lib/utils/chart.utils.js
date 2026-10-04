/**
 * Reads the active design variant's colour roles for Chart.js. Values are
 * 6-digit hex strings, so callers may append a two-digit alpha
 * (`${theme.muted}50`). Read it when a chart is created; the variant can
 * change between page visits.
 *
 * @returns {{
 *   ink: string, muted: string, line: string, surface: string,
 *   brand: string, win: string, loss: string, gold: string,
 *   navy: string, onNavy: string,
 *   chart1: string, chart2: string, chart3: string, chart4: string,
 *   fontSans: string, fontCond: string,
 * }} Colour roles and font stacks
 * @example
 * const theme = getChartTheme();
 * dataset.borderColor = theme.brand;
 */
export function getChartTheme() {
	const cs = getComputedStyle(document.documentElement);
	const read = (name) => cs.getPropertyValue(name).trim();
	return {
		ink: read("--color-ink"),
		muted: read("--color-muted"),
		line: read("--color-line"),
		surface: read("--color-surface"),
		brand: read("--color-brand"),
		win: read("--color-win"),
		loss: read("--color-loss"),
		gold: read("--color-gold"),
		navy: read("--color-navy"),
		onNavy: read("--color-on-navy"),
		chart1: read("--color-chart-1"),
		chart2: read("--color-chart-2"),
		chart3: read("--color-chart-3"),
		chart4: read("--color-chart-4"),
		fontSans: read("--font-sans"),
		fontCond: read("--font-cond"),
	};
}

/**
 * Shared Chart.js options: no legend, navy tooltip, muted ticks in the
 * condensed face and faint horizontal grid lines.
 *
 * @param {ReturnType<typeof getChartTheme>} theme - From getChartTheme()
 * @returns {object} Chart.js options to spread into a chart config
 * @example
 * const options = { ...getBaseChartOptions(getChartTheme()), indexAxis: "y" };
 */
export function getBaseChartOptions(theme) {
	const tickFont = { family: theme.fontCond, size: 12, weight: 700 };
	return {
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			legend: { display: false },
			tooltip: {
				backgroundColor: theme.navy,
				titleColor: theme.onNavy,
				bodyColor: theme.onNavy,
				padding: 10,
				cornerRadius: 6,
				titleFont: { family: theme.fontSans, size: 12, weight: 700 },
				bodyFont: { family: theme.fontSans, size: 12 },
			},
		},
		scales: {
			x: {
				grid: { display: false },
				ticks: { color: theme.muted, font: tickFont },
				border: { display: false },
			},
			y: {
				grid: { color: theme.line },
				ticks: { color: theme.muted, font: tickFont },
				border: { display: false },
			},
		},
	};
}

/**
 * Formats a numeric value for display in charts
 * @param {number} val
 * @param {string} [suffix]
 * @returns {string}
 */
export function formatValue(val, suffix = "") {
	if (val === null || val === undefined) return "-";
	const formatted =
		typeof val === "number" && val % 1 !== 0 ? val.toFixed(1) : String(val);
	return formatted + suffix;
}
