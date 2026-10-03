<script>
import { getTranslate } from "@tolgee/svelte";
import HistoryIcon from "$lib/components/icons/HistoryIcon.svelte";
import Section from "$lib/components/ui/Section.svelte";
import MarcelCard from "./MarcelCard.svelte";

/**
 * "Aktuelle Form": the last five results as S / U / N markers with the
 * ELO change over them, the ELO curve of those games with one dot per
 * result, and Marcel's compact take. Design A: the curve on a grey
 * panel. Design B: the curve chalked onto a little pitch.
 *
 * INVARIANT: `results` and `eloSeries` must describe the same matches in
 * the same order (oldest-first, left→right). The curve point at index
 * `i` is marked with `results[i]`, so a mismatched order inverts them.
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

const RESULT = {
	W: { key: "profile.w_short", cls: "result-w", tone: "win" },
	D: { key: "profile.d_short", cls: "result-d", tone: "draw" },
	L: { key: "profile.l_short", cls: "result-l", tone: "loss" },
};

const deltaText = $derived(
	eloDelta > 0
		? `+${eloDelta}`
		: eloDelta < 0
			? `−${Math.abs(eloDelta)}`
			: "±0",
);
const deltaTone = $derived(
	eloDelta > 0 ? "win" : eloDelta < 0 ? "loss" : "draw",
);

const PLOT_HEIGHT = 80;
const PLOT_INSET = 12;

/** Measured width of the plot, so the SVG never stretches its dots. */
let plotWidth = $state(300);
const width = $derived(Math.max(plotWidth, PLOT_INSET * 4));

const points = $derived.by(() => {
	if (!eloSeries.length) return [];
	const usable = width - PLOT_INSET * 2;
	if (eloSeries.length === 1) {
		return [{ x: width / 2, y: PLOT_HEIGHT / 2 }];
	}
	const min = Math.min(...eloSeries);
	const max = Math.max(...eloSeries);
	const range = max - min || 1;
	const stepX = usable / (eloSeries.length - 1);
	return eloSeries.map((value, i) => ({
		x: PLOT_INSET + i * stepX,
		y:
			PLOT_HEIGHT -
			PLOT_INSET -
			((value - min) / range) * (PLOT_HEIGHT - PLOT_INSET * 2),
	}));
});

const polyline = $derived(
	points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" "),
);
</script>

<Section title={$t("profile.form_section")}>
	{#snippet icon()}<HistoryIcon size={22} strokeWidth={2} />{/snippet}
	<div class="card body">
		<div class="top">
			<div class="results">
				{#each results as r, i (i)}
					<span class="result marker {RESULT[r]?.cls ?? 'result-d'}">
						{$t(RESULT[r]?.key ?? "profile.d_short")}
					</span>
				{/each}
			</div>
			<span class="delta delta-{deltaTone}">
				<span class="num delta-value">{deltaText}</span>
				<span class="delta-unit">ELO</span>
			</span>
		</div>

		{#if eloSeries.length > 0}
			<div class="curve">
				<div class="curve-head">
					<span>{$t("profile.elo_last_five")}</span>
					{#if eloStart != null && eloEnd != null}
						<span class="curve-range tone-{deltaTone}">{eloStart} → {eloEnd}</span>
					{/if}
				</div>
				<div class="plot">
					<div bind:clientWidth={plotWidth}>
						<svg
							viewBox="0 0 {width} {PLOT_HEIGHT}"
							width="100%"
							height={PLOT_HEIGHT}
							aria-hidden="true"
						>
							<!-- Pitch markings, shown in design B only. -->
							<g class="chalk">
								<rect x="1" y="1" width={width - 2} height={PLOT_HEIGHT - 2} rx="4" />
								<line x1={width / 2} y1="1" x2={width / 2} y2={PLOT_HEIGHT - 1} />
								<circle cx={width / 2} cy={PLOT_HEIGHT / 2} r="20" />
							</g>
							<line
								class="baseline"
								x1="0"
								y1={PLOT_HEIGHT - 0.5}
								x2={width}
								y2={PLOT_HEIGHT - 0.5}
							/>
							<polyline class="line" points={polyline} />
							{#each points as p, i (i)}
								<circle
									class="dot dot-{RESULT[results[i]]?.tone ?? 'draw'}"
									cx={p.x}
									cy={p.y}
									r="4"
								/>
							{/each}
						</svg>
					</div>
				</div>
			</div>
		{/if}

		<MarcelCard quote={marcelQuote} variant="compact" />
	</div>
</Section>

<style>
/* ── Design A ───────────────────────────────────────────────────────── */
.body {
	display: flex;
	flex-direction: column;
	gap: 14px;
	padding: 16px;
}

.top {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
}

.results {
	display: flex;
	gap: 4px;
}

.marker {
	width: 30px;
	height: 30px;
	font-size: 15px;
}

/* The change is the shared `.delta` (coloured in A, a pill in B); A sets
 * the figure big with "ELO" under it. */
.delta {
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	gap: 4px;
	flex-shrink: 0;
}

.delta-value {
	font-size: 26px;
	line-height: 0.8;
}

.delta-unit {
	font-family: var(--font-cond);
	font-weight: 700;
	font-size: 11px;
	letter-spacing: 0.03em;
}

.curve {
	display: flex;
	flex-direction: column;
	gap: 8px;
	padding: 12px;
	background: var(--color-sunken);
}

.curve-head {
	display: flex;
	justify-content: space-between;
	gap: 12px;
	font-family: var(--font-label);
	font-weight: var(--label-weight);
	font-size: 12px;
	letter-spacing: var(--label-tracking);
	text-transform: var(--label-case);
}

/* No change stays ink: the muted grey is too faint on the grey panel. */
.curve-range.tone-win {
	color: var(--color-win);
}

.curve-range.tone-loss {
	color: var(--color-loss);
}

.plot svg {
	display: block;
	overflow: visible;
}

.chalk {
	display: none;
}

.baseline {
	stroke: var(--color-line);
	stroke-width: 1;
}

.line {
	fill: none;
	stroke: var(--color-brand);
	stroke-width: 2.5;
	stroke-linejoin: round;
	stroke-linecap: round;
}

.dot-win {
	fill: var(--color-win);
}

.dot-loss {
	fill: var(--color-loss);
}

.dot-draw {
	fill: var(--color-muted);
}

/* ── Design B: a pill for the change, the curve on a small pitch ─────── */
:global([data-variant="b"]) .marker {
	width: 26px;
	height: 36px;
	font-size: 15px;
}

:global([data-variant="b"]) .results {
	gap: 8px;
}

:global([data-variant="b"]) .delta {
	flex-direction: row;
	align-items: baseline;
	gap: 4px;
	font-size: 14px;
}

:global([data-variant="b"]) .delta-value {
	font-family: inherit;
	font-weight: inherit;
	font-size: inherit;
	line-height: 1.2;
}

:global([data-variant="b"]) .delta-unit {
	font-size: inherit;
	letter-spacing: 0;
}

:global([data-variant="b"]) .curve {
	gap: 6px;
	padding: 0;
	background: transparent;
}

:global([data-variant="b"]) .curve-head {
	color: var(--color-muted);
}

:global([data-variant="b"]) .curve-range {
	color: var(--color-ink);
}

:global([data-variant="b"]) .plot {
	padding: 10px;
	border-radius: 14px;
	background: var(--color-pitch);
}

:global([data-variant="b"]) .chalk {
	display: inline;
	fill: none;
	stroke: var(--color-chalk);
	stroke-width: 2;
}

:global([data-variant="b"]) .baseline {
	display: none;
}

:global([data-variant="b"]) .line {
	stroke: var(--color-on-page);
	stroke-width: 3;
}

:global([data-variant="b"]) .dot {
	stroke: var(--color-on-page);
	stroke-width: 2;
}

:global([data-variant="b"]) .dot-draw {
	fill: var(--color-draw);
}
</style>
