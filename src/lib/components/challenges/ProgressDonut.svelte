<script>
/**
 * SVG donut showing weekly challenge completion. Stroke colour switches
 * from grey → red → gold → green depending on how many of the three
 * challenges are already done.
 *
 * @type {{ completed: number, total: number, size?: number }}
 */
let { completed = 0, total = 3, size = 50 } = $props();

const STROKE = 4;
const radius = $derived((size - STROKE) / 2);
const circumference = $derived(2 * Math.PI * radius);
const offset = $derived(
	circumference * (1 - (total > 0 ? completed / total : 0)),
);
const color = $derived.by(() => {
	if (completed === 0) return "#6B7280";
	if (completed === total) return "#84CC16";
	if (completed >= total * 0.5) return "#F59E0B";
	return "#E24B4A";
});
</script>

<div class="wrap" style="width: {size}px; height: {size}px;">
	<svg viewBox="0 0 {size} {size}" width={size} height={size} aria-hidden="true">
		<circle
			cx={size / 2}
			cy={size / 2}
			r={radius}
			fill="none"
			stroke="rgba(255,255,255,0.06)"
			stroke-width={STROKE}
		/>
		<circle
			cx={size / 2}
			cy={size / 2}
			r={radius}
			fill="none"
			stroke={color}
			stroke-width={STROKE}
			stroke-linecap="round"
			stroke-dasharray={circumference}
			stroke-dashoffset={offset}
			transform="rotate(-90 {size / 2} {size / 2})"
			style="transition: stroke-dashoffset 0.6s ease, stroke 0.3s ease;"
		/>
	</svg>
	<div class="label" style="color: {color};">{completed}/{total}</div>
</div>

<style>
.wrap {
	position: relative;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}
.label {
	position: absolute;
	inset: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 13px;
	font-weight: 800;
	font-variant-numeric: tabular-nums;
}
</style>
