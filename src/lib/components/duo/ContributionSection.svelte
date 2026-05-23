<script>
import { getTranslate } from "@tolgee/svelte";
import { avatarGradient } from "$lib/utils/avatarColor.utils.js";
import SophieCard from "./SophieCard.svelte";

/**
 * Beitragsverteilung: 4 split-bar rows for goals / assists / overall
 * contribution / red cards, plus a Sophie synthesis card at the
 * bottom summarising the distribution.
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

const g1 = $derived(avatarGradient(player1.player_id));
const g2 = $derived(avatarGradient(player2.player_id));

function shareOf(a, b) {
	const total = (a ?? 0) + (b ?? 0);
	if (total === 0) return 50;
	return Math.round(((a ?? 0) / total) * 100);
}

function fmtValue(row, n) {
	return row.format ? row.format(n ?? 0) : String(n ?? 0);
}
</script>

<div class="section-card">
	<div class="section-header">
		<div class="section-label">⚖ {$t("duo.contribution_section")}</div>
	</div>

	{#each rows as row, i (i)}
		{@const share1 = shareOf(row.value1, row.value2)}
		<div class="contrib-row">
			<div class="contrib-header">
				<div class="contrib-name">{row.label}</div>
				<div class="contrib-values">
					<span class="player1-val" style="color: {g1.from};">{player1.username} {fmtValue(row, row.value1)}</span>
					<span class="divider">·</span>
					<span class="player2-val" style="color: {g2.from};">{player2.username} {fmtValue(row, row.value2)}</span>
				</div>
			</div>
			<div class="contrib-bar">
				<div class="contrib-fill" style="width: {share1}%; background: {g1.gradient};"></div>
				<div class="contrib-fill" style="width: {100 - share1}%; background: {g2.gradient};"></div>
			</div>
		</div>
	{/each}

	{#if synthesisQuote}
		<div class="synthesis-wrap">
			<SophieCard quote={synthesisQuote} variant="compact" />
		</div>
	{/if}
</div>

<style>
.section-card {
	background: #131822;
	border: 1px solid #1F2937;
	border-radius: 14px;
	padding: 14px;
}
.section-header { margin-bottom: 14px; }
.section-label {
	font-size: 10px;
	text-transform: uppercase; letter-spacing: 0.1em;
	color: #6B7280;
	font-weight: 700;
}
.contrib-row { margin-bottom: 14px; }
.contrib-row:last-of-type { margin-bottom: 4px; }
.contrib-header {
	display: flex; justify-content: space-between;
	align-items: baseline;
	margin-bottom: 6px;
	gap: 8px;
}
.contrib-name {
	font-size: 12px;
	font-weight: 700;
	color: #E5E7EB;
}
.contrib-values {
	font-size: 11px;
	color: #6B7280;
	font-variant-numeric: tabular-nums;
}
.contrib-values .player1-val,
.contrib-values .player2-val { font-weight: 700; }
.contrib-values .divider { margin: 0 4px; color: #4B5563; }
.contrib-bar {
	height: 8px;
	border-radius: 4px;
	overflow: hidden;
	display: flex;
	background: rgba(255,255,255,0.04);
}
.contrib-fill { height: 100%; transition: width 0.4s ease; }
.synthesis-wrap { margin-top: 12px; }
</style>
