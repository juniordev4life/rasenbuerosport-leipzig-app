<script>
import { getTranslate } from "@tolgee/svelte";
import {
	formatStatValue,
	getHeadlineKpis,
	statBarShares,
	statWinner,
} from "$lib/utils/matchKpis.utils.js";

/**
 * 2×2 grid with the four headline match KPIs. Each card shows the
 * label, the two values (winner side in the team colour) and a small
 * split bar — winner side saturated, loser side faded.
 *
 * @type {{ matchStats: object|null }}
 */
let { matchStats } = $props();

const { t } = getTranslate();

const kpis = $derived(getHeadlineKpis(matchStats));
</script>

{#if kpis.length > 0}
	<div class="grid">
		{#each kpis as kpi (kpi.key)}
			{@const winner = statWinner(kpi.home, kpi.away)}
			{@const shares = statBarShares(kpi.home, kpi.away)}
			<div class="card">
				<div class="label">{$t(kpi.labelKey)}</div>
				<div class="values">
					<span class="val home" class:winner={winner === "home"}>
						{formatStatValue(kpi.home, kpi.decimals)}{kpi.unit}
					</span>
					<span class="val away" class:winner={winner === "away"}>
						{formatStatValue(kpi.away, kpi.decimals)}{kpi.unit}
					</span>
				</div>
				<div class="bar">
					<div
						class="bar-left"
						class:winner={winner === "home"}
						style="width: {shares.home}%;"
					></div>
					<div
						class="bar-right"
						class:winner={winner === "away"}
						style="width: {shares.away}%;"
					></div>
				</div>
			</div>
		{/each}
	</div>
{/if}

<style>
.grid {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 8px;
}
.card {
	background: #131822;
	border: 1px solid #1F2937;
	border-radius: 12px;
	padding: 11px;
}
.label {
	font-size: 9px;
	text-transform: uppercase;
	letter-spacing: 0.08em;
	color: #6B7280;
	font-weight: 700;
	margin-bottom: 8px;
}
.values {
	display: flex; justify-content: space-between;
	font-size: 18px;
	font-weight: 800;
	font-variant-numeric: tabular-nums;
	margin-bottom: 6px;
}
.val { color: #9CA3AF; }
.val.home.winner { color: #E24B4A; }
.val.away.winner { color: #84CC16; }
.bar {
	display: flex;
	height: 4px;
	border-radius: 2px;
	overflow: hidden;
	background: rgba(255,255,255,0.04);
}
.bar-left {
	height: 100%;
	background: rgba(226, 75, 74, 0.35);
}
.bar-left.winner { background: #E24B4A; }
.bar-right {
	height: 100%;
	background: rgba(132, 204, 22, 0.35);
}
.bar-right.winner { background: #84CC16; }
</style>
