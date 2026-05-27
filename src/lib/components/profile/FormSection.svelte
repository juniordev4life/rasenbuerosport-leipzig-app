<script>
import { getTranslate } from "@tolgee/svelte";
import HistoryIcon from "$lib/components/icons/HistoryIcon.svelte";
import MarcelCard from "./MarcelCard.svelte";

/**
 * "Aktuelle Form" section: 5 result pills with the ELO delta, a
 * card-styled ELO sparkline with green/red point dots per match
 * outcome and a compact Marcel quote.
 *
 * @type {{
 *   results: Array<"W"|"L"|"D">,
 *   eloSeries: number[],
 *   eloStart: number|null,
 *   eloEnd: number|null,
 *   eloDelta: number,
 *   marcelQuote: string,
 * }}
 */
let {
	results = [],
	eloSeries = [],
	eloStart = null,
	eloEnd = null,
	eloDelta = 0,
	marcelQuote,
} = $props();

const { t } = getTranslate();

const deltaText = $derived.by(() => {
	if (eloDelta > 0) return `↑ +${eloDelta}`;
	if (eloDelta < 0) return `↓ ${eloDelta}`;
	return "± 0";
});

const deltaClass = $derived(
	eloDelta > 0 ? "up" : eloDelta < 0 ? "down" : "flat",
);

const SPARK_WIDTH = 320;
const SPARK_HEIGHT = 50;

const sparkPoints = $derived.by(() => {
	if (!eloSeries.length) return [];
	if (eloSeries.length === 1) {
		return [{ x: SPARK_WIDTH / 2, y: SPARK_HEIGHT / 2, value: eloSeries[0] }];
	}
	const min = Math.min(...eloSeries);
	const max = Math.max(...eloSeries);
	const range = max - min || 1;
	const stepX = SPARK_WIDTH / (eloSeries.length - 1);
	return eloSeries.map((v, i) => ({
		x: i * stepX,
		y: SPARK_HEIGHT - ((v - min) / range) * (SPARK_HEIGHT - 8) - 4,
		value: v,
	}));
});

const polyline = $derived(
	sparkPoints.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" "),
);
</script>

<div class="section-card">
	<div class="section-header">
		<div class="section-label">
			<HistoryIcon size={12} strokeWidth={1.8} />
			<span>{$t("profile.form_section")}</span>
		</div>
	</div>

	<div class="form-top">
		<div class="form-pills">
			{#each results as r, i (i)}
				<div class="form-pill {r === 'W' ? 'win' : r === 'L' ? 'loss' : 'draw'}">
					{r === "W" ? $t("profile.w_short") : r === "L" ? $t("profile.l_short") : $t("profile.d_short")}
				</div>
			{/each}
		</div>
		<div class="form-summary {deltaClass}">
			<strong>{deltaText}</strong>
			<span class="elo-label">ELO</span>
		</div>
	</div>

	{#if eloSeries.length > 0}
		<div class="form-sparkline-wrap">
			<div class="form-sparkline-label">
				<span>{$t("profile.elo_last_five")}</span>
				{#if eloStart != null && eloEnd != null}
					<span class="{deltaClass}">{eloStart} → {eloEnd}</span>
				{/if}
			</div>
			<svg
				class="form-sparkline-svg"
				viewBox="0 0 {SPARK_WIDTH} {SPARK_HEIGHT}"
				preserveAspectRatio="none"
				aria-hidden="true"
			>
				<polyline
					points={polyline}
					fill="none"
					stroke="#E24B4A"
					stroke-width="2"
					stroke-linejoin="round"
					stroke-linecap="round"
				/>
				{#each sparkPoints as p, i (i)}
					{@const result = results[i]}
					<circle
						cx={p.x}
						cy={p.y}
						r="3.5"
						fill={result === "L" ? "#E24B4A" : result === "D" ? "#9CA3AF" : "#84CC16"}
					/>
				{/each}
			</svg>
		</div>
	{/if}

	<MarcelCard quote={marcelQuote} variant="compact" />
</div>

<style>
.section-card {
	background: #131822;
	border: 1px solid #1F2937;
	border-radius: 14px;
	padding: 14px;
}
.section-header { margin-bottom: 14px; }
.section-label {
	font-size: 10px;
	text-transform: uppercase; letter-spacing: 0.1em;
	color: #6B7280;
	font-weight: 700;
	display: inline-flex;
	align-items: center;
	gap: 6px;
}
.form-top {
	display: flex; align-items: center;
	gap: 10px;
	margin-bottom: 12px;
}
.form-pills { display: flex; gap: 5px; }
.form-pill {
	width: 28px; height: 28px;
	border-radius: 7px;
	display: flex; align-items: center; justify-content: center;
	font-size: 12px; font-weight: 800;
}
.form-pill.win {
	background: rgba(132, 204, 22, 0.15);
	color: #84CC16;
	border: 1.5px solid rgba(132, 204, 22, 0.3);
}
.form-pill.loss {
	background: rgba(226, 75, 74, 0.15);
	color: #E24B4A;
	border: 1.5px solid rgba(226, 75, 74, 0.3);
}
.form-pill.draw {
	background: rgba(156, 163, 175, 0.15);
	color: #9CA3AF;
	border: 1.5px solid rgba(156, 163, 175, 0.3);
}
.form-summary {
	margin-left: auto;
	font-size: 11px;
	color: #9CA3AF;
	text-align: right;
	display: flex; flex-direction: column; align-items: flex-end; gap: 2px;
}
.form-summary strong { font-weight: 800; font-variant-numeric: tabular-nums; }
.form-summary.up strong, .form-summary.up :global(span) { color: #84CC16; }
.form-summary.down strong, .form-summary.down :global(span) { color: #E24B4A; }
.form-summary.flat strong { color: #9CA3AF; }
.form-summary .elo-label { font-size: 9px; color: #6B7280; }
.form-sparkline-wrap {
	background: rgba(0,0,0,0.2);
	border-radius: 10px;
	padding: 10px 12px;
	margin-bottom: 10px;
}
.form-sparkline-label {
	display: flex; justify-content: space-between;
	font-size: 9px;
	color: #6B7280;
	text-transform: uppercase; letter-spacing: 0.08em;
	font-weight: 700;
	margin-bottom: 6px;
}
.form-sparkline-label .up { color: #84CC16; }
.form-sparkline-label .down { color: #E24B4A; }
.form-sparkline-label .flat { color: #9CA3AF; }
.form-sparkline-svg {
	width: 100%; height: 50px;
	display: block;
}
</style>
