<script>
import { getTranslate } from "@tolgee/svelte";
import UsersIcon from "$lib/components/icons/UsersIcon.svelte";
import Section from "$lib/components/ui/Section.svelte";
import SophieCard from "./SophieCard.svelte";

/**
 * Beitragsverteilung: one split bar per figure (goals, assists, …)
 * showing each player's share, with both values printed by name, plus
 * an optional Sophie synthesis underneath. Player 1 is
 * `--color-chart-1`, player 2 `--color-chart-4`.
 *
 * @type {{
 *   player1: { player_id: string, username: string },
 *   player2: { player_id: string, username: string },
 *   rows: Array<{ label: string, value1: number, value2: number, format?: (n: number) => string }>,
 *   synthesisQuote?: string|null,
 * }}
 */
let { player1, player2, rows, synthesisQuote = null } = $props();

const { t } = getTranslate();

function shareOf(a, b) {
	const total = (a ?? 0) + (b ?? 0);
	if (total === 0) return 50;
	return Math.round(((a ?? 0) / total) * 100);
}

function fmtValue(row, n) {
	return row.format ? row.format(n ?? 0) : String(n ?? 0);
}
</script>

<Section title={$t("duo.contribution_section")}>
	{#snippet icon()}<UsersIcon size={22} strokeWidth={2} />{/snippet}
	<div class="card contrib-card">
		{#each rows as row, i (i)}
			{@const share1 = shareOf(row.value1, row.value2)}
			<div class="contrib">
				<div class="contrib-head">
					<span class="label contrib-name">{row.label}</span>
					<span class="contrib-values">
						<span class="value-1">{player1.username} {fmtValue(row, row.value1)}</span>
						<span aria-hidden="true">·</span>
						<span class="value-2">{player2.username} {fmtValue(row, row.value2)}</span>
					</span>
				</div>
				<div class="contrib-bar" aria-hidden="true">
					<span class="share share-1" style:width="{share1}%"></span>
					<span class="share share-2" style:width="{100 - share1}%"></span>
				</div>
			</div>
		{/each}

		{#if synthesisQuote}
			<SophieCard quote={synthesisQuote} variant="compact" />
		{/if}
	</div>
</Section>

<style>
.contrib-card {
	display: flex;
	flex-direction: column;
	gap: 14px;
	padding: 16px;
}

.contrib-head {
	display: flex;
	align-items: baseline;
	justify-content: space-between;
	gap: 8px;
	margin-bottom: 6px;
}

.contrib-values {
	display: flex;
	flex-wrap: wrap;
	justify-content: flex-end;
	gap: 0 6px;
	font-size: 12px;
	font-variant-numeric: tabular-nums;
	color: var(--color-muted);
}

.value-1,
.value-2 {
	font-weight: 700;
}

.value-1 {
	color: var(--color-chart-1);
}

.value-2 {
	color: var(--color-chart-4);
}

.contrib-bar {
	display: flex;
	gap: 2px;
	height: var(--bar-height);
	overflow: hidden;
	border-radius: var(--radius-bar);
}

.share {
	height: 100%;
	transition: width 0.4s ease;
}

.share-1 {
	background: var(--color-chart-1);
}

.share-2 {
	background: var(--color-chart-4);
}
</style>
