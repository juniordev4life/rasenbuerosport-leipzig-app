<script>
import { getTranslate } from "@tolgee/svelte";
import BarChartIcon from "$lib/components/icons/BarChartIcon.svelte";
import Section from "$lib/components/ui/Section.svelte";

/**
 * "Karriere-Statistiken": six career-wide numbers in a 2 × 3 grid —
 * goals, assists, longest win streak, hat-tricks, highest win and peak
 * ELO. Missing values show an em dash instead of hiding the tile. The
 * two record tiles stand out: red numbers in design A, pale gold tiles
 * in B.
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

function perGame(v) {
	return v != null ? `${fmtNum(v, 2)} ${$t("profile.lifetime.per_game")}` : "—";
}

const tiles = $derived([
	{
		key: "goals",
		label: $t("profile.lifetime.total_goals"),
		value: fmt(stats.totalGoals),
		meta: perGame(stats.goalsPerGame),
	},
	{
		key: "assists",
		label: $t("profile.lifetime.total_assists"),
		value: fmt(stats.totalAssists),
		meta: perGame(stats.assistsPerGame),
	},
	{
		key: "streak",
		label: $t("profile.lifetime.longest_streak"),
		value: fmt(stats.longestWinStreak),
		meta: $t("profile.lifetime.streak_meta"),
	},
	{
		key: "hattricks",
		label: $t("profile.lifetime.hattricks"),
		value: fmt(stats.hattricks),
		meta: $t("profile.lifetime.hattrick_meta"),
	},
	{
		key: "highest",
		label: $t("profile.lifetime.highest_win"),
		value: stats.highestWin?.score ?? "—",
		meta: stats.highestWin
			? `${$t("profile.lifetime.vs")} ${stats.highestWin.opponentName} · ${stats.highestWin.date}`
			: "—",
		record: true,
	},
	{
		key: "peak",
		label: $t("profile.lifetime.peak_elo"),
		value: stats.peakElo?.value ?? "—",
		meta: stats.peakElo ? `Peak · ${stats.peakElo.date}` : "—",
		record: true,
	},
]);
</script>

<Section title={$t("profile.lifetime_section")}>
	{#snippet icon()}<BarChartIcon size={22} strokeWidth={2} />{/snippet}
	<dl class="grid">
		{#each tiles as tile (tile.key)}
			<div class="tile-stat" class:record={tile.record}>
				<dt class="label stat-label">{tile.label}</dt>
				<dd class="stat-body">
					<span class="num stat-value">{tile.value}</span>
					<span class="stat-meta">{tile.meta}</span>
				</dd>
			</div>
		{/each}
	</dl>
</Section>

<style>
.grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 10px;
	margin: 0;
}

/* ── Design A: each number on its own white card ────────────────────── */
.tile-stat {
	display: flex;
	flex-direction: column;
	gap: 8px;
	min-width: 0;
	padding: 14px;
	border-radius: var(--radius-card);
	background: var(--color-surface);
	box-shadow: var(--shadow-card);
}

.stat-label {
	color: var(--color-muted);
}

.stat-body {
	display: flex;
	flex-direction: column;
	gap: 8px;
	margin: 0;
}

.stat-value {
	font-size: 36px;
	line-height: 0.85;
	overflow-wrap: anywhere;
}

.record .stat-value {
	color: var(--color-brand);
}

.stat-meta {
	font-size: 12px;
	line-height: 1.3;
	color: var(--color-muted);
}

/* ── Design B: pale tiles on the section card ───────────────────────── */
:global([data-variant="b"]) .tile-stat {
	gap: 4px;
	padding: 12px;
	border-radius: var(--radius-tile);
	background: var(--color-win-soft);
	box-shadow: none;
}

:global([data-variant="b"]) .tile-stat.record {
	background: var(--color-gold-soft);
}

:global([data-variant="b"]) .stat-body {
	gap: 4px;
}

:global([data-variant="b"]) .stat-value {
	font-size: 32px;
	line-height: 1.05;
}

:global([data-variant="b"]) .record .stat-value {
	color: var(--color-ink);
}
</style>
