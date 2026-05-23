<script>
import { getTranslate } from "@tolgee/svelte";
import {
	formatStatValue,
	getTopDetailStats,
	statWinner,
} from "$lib/utils/matchKpis.utils.js";

/**
 * Detail-stats panel — team-header in team colour (HOME left, AWAY
 * right), then "Top N" stat rows in a 50px/1fr/50px grid: winner side
 * value in the team colour, loser side muted grey, stat name centered.
 *
 * "Lower is better" keys (fouls, yellow_cards, red_cards, …) invert
 * the winner determination so the smaller value wins the colour.
 *
 * @type {{ matchStats: object|null, homeTeamLabel?: string, awayTeamLabel?: string, limit?: number }}
 */
let {
	matchStats,
	homeTeamLabel = null,
	awayTeamLabel = null,
	limit = 5,
} = $props();

const { t } = getTranslate();

const LOWER_IS_BETTER = new Set([
	"fouls",
	"yellow_cards",
	"red_cards",
	"dribbled_past",
	"offsides",
]);

const stats = $derived(getTopDetailStats(matchStats, limit));

function winnerFor(stat) {
	if (stat.home === stat.away) return null;
	if (LOWER_IS_BETTER.has(stat.key)) {
		return stat.home < stat.away ? "home" : "away";
	}
	return statWinner(stat.home, stat.away);
}
</script>

{#if stats.length > 0}
	<div class="card">
		<div class="team-header">
			<div class="team-label home">{homeTeamLabel ?? $t("match_hero.home_label")}</div>
			<div></div>
			<div class="team-label away">{awayTeamLabel ?? $t("match_hero.away_label")}</div>
		</div>

		<div class="rows">
			{#each stats as stat (stat.key)}
				{@const winner = winnerFor(stat)}
				<div class="row">
					<span
						class="val home"
						class:winner={winner === "home"}
						class:loser={winner === "away"}
					>
						{formatStatValue(stat.home, stat.decimals)}{stat.unit}
					</span>
					<span class="name">{$t(stat.labelKey)}</span>
					<span
						class="val away"
						class:winner={winner === "away"}
						class:loser={winner === "home"}
					>
						{formatStatValue(stat.away, stat.decimals)}{stat.unit}
					</span>
				</div>
			{/each}
		</div>
	</div>
{/if}

<style>
.card {
	background: #131822;
	border: 1px solid #1F2937;
	border-radius: 14px;
	padding: 12px 14px;
}
.team-header {
	display: grid;
	grid-template-columns: 60px 1fr 60px;
	gap: 8px;
	padding-bottom: 10px;
	border-bottom: 1px solid #1F2937;
	margin-bottom: 10px;
}
.team-label {
	font-size: 9px;
	font-weight: 800;
	text-transform: uppercase;
	letter-spacing: 0.08em;
	overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.team-label.home { color: #E24B4A; }
.team-label.away { color: #84CC16; text-align: right; }
.rows { display: flex; flex-direction: column; gap: 8px; }
.row {
	display: grid;
	grid-template-columns: 50px 1fr 50px;
	align-items: center;
	gap: 8px;
	font-size: 12px;
}
.val {
	font-weight: 800;
	font-variant-numeric: tabular-nums;
	color: #E5E7EB;
}
.val.home { text-align: left; }
.val.away { text-align: right; }
.val.home.winner { color: #E24B4A; }
.val.away.winner { color: #84CC16; }
.val.loser { color: #6B7280; }
.name {
	font-size: 10px;
	color: #9CA3AF;
	text-align: center;
	text-transform: uppercase;
	letter-spacing: 0.04em;
	font-weight: 600;
}
</style>
