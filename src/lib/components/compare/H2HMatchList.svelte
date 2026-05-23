<script>
import { getTranslate } from "@tolgee/svelte";

/**
 * List of recent direct duels between the two players. Each row carries
 * the date, both player initials with their accent colours, the
 * winner-coloured score and the per-player ELO movement.
 *
 * @type {{
 *   matches: Array<{
 *     id: string,
 *     date: string,
 *     scoreA: number,
 *     scoreB: number,
 *     eloDeltaA: number|null,
 *     eloDeltaB: number|null,
 *   }>,
 *   playerAName: string,
 *   playerBName: string,
 * }}
 */
let { matches = [], playerAName, playerBName } = $props();

const { t } = getTranslate();

const COLOR_A = "#F59E0B";
const COLOR_B = "#06B6D4";

function deltaText(d) {
	if (d == null) return "—";
	const r = Math.round(d);
	if (r > 0) return `↑ +${r}`;
	if (r < 0) return `↓ ${r}`;
	return "± 0";
}

function deltaClass(d) {
	if (d == null) return "flat";
	if (d > 0) return "up";
	if (d < 0) return "down";
	return "flat";
}
</script>

{#if matches.length > 0}
	<div class="section-card">
		<div class="section-header">
			<div class="section-label">⏱ {$t("compare.matches_section")}</div>
		</div>

		<div class="list">
			{#each matches as m (m.id)}
				{@const aWon = m.scoreA > m.scoreB}
				{@const bWon = m.scoreB > m.scoreA}
				<div class="row">
					<div class="date">{m.date}</div>
					<div class="line">
						<span class="name-a" style="color: {COLOR_A};">{playerAName}</span>
						<span class="score">
							<span class="num" style="color: {aWon ? COLOR_A : '#6B7280'};">{m.scoreA}</span>
							<span class="sep">:</span>
							<span class="num" style="color: {bWon ? COLOR_B : '#6B7280'};">{m.scoreB}</span>
						</span>
						<span class="name-b" style="color: {COLOR_B};">{playerBName}</span>
					</div>
					<div class="elo-line">
						<span class="elo-mini {deltaClass(m.eloDeltaA)}" style:--accent={COLOR_A}>{deltaText(m.eloDeltaA)}</span>
						<span class="dot">·</span>
						<span class="elo-mini {deltaClass(m.eloDeltaB)}" style:--accent={COLOR_B}>{deltaText(m.eloDeltaB)}</span>
					</div>
				</div>
			{/each}
		</div>
	</div>
{/if}

<style>
.section-card {
	background: #131822;
	border: 1px solid #1F2937;
	border-radius: 14px;
	padding: 14px;
}
.section-header { margin-bottom: 8px; }
.section-label {
	font-size: 10px;
	text-transform: uppercase; letter-spacing: 0.1em;
	color: #6B7280;
	font-weight: 700;
}
.list { display: flex; flex-direction: column; }
.row {
	padding: 10px 0;
	border-bottom: 1px solid #1F2937;
}
.row:last-child { border-bottom: none; }
.date {
	font-size: 10px;
	color: #6B7280;
	text-transform: uppercase;
	letter-spacing: 0.08em;
	font-weight: 700;
	margin-bottom: 4px;
}
.line {
	display: grid;
	grid-template-columns: 1fr auto 1fr;
	gap: 12px;
	align-items: baseline;
}
.name-a, .name-b {
	font-size: 12px; font-weight: 700;
	overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.name-a { text-align: right; }
.name-b { text-align: left; }
.score {
	display: flex; align-items: baseline; gap: 4px;
	font-variant-numeric: tabular-nums;
}
.score .num { font-size: 18px; font-weight: 800; }
.score .sep { font-size: 12px; color: #4B5563; }
.elo-line {
	display: flex; justify-content: center; gap: 10px;
	font-size: 10px;
	font-weight: 700;
	margin-top: 3px;
	font-variant-numeric: tabular-nums;
}
.elo-mini.up { color: #84CC16; }
.elo-mini.down { color: #E24B4A; }
.elo-mini.flat { color: #6B7280; }
.dot { color: #4B5563; }
</style>
