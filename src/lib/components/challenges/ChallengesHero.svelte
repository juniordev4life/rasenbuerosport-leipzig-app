<script>
import { getTranslate } from "@tolgee/svelte";
import ClockIcon from "$lib/components/icons/ClockIcon.svelte";
import TargetIcon from "$lib/components/icons/TargetIcon.svelte";
import ProgressDonut from "./ProgressDonut.svelte";

/**
 * Top of the Challenges page: tag and countdown, title and subtitle, the
 * week's progress ring with a status line, and an optional slot below
 * (the page puts its Active / History tabs there).
 * Design A: the red hero band, everything in white. Design B: the title
 * on the pitch, a gold countdown pill and the progress in a white card.
 * From `lg` the top bar carries the title, so the hero drops it.
 *
 * @type {{
 *   completed: number,
 *   total: number,
 *   countdownText: string,
 *   statusHeadline: string,
 *   statusDetail: string,
 *   children?: import('svelte').Snippet,
 * }}
 */
let {
	completed = 0,
	total = 3,
	countdownText = "—",
	statusHeadline = "",
	statusDetail = "",
	children,
} = $props();

const { t } = getTranslate();
</script>

<header class="hero bleed ch-hero">
	<div class="top">
		<span class="tag">
			<TargetIcon size={16} strokeWidth={2} />
			{$t("challenges.hero_tag")}
		</span>
		<span class="chip countdown">
			<ClockIcon size={14} strokeWidth={2.2} />
			{$t("challenges.ends_in")}
			{countdownText}
		</span>
	</div>

	<h1 class="page-title page-hero-title">{$t("challenges.title")}</h1>

	<div class="panel">
		<p class="subtitle">{$t("challenges.subtitle")}</p>
		<div class="progress-row">
			<ProgressDonut {completed} {total} size={60} />
			<div class="min-w-0">
				<p class="status-headline">{statusHeadline}</p>
				<p class="status-detail">{statusDetail}</p>
			</div>
		</div>
	</div>

	{#if children}
		<div class="slot">{@render children()}</div>
	{/if}
</header>

<style>
/* ── Design A: red hero band ────────────────────────────────────────── */
.ch-hero {
	display: flex;
	flex-direction: column;
	gap: 14px;
	padding-top: 20px;
	padding-bottom: 20px;
}

.top {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
}

.tag {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	min-width: 0;
	font-family: var(--font-cond);
	font-weight: 700;
	font-size: 13px;
	letter-spacing: 0.03em;
	text-transform: uppercase;
}

.countdown {
	margin-left: auto;
	padding: 4px 9px;
	font-size: 12px;
	background: transparent;
	color: inherit;
	box-shadow: inset 0 0 0 1px currentColor;
	font-variant-numeric: tabular-nums;
}

.panel {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.subtitle {
	margin: 0;
	font-size: 15px;
	line-height: 1.35;
}

/* The ring in white on red: hairline track, bold arc. */
.progress-row {
	--donut-track: currentColor;
	--donut-track-width: 1px;
	--donut-fill: currentColor;
	--donut-done: currentColor;
	--donut-ink: currentColor;
	display: flex;
	align-items: center;
	gap: 14px;
	padding-top: 16px;
	border-top: 1px solid currentColor;
}

.status-headline {
	margin: 0;
	font-family: var(--font-display);
	font-size: 24px;
	line-height: 0.95;
	text-transform: uppercase;
}

.status-detail {
	margin: 6px 0 0;
	font-size: 14px;
	line-height: 1.35;
}

.slot {
	margin-top: 2px;
}

/* ── Design B: title on the pitch, progress in a white card ─────────── */
:global([data-variant="b"]) .ch-hero {
	gap: 12px;
	padding-top: 4px;
	padding-bottom: 0;
}

:global([data-variant="b"]) .tag {
	display: none;
}

/* Without the tag the countdown leads like a kicker above the title. */
:global([data-variant="b"]) .countdown {
	margin-left: 0;
	padding: 5px 12px;
	background: var(--color-gold);
	color: var(--color-on-gold);
	box-shadow: var(--shadow-control);
	font-size: 13px;
}

:global([data-variant="b"]) .panel {
	gap: 14px;
	padding: 18px;
	background: var(--color-surface);
	color: var(--color-ink);
	border-radius: var(--radius-card);
	box-shadow: var(--shadow-card);
}

:global([data-variant="b"]) .subtitle {
	font-size: 14px;
	color: var(--color-muted);
}

:global([data-variant="b"]) .progress-row {
	--donut-track: var(--color-track);
	--donut-track-width: 5px;
	--donut-fill: var(--color-progress);
	--donut-done: var(--color-win);
	--donut-ink: var(--color-ink);
	padding-top: 0;
	border-top: 0;
}

:global([data-variant="b"]) .status-headline {
	font-family: var(--font-cond);
	font-weight: 800;
	font-size: 21px;
	line-height: 1.1;
	text-transform: none;
}

:global([data-variant="b"]) .status-detail {
	margin-top: 2px;
	color: var(--color-muted);
}

/* Desktop: the top bar carries the title. In A the band becomes a red
 * card in the content column. */
@media (min-width: 1024px) {
	.ch-hero {
		margin: 0;
		padding: 24px;
		border-radius: var(--radius-card);
	}

	.page-hero-title {
		display: none;
	}

	:global([data-variant="b"]) .ch-hero {
		padding: 0;
		border-radius: 0;
	}
}
</style>
