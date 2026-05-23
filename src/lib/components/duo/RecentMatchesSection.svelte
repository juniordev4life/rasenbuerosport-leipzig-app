<script>
import { getTranslate } from "@tolgee/svelte";

/**
 * Recent-matches list for the duo — five rows max. Each row carries a
 * win/loss result pill, opponent names, date, score and an ELO delta
 * (when available from `game.elo_snapshot`).
 *
 * @type {{
 *   matches: Array<{
 *     id: string,
 *     result: "W"|"L"|"D",
 *     opponentNames: string,
 *     dateLabel: string,
 *     score: string,
 *     eloDelta: number|null,
 *   }>,
 * }}
 */
let { matches } = $props();

const { t } = getTranslate();
</script>

{#if matches.length > 0}
	<div class="section-card">
		<div class="section-header">
			<div class="section-label">⏱ {$t("duo.recent_section")}</div>
		</div>
		<div class="matches-list">
			{#each matches as m (m.id)}
				<div class="match-row">
					<div class="match-result-pill {m.result === 'W' ? 'win' : m.result === 'L' ? 'loss' : 'draw'}">
						{m.result === "W" ? $t("duo.w_short") : m.result === "L" ? $t("duo.l_short") : $t("duo.d_short")}
					</div>
					<div class="match-info">
						<div class="match-headline">vs. {m.opponentNames}</div>
						<div class="match-meta">{m.dateLabel}</div>
					</div>
					<div class="match-score-mini {m.result === 'W' ? 'win' : m.result === 'L' ? 'loss' : ''}">
						{m.score}
					</div>
					{#if m.eloDelta != null}
						{@const d = Math.round(m.eloDelta)}
						<div class="match-elo-mini {d > 0 ? 'up' : d < 0 ? 'down' : ''}">
							{d > 0 ? `↑ +${d}` : d < 0 ? `↓ ${d}` : "± 0"}
						</div>
					{/if}
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
.section-header { margin-bottom: 6px; }
.section-label {
	font-size: 10px;
	text-transform: uppercase; letter-spacing: 0.1em;
	color: #6B7280;
	font-weight: 700;
}
.matches-list { display: flex; flex-direction: column; }
.match-row {
	display: flex; align-items: center;
	gap: 10px;
	padding: 10px 0;
	border-bottom: 1px solid #1F2937;
}
.match-row:last-child { border-bottom: none; }
.match-result-pill {
	width: 22px; height: 22px;
	border-radius: 50%;
	display: flex; align-items: center; justify-content: center;
	font-size: 10px; font-weight: 800;
	flex-shrink: 0;
}
.match-result-pill.win {
	background: rgba(132, 204, 22, 0.15);
	color: #84CC16;
	border: 1.5px solid rgba(132, 204, 22, 0.4);
}
.match-result-pill.loss {
	background: rgba(226, 75, 74, 0.15);
	color: #E24B4A;
	border: 1.5px solid rgba(226, 75, 74, 0.4);
}
.match-result-pill.draw {
	background: rgba(156, 163, 175, 0.15);
	color: #9CA3AF;
	border: 1.5px solid rgba(156, 163, 175, 0.4);
}
.match-info { flex: 1; min-width: 0; }
.match-headline {
	font-size: 12px;
	font-weight: 600;
	color: #E5E7EB;
	overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.match-meta { font-size: 10px; color: #6B7280; margin-top: 2px; }
.match-score-mini {
	font-size: 14px;
	font-weight: 800;
	font-variant-numeric: tabular-nums;
	flex-shrink: 0;
	color: #E5E7EB;
}
.match-score-mini.win { color: #84CC16; }
.match-score-mini.loss { color: #E24B4A; }
.match-elo-mini {
	font-size: 10px;
	font-weight: 700;
	font-variant-numeric: tabular-nums;
	flex-shrink: 0;
	min-width: 42px;
	text-align: right;
	color: #6B7280;
}
.match-elo-mini.up { color: #84CC16; }
.match-elo-mini.down { color: #E24B4A; }
</style>
