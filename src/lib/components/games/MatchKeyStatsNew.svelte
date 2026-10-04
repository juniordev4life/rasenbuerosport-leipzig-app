<script>
import { getTranslate } from "@tolgee/svelte";
import BarChartIcon from "$lib/components/icons/BarChartIcon.svelte";
import Section from "$lib/components/ui/Section.svelte";
import {
	formatStatValue,
	getHeadlineKpis,
	statBarShares,
	statWinner,
} from "$lib/utils/matchKpis.utils.js";

/**
 * "Wichtigste Zahlen": the four headline KPIs as a 2×2 grid of tiles.
 * Each tile shows the label, home value left and away value right (the
 * leading side in its team colour — home red, away navy — the other one
 * muted) and a split bar in the two team colours.
 * Design A: small white cards on the page. Design B: grey tiles inside
 * the section card.
 *
 * @type {{ matchStats: object|null, class?: string }}
 */
let { matchStats, class: className = "" } = $props();

const { t } = getTranslate();

const kpis = $derived(getHeadlineKpis(matchStats));
</script>

{#if kpis.length > 0}
	<Section title={$t("game_detail.section.kpis")} class={className}>
		{#snippet icon()}<BarChartIcon size={22} strokeWidth={2} />{/snippet}
		<div class="kpis">
			{#each kpis as kpi (kpi.key)}
				{@const winner = statWinner(kpi.home, kpi.away)}
				{@const shares = statBarShares(kpi.home, kpi.away)}
				<div class="kpi">
					<span class="label kpi-label">{$t(kpi.labelKey)}</span>
					<div class="values">
						<span
							class="num val home"
							class:winner={winner === "home"}
							class:loser={winner === "away"}
						>
							{formatStatValue(kpi.home, kpi.decimals)}{kpi.unit}
						</span>
						<span
							class="num val away"
							class:winner={winner === "away"}
							class:loser={winner === "home"}
						>
							{formatStatValue(kpi.away, kpi.decimals)}{kpi.unit}
						</span>
					</div>
					<div class="split" aria-hidden="true">
						<span class="part home" style:flex-grow={shares.home}></span>
						<span class="part away" style:flex-grow={shares.away}></span>
					</div>
				</div>
			{/each}
		</div>
	</Section>
{/if}

<style>
.kpis {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 10px;
}

.kpi {
	display: flex;
	flex-direction: column;
	gap: 8px;
	min-width: 0;
	padding: 14px;
	border-radius: var(--radius-card);
	background: var(--color-surface);
	box-shadow: var(--shadow-card);
}

.kpi-label {
	color: var(--color-muted);
}

.values {
	display: flex;
	align-items: baseline;
	justify-content: space-between;
	gap: 8px;
}

.val {
	font-size: 26px;
	white-space: nowrap;
}

.val.loser {
	color: var(--color-muted);
}

.val.home.winner {
	color: var(--color-home);
}

.val.away.winner {
	color: var(--color-away);
}

.split {
	display: flex;
	gap: 2px;
	height: var(--bar-height);
}

.part {
	flex-basis: 0;
	min-width: 0;
	border-radius: var(--radius-bar);
}

.part.home {
	background: var(--color-home);
}

.part.away {
	background: var(--color-away);
}

/* Design B: grey tiles inside the section card. */
:global([data-variant="b"]) .kpi {
	padding: 12px;
	border-radius: var(--radius-tile);
	background: var(--color-sunken);
	box-shadow: none;
}
</style>
