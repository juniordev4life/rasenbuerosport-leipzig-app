<script>
import { getTranslate } from "@tolgee/svelte";
import UsersIcon from "$lib/components/icons/UsersIcon.svelte";
import Section from "$lib/components/ui/Section.svelte";

/**
 * Split-bar comparison. Each row: player A's value left, the label in
 * the middle, player B's value right, and two bars beneath growing
 * outwards from the centre. The leading side shows its value and bar
 * in the player's colour (A `--color-chart-4`, B `--color-chart-1`) and
 * in bold; the other side stays muted. The printed values carry the
 * information, the colours only repeat it.
 *
 * For `lowerIsBetter` rows (red cards) the smaller value leads.
 *
 * @type {{
 *   rows: Array<{ label: string, valueA: number, valueB: number, format?: (n: number) => string, lowerIsBetter?: boolean }>,
 *   playerAName: string,
 *   playerBName: string,
 * }}
 */
let { rows = [], playerAName, playerBName } = $props();

const { t } = getTranslate();

function fmt(row, value) {
	return row.format ? row.format(value ?? 0) : String(value ?? 0);
}

function widths(row) {
	const a = Number(row.valueA ?? 0);
	const b = Number(row.valueB ?? 0);
	const max = Math.max(Math.abs(a), Math.abs(b), 1);
	return {
		a: Math.round((Math.abs(a) / max) * 100),
		b: Math.round((Math.abs(b) / max) * 100),
	};
}

function winnerSide(row) {
	const a = Number(row.valueA ?? 0);
	const b = Number(row.valueB ?? 0);
	if (a === b) return null;
	const aBetter = row.lowerIsBetter ? a < b : a > b;
	return aBetter ? "a" : "b";
}
</script>

{#if rows.length > 0}
	<Section title={$t("compare.stat_section")}>
		{#snippet icon()}<UsersIcon size={22} strokeWidth={2} />{/snippet}
		<div class="card stats-card">
			<div class="legend">
				<span class="name-a">{playerAName}</span>
				<span class="name-b">{playerBName}</span>
			</div>

			<ul class="stats">
				{#each rows as row, i (i)}
					{@const w = widths(row)}
					{@const winner = winnerSide(row)}
					<li class="stat">
						<div class="stat-head">
							<span class="val val-a" class:lead={winner === "a"}>{fmt(row, row.valueA)}</span>
							<span class="label stat-label">{row.label}</span>
							<span class="val val-b" class:lead={winner === "b"}>{fmt(row, row.valueB)}</span>
						</div>
						<div class="bars" aria-hidden="true">
							<span class="bar bar-a">
								<span class="fill fill-a" class:lead={winner === "a"} style:width="{w.a}%"></span>
							</span>
							<span class="bar bar-b">
								<span class="fill fill-b" class:lead={winner === "b"} style:width="{w.b}%"></span>
							</span>
						</div>
					</li>
				{/each}
			</ul>
		</div>
	</Section>
{/if}

<style>
.stats-card {
	--side-a: var(--color-chart-4);
	--side-b: var(--color-chart-1);
	display: flex;
	flex-direction: column;
	gap: 14px;
	padding: 16px;
}

.legend {
	display: flex;
	justify-content: space-between;
	gap: 12px;
	font-family: var(--font-cond);
	font-weight: 700;
	font-size: 14px;
	letter-spacing: 0.02em;
	text-transform: var(--label-case);
}

.name-a {
	color: var(--side-a);
}

.name-b {
	color: var(--side-b);
	text-align: right;
}

.stats {
	display: flex;
	flex-direction: column;
	gap: 14px;
	margin: 0;
	padding: 0;
	list-style: none;
}

.stat-head {
	display: grid;
	grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
	align-items: baseline;
	gap: 12px;
	margin-bottom: 6px;
}

.val {
	font-family: var(--font-cond);
	font-weight: 600;
	font-size: 17px;
	font-variant-numeric: tabular-nums;
	color: var(--color-muted);
}

/* Values sit next to the label, where both bars start. */
.val-a {
	text-align: right;
}

.val-b {
	text-align: left;
}

.val-a.lead {
	color: var(--side-a);
	font-weight: 800;
}

.val-b.lead {
	color: var(--side-b);
	font-weight: 800;
}

.stat-label {
	white-space: nowrap;
	color: var(--color-ink);
}

.bars {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 4px;
}

.bar {
	display: flex;
	height: var(--bar-height);
	overflow: hidden;
	background: var(--color-track);
	border-radius: var(--radius-bar);
}

.bar-a {
	justify-content: flex-end;
}

.fill {
	height: 100%;
	border-radius: var(--radius-bar);
	background: var(--color-chart-3);
	transition: width 0.4s ease;
}

.fill-a.lead {
	background: var(--side-a);
}

.fill-b.lead {
	background: var(--side-b);
}
</style>
