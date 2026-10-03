<script>
import { Chart, registerables } from "chart.js";
import { getChartTheme } from "$lib/utils/chart.utils.js";

Chart.register(...registerables);

/**
 * Chart.js canvas wrapper. Builds the chart from `config` and rebuilds it
 * when the config changes. Before each build it applies the active
 * design's defaults: body font, muted text and the bar corner radius
 * (square in design A, rounded in B — the `--radius-bar` token, capped).
 *
 * The container is `flex: 1`, so in a stretched card (charts side by
 * side) the chart fills the card instead of leaving a gap. `label` names
 * the chart for screen readers, which see the canvas as one image.
 *
 * @type {{ config: object, height?: string, label?: string }}
 */
let { config, height = "h-48", label = "" } = $props();

const MAX_BAR_RADIUS = 6;

let canvas = $state(null);
let chartInstance = null;

/** Point Chart.js' global defaults at the active design's roles. */
function applyDesignDefaults() {
	const theme = getChartTheme();
	const radius = Number.parseFloat(
		getComputedStyle(document.documentElement).getPropertyValue("--radius-bar"),
	);
	Chart.defaults.font.family = theme.fontSans;
	Chart.defaults.color = theme.muted;
	Chart.defaults.elements.bar.borderRadius = Math.min(
		Number.isFinite(radius) ? radius : 0,
		MAX_BAR_RADIUS,
	);
}

$effect(() => {
	if (!canvas || !config) return;

	applyDesignDefaults();
	chartInstance?.destroy();
	chartInstance = new Chart(canvas, config);

	return () => {
		chartInstance?.destroy();
		chartInstance = null;
	};
});
</script>

<div
	class="chart-box {height}"
	role={label ? "img" : undefined}
	aria-label={label || undefined}
>
	<canvas bind:this={canvas}></canvas>
</div>

<style>
/* Chart.js needs a relatively positioned container of its own. It grows
 * with the card but never sizes itself to the canvas (min-height: 0),
 * which would feed Chart.js' resize loop. */
.chart-box {
	position: relative;
	flex: 1 0 auto;
	min-height: 0;
}
</style>
