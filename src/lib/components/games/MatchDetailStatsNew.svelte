<script>
import { getTranslate } from "@tolgee/svelte";
import BarChartIcon from "$lib/components/icons/BarChartIcon.svelte";
import Section from "$lib/components/ui/Section.svelte";
import {
	formatStatValue,
	getTopDetailStats,
	statWinner,
} from "$lib/utils/matchKpis.utils.js";

/**
 * "Detail-Statistiken": the Top N detail stats as a three-column table —
 * home value, stat name, away value — under a header with both team
 * names (home red, away navy). The leading value is set in its team
 * colour, the other one muted.
 *
 * "Lower is better" keys (fouls, yellow_cards, red_cards, …) invert
 * the winner determination so the smaller value wins the colour.
 *
 * @type {{ matchStats: object|null, homeTeamLabel?: string, awayTeamLabel?: string, limit?: number, class?: string }}
 */
let {
	matchStats,
	homeTeamLabel = null,
	awayTeamLabel = null,
	limit = 5,
	class: className = "",
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
	<Section title={$t("game_detail.section.detail_stats")} class={className}>
		{#snippet icon()}<BarChartIcon size={22} strokeWidth={2} />{/snippet}
		<div class="card table-card">
			<table class="stats">
				<thead>
					<tr>
						<th scope="col" class="label team home">
							{homeTeamLabel ?? $t("match_hero.home_label")}
						</th>
						<td></td>
						<th scope="col" class="label team away">
							{awayTeamLabel ?? $t("match_hero.away_label")}
						</th>
					</tr>
				</thead>
				<tbody>
					{#each stats as stat (stat.key)}
						{@const winner = winnerFor(stat)}
						<tr>
							<td
								class="num val home"
								class:winner={winner === "home"}
								class:loser={winner === "away"}
							>
								{formatStatValue(stat.home, stat.decimals)}{stat.unit}
							</td>
							<th scope="row" class="name">{$t(stat.labelKey)}</th>
							<td
								class="num val away"
								class:winner={winner === "away"}
								class:loser={winner === "home"}
							>
								{formatStatValue(stat.away, stat.decimals)}{stat.unit}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</Section>
{/if}

<style>
.table-card {
	padding: 6px 16px 4px;
}

.stats {
	width: 100%;
	border-collapse: collapse;
	table-layout: fixed;
}

.team {
	width: 30%;
	padding: 10px 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	border-bottom: 1px solid var(--color-line);
}

.team.home {
	color: var(--color-home);
	text-align: left;
}

.team.away {
	color: var(--color-away);
	text-align: right;
}

thead td {
	border-bottom: 1px solid var(--color-line);
}

tbody tr + tr > * {
	border-top: 1px solid var(--color-line);
}

.val,
.name {
	padding: 11px 0;
}

.val {
	font-size: 19px;
	white-space: nowrap;
}

.val.home {
	text-align: left;
}

.val.away {
	text-align: right;
}

.val.home.winner {
	color: var(--color-home);
}

.val.away.winner {
	color: var(--color-away);
}

.val.loser {
	color: var(--color-muted);
}

.name {
	padding-inline: 6px;
	color: var(--color-muted);
	font-weight: 500;
	font-size: 13px;
	line-height: 1.25;
	text-align: center;
}
</style>
