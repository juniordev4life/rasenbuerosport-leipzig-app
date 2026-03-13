<script>
import { getTranslate } from "@tolgee/svelte";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

/**
 * @type {{
 *   formCurve?: Array<{game_id: string, result: string, elo_after: number, elo_change: number, played_at: string}>
 * }}
 */
let { formCurve = [] } = $props();

const { t } = getTranslate();

let canvas = $state(null);
let chartInstance = $state(null);

/** Reversed so oldest game is first (left-to-right chronological) */
const sortedCurve = $derived([...formCurve].reverse());

/** Color map for W/D/L result dots */
const RESULT_COLORS = {
	W: "var(--color-success)",
	D: "var(--color-warning)",
	L: "var(--color-error)",
};

$effect(() => {
	if (!canvas || sortedCurve.length === 0) return;

	// Destroy existing chart before creating a new one
	if (chartInstance) {
		chartInstance.destroy();
	}

	const labels = sortedCurve.map((_, i) => `${i + 1}`);
	const eloData = sortedCurve.map((g) => g.elo_after);
	const changeLabels = sortedCurve.map((g) => {
		const prefix = g.elo_change >= 0 ? "+" : "";
		return `${prefix}${g.elo_change}`;
	});

	// Get computed CSS values for theming
	const computedStyle = getComputedStyle(document.documentElement);
	const textSecondary = computedStyle
		.getPropertyValue("--color-text-secondary")
		.trim();
	const borderColor = computedStyle.getPropertyValue("--color-border").trim();
	const accentRed = computedStyle.getPropertyValue("--color-accent-red").trim();
	const successColor = computedStyle.getPropertyValue("--color-success").trim();
	const warningColor = computedStyle.getPropertyValue("--color-warning").trim();
	const errorColor = computedStyle.getPropertyValue("--color-error").trim();

	const resultColorMap = { W: successColor, D: warningColor, L: errorColor };
	const pointColors = sortedCurve.map(
		(g) => resultColorMap[g.result] || textSecondary,
	);

	chartInstance = new Chart(canvas, {
		type: "line",
		data: {
			labels,
			datasets: [
				{
					data: eloData,
					borderColor: accentRed,
					borderWidth: 2,
					pointBackgroundColor: pointColors,
					pointBorderColor: pointColors,
					pointRadius: 6,
					pointHoverRadius: 8,
					tension: 0.3,
					fill: false,
				},
			],
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			plugins: {
				legend: { display: false },
				tooltip: {
					callbacks: {
						title: (ctx) => {
							const idx = ctx[0].dataIndex;
							const game = sortedCurve[idx];
							const date = new Date(game.played_at).toLocaleDateString(
								"de-DE",
								{
									day: "2-digit",
									month: "2-digit",
								},
							);
							return date;
						},
						label: (ctx) => {
							const idx = ctx.dataIndex;
							const game = sortedCurve[idx];
							const resultLabel =
								game.result === "W"
									? $t("elo.win")
									: game.result === "D"
										? $t("elo.draw")
										: $t("elo.loss");
							return `${resultLabel} | Elo: ${game.elo_after} (${changeLabels[idx]})`;
						},
					},
					backgroundColor: "rgba(0,0,0,0.8)",
					titleColor: "#fff",
					bodyColor: "#fff",
					padding: 10,
					cornerRadius: 8,
				},
			},
			scales: {
				x: {
					display: true,
					grid: { display: false },
					ticks: { color: textSecondary, font: { size: 10 } },
				},
				y: {
					display: true,
					grid: { color: `${borderColor}40` },
					ticks: { color: textSecondary, font: { size: 10 }, stepSize: 10 },
				},
			},
		},
	});

	return () => {
		if (chartInstance) {
			chartInstance.destroy();
			chartInstance = null;
		}
	};
});
</script>

{#if sortedCurve.length > 0}
	<div class="bg-bg-secondary border border-border rounded-lg p-4">
		<h3 class="text-sm font-medium text-text-secondary mb-3">
			{$t("elo.form_curve_title")}
		</h3>

		<!-- W/D/L Dots Row -->
		<div class="flex justify-between mb-3 px-1">
			{#each sortedCurve as game (game.game_id)}
				<div class="flex flex-col items-center gap-1">
					<span
						class="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white
							{game.result === 'W' ? 'bg-success' : game.result === 'D' ? 'bg-warning' : 'bg-error'}"
					>
						{game.result === "W" ? $t("elo.w_short") : game.result === "D" ? $t("elo.d_short") : $t("elo.l_short")}
					</span>
					<span class="text-[9px] {game.elo_change >= 0 ? 'text-success' : 'text-error'}">
						{game.elo_change >= 0 ? "+" : ""}{game.elo_change}
					</span>
				</div>
			{/each}
		</div>

		<!-- Chart -->
		<div class="h-40">
			<canvas bind:this={canvas}></canvas>
		</div>
	</div>
{/if}
