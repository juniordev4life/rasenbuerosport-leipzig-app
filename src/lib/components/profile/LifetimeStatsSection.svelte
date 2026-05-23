<script>
import { getTranslate } from "@tolgee/svelte";

/**
 * 2×3 KPI grid of career-wide stats. Missing values are rendered as
 * an em-dash placeholder rather than the section being hidden.
 *
 * @type {{
 *   stats: {
 *     totalGoals: number|null,
 *     goalsPerGame: number|null,
 *     totalAssists: number|null,
 *     assistsPerGame: number|null,
 *     longestWinStreak: number|null,
 *     hattricks: number|null,
 *     highestWin: { score: string, opponentName: string, date: string }|null,
 *     peakElo: { value: number, date: string }|null,
 *   },
 * }}
 */
let { stats } = $props();

const { t } = getTranslate();

function fmt(v) {
	return v == null ? "—" : v;
}

function fmtNum(v, digits = 2) {
	if (v == null || !Number.isFinite(v)) return "—";
	return v.toFixed(digits).replace(".", ",");
}
</script>

<div class="section-card">
	<div class="section-header">
		<div class="section-label">{"\u{1F4CA}"} {$t("profile.lifetime_section")}</div>
	</div>

	<div class="kpi-row">
		<div class="kpi-card">
			<div class="kpi-label">{$t("profile.lifetime.total_goals")}</div>
			<div class="kpi-value">{fmt(stats.totalGoals)}</div>
			<div class="kpi-meta">
				{stats.goalsPerGame != null ? `${fmtNum(stats.goalsPerGame, 2)} ${$t("profile.lifetime.per_game")}` : "—"}
			</div>
		</div>
		<div class="kpi-card">
			<div class="kpi-label">{$t("profile.lifetime.total_assists")}</div>
			<div class="kpi-value">{fmt(stats.totalAssists)}</div>
			<div class="kpi-meta">
				{stats.assistsPerGame != null ? `${fmtNum(stats.assistsPerGame, 2)} ${$t("profile.lifetime.per_game")}` : "—"}
			</div>
		</div>
		<div class="kpi-card">
			<div class="kpi-label">{$t("profile.lifetime.longest_streak")}</div>
			<div class="kpi-value">{fmt(stats.longestWinStreak)}</div>
			<div class="kpi-meta">{$t("profile.lifetime.streak_meta")}</div>
		</div>
		<div class="kpi-card">
			<div class="kpi-label">{$t("profile.lifetime.hattricks")}</div>
			<div class="kpi-value">{fmt(stats.hattricks)}</div>
			<div class="kpi-meta">{$t("profile.lifetime.hattrick_meta")}</div>
		</div>
		<div class="kpi-card">
			<div class="kpi-label">{$t("profile.lifetime.highest_win")}</div>
			<div class="kpi-value">{stats.highestWin?.score ?? "—"}</div>
			<div class="kpi-meta">
				{#if stats.highestWin}
					{$t("profile.lifetime.vs")} {stats.highestWin.opponentName} · {stats.highestWin.date}
				{:else}
					—
				{/if}
			</div>
		</div>
		<div class="kpi-card">
			<div class="kpi-label">{$t("profile.lifetime.peak_elo")}</div>
			<div class="kpi-value">{stats.peakElo?.value ?? "—"}</div>
			<div class="kpi-meta">
				{#if stats.peakElo}
					Peak · {stats.peakElo.date}
				{:else}
					—
				{/if}
			</div>
		</div>
	</div>
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
.kpi-row {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 8px;
}
.kpi-card {
	background: rgba(0,0,0,0.2);
	border: 1px solid #1F2937;
	border-radius: 12px;
	padding: 12px;
}
.kpi-label {
	font-size: 9px;
	text-transform: uppercase; letter-spacing: 0.08em;
	color: #6B7280;
	font-weight: 700;
	margin-bottom: 6px;
}
.kpi-value {
	font-size: 22px; font-weight: 800;
	line-height: 1;
	color: #FFFFFF;
	font-variant-numeric: tabular-nums;
}
.kpi-meta {
	font-size: 10px;
	color: #6B7280;
	margin-top: 4px;
}
</style>
