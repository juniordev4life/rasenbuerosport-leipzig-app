<script>
import { getTranslate } from "@tolgee/svelte";

/**
 * Ring showing how many of the week's challenges are done, with "X/Y"
 * in the middle. Track, fill and text colours come from custom
 * properties (defaults: track / progress / ink, the win colour once
 * everything is done), so a surrounding block can recolour it — the red
 * challenges hero of design A draws it in white with a hairline track.
 *
 * @type {{ completed: number, total: number, size?: number }}
 */
let { completed = 0, total = 3, size = 50 } = $props();

const { t } = getTranslate();

const STROKE = 5;
const radius = $derived((size - STROKE) / 2);
const circumference = $derived(2 * Math.PI * radius);
const offset = $derived(
	circumference * (1 - (total > 0 ? completed / total : 0)),
);
const done = $derived(total > 0 && completed >= total);
const label = $derived(
	`${completed} ${$t("challenges.dashboard_of")} ${total} ${$t("challenges.completed_short")}`,
);
</script>

<div
	class="donut"
	class:done
	style="width: {size}px; height: {size}px;"
	role="img"
	aria-label={label}
>
	<svg viewBox="0 0 {size} {size}" width={size} height={size} aria-hidden="true">
		<circle class="track" cx={size / 2} cy={size / 2} r={radius} fill="none" />
		<circle
			class="fill"
			cx={size / 2}
			cy={size / 2}
			r={radius}
			fill="none"
			stroke-dasharray={circumference}
			stroke-dashoffset={offset}
			transform="rotate(-90 {size / 2} {size / 2})"
		/>
	</svg>
	<span class="value num" aria-hidden="true">{completed}/{total}</span>
</div>

<style>
.donut {
	position: relative;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}

.track {
	stroke: var(--donut-track, var(--color-track));
	stroke-width: var(--donut-track-width, 5px);
}

.fill {
	stroke: var(--donut-fill, var(--color-progress));
	stroke-width: 5px;
	transition: stroke-dashoffset 0.6s ease;
}

.done .fill {
	stroke: var(--donut-done, var(--color-win));
}

.value {
	position: absolute;
	inset: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 17px;
	color: var(--donut-ink, var(--color-ink));
}

/* B: rounded ends, like the pill progress bars. */
:global([data-variant="b"]) .fill {
	stroke-linecap: round;
}
</style>
