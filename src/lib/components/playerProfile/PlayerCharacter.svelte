<script>
import { getTranslate } from "@tolgee/svelte";
import ChartCanvas from "../stats/ChartCanvas.svelte";

/**
 * Six-axis radar chart of the player's character. Numeric values are
 * shown as a column to the right of the radar on screens >= sm and
 * below it on small screens.
 *
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

/**
 * Colour the value text by bucket: high (≥66), mid (33–65), low (<33).
 * @param {number} value
 */
function valueColor(value) {
	if (value >= 66) return "text-success";
	if (value >= 33) return "text-warning";
	return "text-error";
}
</script>

<div class="bg-bg-secondary border border-border rounded-2xl p-4">
	<h2 class="mb-3 text-sm font-semibold text-text-secondary uppercase tracking-wide">
		{$t("player_profile.axes_title")}
	</h2>
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center">
		<div class="flex-1 min-w-0">
			<ChartCanvas {config} height="h-80" />
		</div>
		<ul class="grid grid-cols-2 gap-2 sm:flex sm:w-44 sm:flex-col sm:gap-1.5">
			{#each AXIS_KEYS as key (key)}
				{@const v = Math.round(axes?.[key] ?? 0)}
				<li>
					<button
						type="button"
						class="flex w-full items-center justify-between rounded-lg bg-bg-primary/50 px-3 py-2 text-left transition-colors hover:bg-bg-input"
						onclick={() => onAxisClick?.(key)}
					>
						<span class="text-xs font-medium text-text-secondary">
							{$t(`player_profile.axes.${key}`)}
						</span>
						<span class="text-sm font-bold {valueColor(v)}">{v}</span>
					</button>
				</li>
			{/each}
		</ul>
	</div>
</div>
