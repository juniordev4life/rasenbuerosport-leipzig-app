<script>
import { getTranslate } from "@tolgee/svelte";

/**
 * Donut for the duo's chemistry score (0–100). Without a score
 * (lifecycle "fresh" or "finding") it shows a dashed ring with "—" and
 * the note that chemistry unlocks at 10 matches.
 *
 * Design A: a white ring in the red hero band (it takes the text
 * colour). Design B: a green ring on its pale track in the white card.
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
	if (trendDelta < 0)
		return `↓ −${Math.abs(trendDelta)} ${$t("duo.last_month")}`;
	return `±0 ${$t("duo.last_month")}`;
});
</script>

<div class="chem">
	{#if isPending}
		<div class="dial pending">
			<span class="num chem-value">—</span>
			<span class="chem-label">{$t("duo.chemistry_label")}</span>
		</div>
		<p class="chem-note">{$t("duo.chemistry_pending_sub")}</p>
	{:else}
		<div class="dial">
			<svg class="donut" viewBox="0 0 100 100" aria-hidden="true">
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
			<span class="inner">
				<span class="num chem-value">{score}</span>
				<span class="chem-label">{$t("duo.chemistry_label")}</span>
			</span>
		</div>
		{#if trendText}
			<p class="chem-note">{trendText}</p>
		{/if}
		{#if rankInfo}
			<p class="chem-note">{rankInfo}</p>
		{/if}
	{/if}
</div>

<style>
/* ── Design A: white on the red band ────────────────────────────────── */
.chem {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8px;
	width: 112px;
	flex-shrink: 0;
	text-align: center;
}

.dial {
	position: relative;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	width: 96px;
	height: 96px;
}

.pending {
	border: 2px dashed currentColor;
	border-radius: 999px;
}

.donut {
	position: absolute;
	inset: 0;
	width: 100%;
	height: 100%;
	transform: rotate(-90deg);
}

.track {
	fill: none;
	stroke: color-mix(in srgb, currentColor 28%, transparent);
	stroke-width: 8;
}

.fill {
	fill: none;
	stroke: currentColor;
	stroke-width: 8;
	stroke-linecap: round;
	transition: stroke-dashoffset 0.6s ease;
}

.inner {
	position: relative;
	display: flex;
	flex-direction: column;
	align-items: center;
}

.chem-value {
	font-size: 32px;
	line-height: 0.9;
}

.chem-label {
	margin-top: 4px;
	font-family: var(--font-cond);
	font-weight: 700;
	font-size: 11px;
	letter-spacing: 0.04em;
	text-transform: uppercase;
}

.chem-note {
	margin: 0;
	font-size: 12px;
	line-height: 1.35;
}

/* ── Design B: green ring on the white card ─────────────────────────── */
:global([data-variant="b"]) .pending {
	border-color: var(--color-line);
	color: var(--color-muted);
}

:global([data-variant="b"]) .track {
	stroke: var(--color-track);
}

:global([data-variant="b"]) .fill {
	stroke: var(--color-progress);
}

:global([data-variant="b"]) .chem-value {
	font-size: 30px;
	line-height: 1;
}

:global([data-variant="b"]) .chem-label {
	font-family: var(--font-sans);
	letter-spacing: 0;
	text-transform: none;
	color: var(--color-muted);
}

:global([data-variant="b"]) .chem-note {
	color: var(--color-muted);
}
</style>
