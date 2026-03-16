<script>
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

/**
 * Reusable chart.js canvas wrapper
 * @type {{ config: object, height?: string }}
 */
let { config, height = "h-48" } = $props();

let canvas = $state(null);
let chartInstance = null;

$effect(() => {
	if (!canvas || !config) return;

	if (chartInstance) {
		chartInstance.destroy();
	}

	chartInstance = new Chart(canvas, config);

	return () => {
		if (chartInstance) {
			chartInstance.destroy();
			chartInstance = null;
		}
	};
});
</script>

<div class={height}>
	<canvas bind:this={canvas}></canvas>
</div>
