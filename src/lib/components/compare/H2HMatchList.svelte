<script>
import { getTranslate } from "@tolgee/svelte";
import HistoryIcon from "$lib/components/icons/HistoryIcon.svelte";
import Section from "$lib/components/ui/Section.svelte";

/**
 * The latest direct duels of the two players: date, both names around
 * the score chip (the winner's name in bold ink, the other muted) and
 * each player's ELO change with ↑ / ↓ and a sign.
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

/**
 * Signed ELO change with an arrow, e.g. "↑ +12", "↓ −8", "±0".
 * @param {number|null} d
 * @returns {string}
 */
function deltaText(d) {
	if (d == null) return "—";
	const r = Math.round(d);
	if (r > 0) return `↑ +${r}`;
	if (r < 0) return `↓ −${Math.abs(r)}`;
	return "±0";
}

function deltaTone(d) {
	const r = d == null ? 0 : Math.round(d);
	if (r > 0) return "win";
	if (r < 0) return "loss";
	return "draw";
}
</script>

{#if matches.length > 0}
	<Section title={$t("compare.matches_section")}>
		{#snippet icon()}<HistoryIcon size={22} strokeWidth={2} />{/snippet}
		<ul class="card rows duels">
			{#each matches as m (m.id)}
				{@const aWon = m.scoreA > m.scoreB}
				{@const bWon = m.scoreB > m.scoreA}
				<li class="duel">
					<span class="label duel-date">{m.date}</span>
					<div class="duel-line">
						<span class="duel-name duel-name-a" class:won={aWon}>{playerAName}</span>
						<span class="score duel-score">{m.scoreA}:{m.scoreB}</span>
						<span class="duel-name duel-name-b" class:won={bWon}>{playerBName}</span>
					</div>
					<div class="duel-elo">
						<span class="delta delta-{deltaTone(m.eloDeltaA)}">{deltaText(m.eloDeltaA)}</span>
						<span class="delta delta-{deltaTone(m.eloDeltaB)}">{deltaText(m.eloDeltaB)}</span>
					</div>
				</li>
			{/each}
		</ul>
	</Section>
{/if}

<style>
.duels {
	margin: 0;
	padding: 0;
	list-style: none;
}

.duel {
	display: flex;
	flex-direction: column;
	gap: 6px;
	padding: 12px 16px;
}

.duel-date {
	text-align: center;
	color: var(--color-muted);
}

.duel-line,
.duel-elo {
	display: grid;
	grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
	align-items: center;
	gap: 12px;
}

.duel-name {
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	font-weight: 500;
	font-size: 14px;
	color: var(--color-muted);
}

.duel-name.won {
	font-weight: 700;
	color: var(--color-ink);
}

.duel-name-a {
	text-align: right;
}

.duel-score {
	min-width: 3.75rem;
	font-size: 17px;
}

/* ELO changes line up under the names: the shared `.delta`, coloured text
 * in A, a pill in B. */
.duel-elo {
	grid-template-columns: minmax(0, 1fr) 3.75rem minmax(0, 1fr);
}

.duel-elo .delta {
	font-size: 13px;
}

.duel-elo .delta:first-child {
	justify-self: end;
}

.duel-elo .delta:last-child {
	grid-column: 3;
	justify-self: start;
}

:global([data-variant="b"]) .duel {
	padding: 12px 0;
}
</style>
