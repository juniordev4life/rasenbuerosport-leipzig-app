<script>
import { getTranslate } from "@tolgee/svelte";
import ReporterBioModal from "$lib/components/games/ReporterBioModal.svelte";
import { getReporter } from "$lib/constants/reporters.constants.js";

/**
 * Frank's take on the signed-in player's week: a verdict picked from the
 * week's shape (empty / positive / negative / neutral) plus record, ELO
 * change and match count. Design A: the red hero band under the header.
 * Design B: a white card with a speech bubble and three stat tiles.
 * Tapping Frank opens the reporter bio used across the app.
 *
 * @type {{
 *   userName: string,
 *   wins: number,
 *   losses: number,
 *   matches: number,
 *   eloDelta: number,
 *   kalenderwoche: number,
 * }}
 */
let {
	userName = "",
	wins = 0,
	losses = 0,
	matches = 0,
	eloDelta = 0,
	kalenderwoche,
} = $props();

const { t } = getTranslate();

const frank = getReporter("euphoriker");
let bioOpen = $state(false);

function formatDelta(n) {
	const r = Math.round(n ?? 0);
	if (r > 0) return `+${r}`;
	if (r < 0) return `−${Math.abs(r)}`;
	return "±0";
}

const mood = $derived.by(() => {
	if (matches === 0) return "empty";
	if (eloDelta >= 10 || wins - losses >= 2) return "positive";
	if (eloDelta <= -10 || losses - wins >= 2) return "negative";
	return "neutral";
});

const headline = $derived($t(`home.frank.${mood}_headline`));
const text = $derived(
	$t(`home.frank.${mood}_text`, {
		name: userName,
		delta: formatDelta(eloDelta),
	}),
);
</script>

<section class="week hero bleed" aria-label={$t("home.frank.role")}>
	<div class="week-head">
		{#if frank}
			<button
				type="button"
				onclick={() => (bioOpen = true)}
				class="frank"
				aria-label={frank.name}
			>
				<img src={frank.imageUrl} alt="" loading="lazy" />
			</button>
		{/if}
		<div class="flex flex-col gap-0.5 flex-1 min-w-0">
			<span class="who">Frank</span>
			<span class="role">{$t("home.frank.role")}</span>
		</div>
		<span class="kw" aria-label="KW {kalenderwoche}">
			<span class="kw-label" aria-hidden="true">KW</span>
			<span class="kw-num" aria-hidden="true">{kalenderwoche}</span>
		</span>
	</div>

	<div class="verdict">
		<p class="verdict-headline">{headline}</p>
		<p class="verdict-text">{text}</p>
	</div>

	<dl class="stats">
		<div class="stat">
			<dt class="stat-label">{$t("home.frank.record")}</dt>
			<dd class="stat-value">{wins}:{losses}</dd>
		</div>
		<div class="stat">
			<dt class="stat-label">{$t("home.frank.elo_delta")}</dt>
			<dd class="stat-value">{formatDelta(eloDelta)}</dd>
		</div>
		<div class="stat">
			<dt class="stat-label">{$t("home.frank.matches")}</dt>
			<dd class="stat-value">{matches}</dd>
		</div>
	</dl>
</section>

{#if bioOpen && frank}
	<ReporterBioModal reporter={frank} onClose={() => (bioOpen = false)} />
{/if}

<style>
/* ── Design A: red hero band ─────────────────────────────────────────── */
.week {
	display: flex;
	flex-direction: column;
	gap: 18px;
	margin-top: -8px;
	padding-top: 24px;
	padding-bottom: 28px;
}

.week-head {
	display: flex;
	align-items: center;
	gap: 12px;
}

.frank {
	width: 48px;
	height: 48px;
	flex-shrink: 0;
	padding: 0;
	overflow: hidden;
	border-radius: var(--radius-avatar);
	background: var(--color-surface);
	cursor: pointer;
}

.frank img {
	width: 100%;
	height: 100%;
	object-fit: cover;
}

.who {
	font-family: var(--font-cond);
	font-weight: 700;
	font-size: 16px;
	letter-spacing: 0.03em;
	text-transform: uppercase;
}

.role {
	font-size: 13px;
}

.kw {
	width: 60px;
	height: 60px;
	flex-shrink: 0;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 2px;
	border-radius: 999px;
	box-shadow: inset 0 0 0 1px currentColor;
	font-family: var(--font-cond);
	font-weight: 700;
	line-height: 1;
}

.kw-label {
	font-size: 11px;
	letter-spacing: 0.03em;
}

.kw-num {
	font-size: 24px;
}

.verdict {
	display: flex;
	flex-direction: column;
	gap: 10px;
}

.verdict-headline {
	margin: 0;
	font-family: var(--font-display);
	font-size: 30px;
	line-height: 0.95;
	text-transform: uppercase;
	text-wrap: balance;
}

.verdict-text {
	margin: 0;
	font-size: 16px;
	line-height: 1.35;
}

.stats {
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	margin: 0;
	padding-top: 16px;
	border-top: 1px solid currentColor;
}

.stat {
	display: flex;
	flex-direction: column-reverse;
	justify-content: flex-end;
	gap: 6px;
	min-width: 0;
}

.stat + .stat {
	padding-left: 14px;
	border-left: 1px solid currentColor;
}

.stat-value {
	margin: 0;
	font-family: var(--font-num);
	font-weight: var(--num-weight);
	font-size: 30px;
	line-height: 0.85;
	font-variant-numeric: tabular-nums;
}

.stat-label {
	font-family: var(--font-cond);
	font-weight: 700;
	font-size: 12px;
	letter-spacing: 0.03em;
	text-transform: uppercase;
}

@media (min-width: 1024px) {
	.week {
		height: 100%;
		margin: 0;
		padding: 24px;
		border-radius: var(--radius-card);
	}
}

/* ── Design B: white card with a speech bubble ──────────────────────── */
:global([data-variant="b"]) .week {
	gap: 14px;
	margin-top: 0;
	padding: 18px;
	background: var(--color-surface);
	color: var(--color-ink);
	border-radius: var(--radius-card);
	box-shadow: var(--shadow-card);
}

:global([data-variant="b"]) .frank {
	width: 56px;
	height: 56px;
	box-shadow: 0 0 0 3px var(--color-gold);
}

:global([data-variant="b"]) .who {
	font-weight: 800;
	font-size: 21px;
	letter-spacing: 0;
	text-transform: none;
}

:global([data-variant="b"]) .role {
	color: var(--color-muted);
}

:global([data-variant="b"]) .kw {
	display: none;
}

:global([data-variant="b"]) .verdict {
	position: relative;
	display: block;
	padding: 14px 16px;
	border-radius: 16px;
	background: var(--color-gold-soft);
}

:global([data-variant="b"]) .verdict::before {
	content: "";
	position: absolute;
	left: 22px;
	top: -7px;
	width: 14px;
	height: 14px;
	background: var(--color-gold-soft);
	transform: rotate(45deg);
}

:global([data-variant="b"]) .verdict-headline,
:global([data-variant="b"]) .verdict-text {
	display: inline;
	font-family: var(--font-sans);
	font-size: 16px;
	line-height: 1.4;
	text-transform: none;
}

:global([data-variant="b"]) .verdict-headline {
	font-weight: 700;
}

:global([data-variant="b"]) .verdict-headline::after {
	content: " ";
}

:global([data-variant="b"]) .verdict-text {
	font-weight: 500;
}

:global([data-variant="b"]) .stats {
	gap: 8px;
	padding-top: 0;
	border-top: 0;
}

:global([data-variant="b"]) .stat {
	align-items: center;
	gap: 2px;
	padding: 10px;
	border: 0;
	border-radius: var(--radius-tile);
	background: var(--color-win-soft);
}

:global([data-variant="b"]) .stat-value {
	font-size: 26px;
	color: var(--color-win);
}

:global([data-variant="b"]) .stat-label {
	font-family: var(--font-sans);
	font-weight: 400;
	letter-spacing: 0;
	text-transform: none;
	color: var(--color-muted);
}
</style>
