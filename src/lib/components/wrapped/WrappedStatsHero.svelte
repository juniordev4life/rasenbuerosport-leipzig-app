<script>
import { getTranslate } from "@tolgee/svelte";

/**
 * Wrapped's stats hero — the dezent red-glow card at the top of the
 * page showing total games and total goals for the week. The spec
 * explicitly drops the loud red branding of the old design in favour
 * of a subtle radial-gradient + 2px top accent line.
 *
 * @type {{ totals: { total_games?: number, total_goals?: number } | null }}
 */
let { totals } = $props();

const { t } = getTranslate();
</script>

<div class="stats-hero">
	<div class="stats-hero-label">{$t("wrapped.hero.label")}</div>
	<div class="stats-hero-row">
		<div class="stats-hero-stat">
			<div class="stats-hero-num">{totals?.total_games ?? 0}</div>
			<div class="stats-hero-unit">{$t("wrapped.hero.games")}</div>
		</div>
		<div class="stats-hero-stat">
			<div class="stats-hero-num">{totals?.total_goals ?? 0}</div>
			<div class="stats-hero-unit">{$t("wrapped.hero.goals")}</div>
		</div>
	</div>
</div>

<style>
	.stats-hero {
		background:
			radial-gradient(
				ellipse at top right,
				rgba(226, 75, 74, 0.14) 0%,
				transparent 60%
			),
			linear-gradient(180deg, #1a1f2a 0%, #131822 100%);
		border: 1px solid rgba(226, 75, 74, 0.22);
		border-radius: 18px;
		padding: 18px;
		position: relative;
		overflow: hidden;
		margin-bottom: 16px;
		color: #e5e7eb;
	}
	.stats-hero::before {
		content: "";
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 2px;
		background: linear-gradient(
			90deg,
			transparent,
			rgba(226, 75, 74, 0.55) 50%,
			transparent
		);
		opacity: 0.7;
	}
	.stats-hero-label {
		font-size: 10px;
		font-weight: 800;
		color: rgba(226, 75, 74, 0.85);
		text-transform: uppercase;
		letter-spacing: 0.14em;
		margin-bottom: 12px;
	}
	.stats-hero-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 16px;
	}
	.stats-hero-stat {
		display: flex;
		flex-direction: column;
	}
	.stats-hero-num {
		font-size: 32px;
		font-weight: 800;
		color: white;
		letter-spacing: -0.02em;
		line-height: 1;
		font-variant-numeric: tabular-nums;
	}
	.stats-hero-unit {
		font-size: 10px;
		font-weight: 700;
		color: #9ca3af;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		margin-top: 4px;
	}
</style>
