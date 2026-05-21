<script>
import { getTranslate } from "@tolgee/svelte";
import ChartCanvas from "../stats/ChartCanvas.svelte";

/**
 * Six-axis radar chart of the player's character.
 * @type {{ axes: { finisher:number, playmaker:number, clutch:number, consistency:number, discipline:number, winner:number }, color: string, onAxisClick?: (axis:string)=>void }}
 */
let { axes, color, onAxisClick } = $props();

const { t } = getTranslate();

const AXIS_KEYS = [
	"finisher",
	"playmaker",
	"clutch",
	"consistency",
	"discipline",
	"winner",
];

const config = $derived({
	type: "radar",
	data: {
		labels: AXIS_KEYS.map((k) => $t(`player_profile.axes.${k}`)),
		datasets: [
			{
				label: $t("player_profile.axes_title"),
				data: AXIS_KEYS.map((k) => axes?.[k] ?? 0),
				backgroundColor: `${color}33`,
				borderColor: color,
				borderWidth: 2,
				pointBackgroundColor: color,
				pointRadius: 4,
				pointHoverRadius: 6,
			},
		],
	},
	options: {
		responsive: true,
		maintainAspectRatio: false,
		scales: {
			r: {
				min: 0,
				max: 100,
				ticks: {
					stepSize: 25,
					color: "var(--color-text-muted)",
					backdropColor: "transparent",
				},
				grid: { color: "var(--color-border)" },
				angleLines: { color: "var(--color-border)" },
				pointLabels: {
					color: "var(--color-text-primary)",
					font: { size: 12, weight: "600" },
				},
			},
		},
		plugins: {
			legend: { display: false },
			tooltip: { enabled: true },
		},
		onClick: (_evt, items) => {
			if (!onAxisClick || !items?.length) return;
			const idx = items[0].index;
			onAxisClick(AXIS_KEYS[idx]);
		},
	},
});
</script>

<div class="bg-bg-secondary border border-border rounded-2xl p-4">
	<h2 class="mb-3 text-sm font-semibold text-text-secondary uppercase tracking-wide">
		{$t("player_profile.axes_title")}
	</h2>
	<ChartCanvas {config} height="h-80" />
</div>
