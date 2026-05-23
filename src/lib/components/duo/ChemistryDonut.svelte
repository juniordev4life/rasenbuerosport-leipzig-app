<script>
import { getTranslate } from "@tolgee/svelte";

/**
 * SVG donut chart for the duo chemistry score. When `score` is null
 * (lifecycle 'fresh' or 'finding'), renders a dashed-border placeholder
 * with the hint that chemistry unlocks at 10 matches.
 *
 * @type {{
 *   score: number|null,
 *   trendDelta?: number|null,
 *   rankInfo?: string|null,
 * }}
 */
let { score = null, trendDelta = null, rankInfo = null } = $props();

const { t } = getTranslate();

const RADIUS = 42;
const CIRC = 2 * Math.PI * RADIUS;
const offset = $derived(score != null ? CIRC * (1 - score / 100) : CIRC);

const isPending = $derived(score == null);
const trendText = $derived.by(() => {
	if (trendDelta == null) return null;
	if (trendDelta > 0) return `↑ +${trendDelta} ${$t("duo.last_month")}`;
	if (trendDelta < 0) return `↓ ${trendDelta} ${$t("duo.last_month")}`;
	return `± 0 ${$t("duo.last_month")}`;
});
</script>

<div class="chemistry-block">
	{#if isPending}
		<div class="chemistry-pending">
			<div class="chemistry-pending-value">—</div>
			<div class="chemistry-pending-label">{$t("duo.chemistry_label")}</div>
		</div>
		<div class="chemistry-pending-sub">{$t("duo.chemistry_pending_sub")}</div>
	{:else}
		<div class="chemistry-donut-wrap">
			<svg class="chemistry-donut" viewBox="0 0 100 100">
				<circle cx="50" cy="50" r={RADIUS} class="track" />
				<circle
					cx="50"
					cy="50"
					r={RADIUS}
					class="fill"
					stroke-dasharray={CIRC.toFixed(2)}
					stroke-dashoffset={offset.toFixed(2)}
				/>
			</svg>
			<div class="chemistry-inner">
				<div class="chemistry-value">{score}</div>
				<div class="chemistry-label-small">{$t("duo.chemistry_label")}</div>
			</div>
		</div>
		{#if trendText}
			<div class="chemistry-trend">{trendText}</div>
		{/if}
		{#if rankInfo}
			<div class="chemistry-rank-info">{rankInfo}</div>
		{/if}
	{/if}
</div>

<style>
.chemistry-block {
	display: flex; flex-direction: column;
	align-items: center;
	margin-top: 8px;
}
.chemistry-donut-wrap {
	position: relative;
	width: 100px; height: 100px;
}
.chemistry-donut {
	width: 100%; height: 100%;
	transform: rotate(-90deg);
}
.track {
	fill: none;
	stroke: rgba(255, 255, 255, 0.06);
	stroke-width: 8;
}
.fill {
	fill: none;
	stroke: #84CC16;
	stroke-width: 8;
	stroke-linecap: round;
	transition: stroke-dashoffset 0.6s ease;
}
.chemistry-inner {
	position: absolute;
	top: 0; left: 0; right: 0; bottom: 0;
	display: flex; flex-direction: column;
	align-items: center; justify-content: center;
}
.chemistry-value {
	font-size: 30px; font-weight: 800;
	color: #FFFFFF;
	line-height: 1;
	font-variant-numeric: tabular-nums;
}
.chemistry-label-small {
	font-size: 8px;
	color: #84CC16;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.1em;
	margin-top: 2px;
}
.chemistry-trend {
	margin-top: 10px;
	font-size: 11px;
	color: #84CC16;
	font-weight: 700;
}
.chemistry-rank-info {
	font-size: 10px;
	color: #6B7280;
	margin-top: 3px;
}
.chemistry-pending {
	width: 100px; height: 100px;
	border-radius: 50%;
	border: 2px dashed rgba(132, 204, 22, 0.25);
	display: flex; flex-direction: column;
	align-items: center; justify-content: center;
}
.chemistry-pending-value {
	font-size: 30px; font-weight: 800;
	color: #4B5563;
	line-height: 1;
}
.chemistry-pending-label {
	font-size: 8px;
	color: #6B7280;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.1em;
	margin-top: 2px;
}
.chemistry-pending-sub {
	font-size: 10px;
	color: #6B7280;
	margin-top: 10px;
	text-align: center;
	max-width: 220px;
}
</style>
