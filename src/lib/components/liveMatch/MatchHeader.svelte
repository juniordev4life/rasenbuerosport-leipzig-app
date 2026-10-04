<script>
import { getTranslate } from "@tolgee/svelte";
import TeamLogo from "$lib/components/ui/TeamLogo.svelte";

/**
 * Scoreboard at the top of the live match (and of the penalty
 * shootout): a badge, the two crests with their names and the running
 * score. Design A: the red hero band under the step bar, the score in
 * display type. Design B: a dark green scoreboard card with the digits
 * in gold tiles.
 *
 * `badge` replaces the default "LIVE" chip; `subtitle` adds a line
 * under the score (the shootout shows the score after extra time).
 *
 * @type {{
 *   homeTeam: { name: string, logo_url?: string|null }|null,
 *   awayTeam: { name: string, logo_url?: string|null }|null,
 *   scoreHome: number,
 *   scoreAway: number,
 *   badge?: import('svelte').Snippet,
 *   subtitle?: string,
 * }}
 */
let {
	homeTeam,
	awayTeam,
	scoreHome,
	scoreAway,
	badge,
	subtitle = "",
} = $props();

const { t } = getTranslate();
</script>

{#snippet teamSide(team, side)}
	<div class="team-side {side}">
		<span class="crest">
			<TeamLogo logoUrl={team?.logo_url} teamName={team?.name ?? "?"} size="md" />
		</span>
		<span class="team-name">{team?.name ?? "—"}</span>
	</div>
{/snippet}

<header class="live-hero hero bleed">
	<div class="badge-row">
		{#if badge}
			{@render badge()}
		{:else}
			<span class="chip live-chip">
				<span class="live-dot" aria-hidden="true"></span>
				{$t("live_match.live_pill")}
			</span>
		{/if}
	</div>

	<div class="score-row">
		{@render teamSide(homeTeam, "home")}

		<div class="score">
			<span class="digit">{scoreHome}</span>
			<span class="sep">:</span>
			<span class="digit">{scoreAway}</span>
		</div>

		{@render teamSide(awayTeam, "away")}
	</div>

	{#if subtitle}
		<p class="subtitle">{subtitle}</p>
	{/if}
</header>

<style>
/* ── Design A: red hero band ─────────────────────────────────────────── */
.live-hero {
	display: flex;
	flex-direction: column;
	gap: 14px;
	/* Under the wizard's step bar, which already cancels the top padding. */
	margin-top: 0;
	padding-top: 16px;
	padding-bottom: 20px;
}

.badge-row {
	display: flex;
	justify-content: center;
}

.live-chip {
	gap: 6px;
	padding: 3px 10px;
	background: var(--color-surface);
	color: var(--color-brand);
	font-family: var(--font-cond);
	font-size: 13px;
	letter-spacing: 0.03em;
}

.live-dot {
	width: 8px;
	height: 8px;
	border-radius: var(--radius-badge);
	background: currentColor;
	animation: live-pulse 1.4s ease-in-out infinite;
}

@keyframes live-pulse {
	50% {
		opacity: 0.35;
	}
}

.score-row {
	display: grid;
	grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
	align-items: center;
	gap: 10px;
}

.team-side {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8px;
	min-width: 0;
	text-align: center;
}

.crest {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 48px;
	height: 48px;
	flex-shrink: 0;
	overflow: hidden;
	background: var(--color-surface);
	border-radius: var(--radius-avatar);
}

.team-name {
	max-width: 100%;
	overflow: hidden;
	font-weight: 700;
	font-size: 14px;
	line-height: 1.25;
	text-overflow: ellipsis;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
}

.score {
	display: flex;
	align-items: center;
	gap: 8px;
	font-family: var(--font-num);
	font-weight: var(--num-weight);
	font-size: 60px;
	line-height: 0.85;
	font-variant-numeric: tabular-nums;
}

.subtitle {
	margin: -4px 0 0;
	font-size: 13px;
	text-align: center;
}

/* Desktop: the band becomes a rounded block in the content column. */
@media (min-width: 1024px) {
	.live-hero {
		margin: 0;
		padding: 18px 24px 22px;
		border-radius: var(--radius-card);
	}
}

/* ── Design B: dark green scoreboard card ───────────────────────────── */
:global([data-variant="b"]) .live-hero {
	gap: 10px;
	padding: 12px 16px 16px;
	background: var(--color-score);
	color: var(--color-on-score);
	border-radius: var(--radius-card);
	box-shadow: var(--shadow-card);
}

:global([data-variant="b"]) .live-chip {
	padding: 2px 10px;
	background: var(--color-brand);
	color: var(--color-on-brand);
	font-size: 12px;
}

:global([data-variant="b"]) .team-side {
	flex-direction: row;
	gap: 8px;
	text-align: left;
}

:global([data-variant="b"]) .team-side.away {
	flex-direction: row-reverse;
	text-align: right;
}

:global([data-variant="b"]) .crest {
	width: 44px;
	height: 44px;
}

:global([data-variant="b"]) .team-name {
	font-size: 13px;
}

:global([data-variant="b"]) .score {
	gap: 6px;
	font-size: 30px;
}

:global([data-variant="b"]) .digit {
	min-width: 46px;
	padding: 4px 8px;
	border-radius: 10px;
	background: color-mix(in srgb, var(--color-score) 70%, var(--color-ink));
	color: var(--color-gold);
	font-size: 42px;
	line-height: 1.05;
	text-align: center;
}

:global([data-variant="b"]) .subtitle {
	margin: 0;
	opacity: 0.85;
}
</style>
