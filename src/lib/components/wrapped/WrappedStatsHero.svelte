<script>
import { getTranslate } from "@tolgee/svelte";

/**
 * Wrapped's week totals — games and goals played in the office this
 * week. Design A: big white display numbers in the red hero band, split
 * by hairlines like the home page's week stats. Design B: a white
 * sticker card with two pale green tiles.
 *
 * @type {{ totals: { total_games?: number, total_goals?: number } | null }}
 */
let { totals } = $props();

const { t } = getTranslate();
</script>

<div class="stats-hero">
	<p class="kicker">{$t("wrapped.hero.label")}</p>
	<dl class="stats">
		<div class="stat">
			<dt class="unit">{$t("wrapped.hero.games")}</dt>
			<dd class="num value">{totals?.total_games ?? 0}</dd>
		</div>
		<div class="stat">
			<dt class="unit">{$t("wrapped.hero.goals")}</dt>
			<dd class="num value">{totals?.total_goals ?? 0}</dd>
		</div>
	</dl>
</div>

<style>
/* ── Design A: in the red hero band ─────────────────────────────────── */
.stats-hero {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.kicker {
	margin: 0;
	font-family: var(--font-cond);
	font-weight: 700;
	font-size: 14px;
	letter-spacing: 0.03em;
	text-transform: uppercase;
}

.stats {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	margin: 0;
	padding-top: 16px;
	border-top: 1px solid currentColor;
}

/* Value above its label, label first for screen readers. */
.stat {
	display: flex;
	flex-direction: column-reverse;
	justify-content: flex-end;
	gap: 8px;
	min-width: 0;
}

.stat + .stat {
	padding-left: 16px;
	border-left: 1px solid currentColor;
}

.value {
	margin: 0;
	font-size: 64px;
	line-height: 0.85;
}

.unit {
	font-family: var(--font-cond);
	font-weight: 700;
	font-size: 13px;
	letter-spacing: 0.03em;
	text-transform: uppercase;
}

/* ── Design B: a white sticker card with green tiles ─────────────────── */
:global([data-variant="b"]) .stats-hero {
	padding: 18px;
	background: var(--color-surface);
	color: var(--color-ink);
	border-radius: var(--radius-card);
	box-shadow: var(--shadow-card);
}

:global([data-variant="b"]) .kicker {
	font-family: var(--font-sans);
	font-size: 13px;
	letter-spacing: 0;
	text-transform: none;
	color: var(--color-muted);
}

:global([data-variant="b"]) .stats {
	gap: 8px;
	padding-top: 0;
	border-top: 0;
}

:global([data-variant="b"]) .stat {
	align-items: center;
	gap: 4px;
	padding: 12px 10px;
	border-radius: var(--radius-tile);
	background: var(--color-win-soft);
}

:global([data-variant="b"]) .stat + .stat {
	padding-left: 10px;
	border-left: 0;
}

:global([data-variant="b"]) .value {
	font-size: 44px;
	line-height: 1;
	color: var(--color-win);
}

:global([data-variant="b"]) .unit {
	font-family: var(--font-sans);
	font-weight: 400;
	letter-spacing: 0;
	text-transform: none;
	color: var(--color-muted);
}
</style>
