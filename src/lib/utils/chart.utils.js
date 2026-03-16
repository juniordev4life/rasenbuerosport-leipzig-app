/**
 * Reads CSS variables for chart.js theming
 * @returns {object} Color map for charts
 */
export function getChartTheme() {
	const cs = getComputedStyle(document.documentElement);
	return {
		textSecondary: cs.getPropertyValue("--color-text-secondary").trim(),
		border: cs.getPropertyValue("--color-border").trim(),
		accentRed: cs.getPropertyValue("--color-accent-red").trim(),
		success: cs.getPropertyValue("--color-success").trim(),
		warning: cs.getPropertyValue("--color-warning").trim(),
		error: cs.getPropertyValue("--color-error").trim(),
		bgSecondary: cs.getPropertyValue("--color-bg-secondary").trim(),
	};
}

/**
 * Standard chart.js options for dark-themed charts
 * @param {object} theme - From getChartTheme()
 * @returns {object}
 */
export function getBaseChartOptions(theme) {
	return {
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			legend: { display: false },
			tooltip: {
				backgroundColor: "rgba(0,0,0,0.85)",
				titleColor: "#fff",
				bodyColor: "#fff",
				padding: 10,
				cornerRadius: 8,
				titleFont: { size: 11 },
				bodyFont: { size: 11 },
			},
		},
		scales: {
			x: {
				grid: { display: false },
				ticks: { color: theme.textSecondary, font: { size: 10 } },
				border: { display: false },
			},
			y: {
				grid: { color: `${theme.border}30` },
				ticks: { color: theme.textSecondary, font: { size: 10 } },
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
	const formatted = typeof val === "number" && val % 1 !== 0 ? val.toFixed(1) : String(val);
	return formatted + suffix;
}
