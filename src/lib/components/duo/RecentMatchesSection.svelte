<script>
import { getTranslate } from "@tolgee/svelte";
import HistoryIcon from "$lib/components/icons/HistoryIcon.svelte";
import Section from "$lib/components/ui/Section.svelte";

/**
 * The duo's latest matches together (five at most), like the home
 * page's recent matches. Design A: an S / U / N marker left, the score
 * in display type and the ELO change right. Design B: a dark green
 * score chip left, the ELO change as a pill right.
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

const RESULT = {
	W: { key: "duo.w_short", cls: "result-w", tone: "win" },
	D: { key: "duo.d_short", cls: "result-d", tone: "draw" },
	L: { key: "duo.l_short", cls: "result-l", tone: "loss" },
};

/**
 * Signed ELO change, e.g. "+12", "−8", "±0".
 * @param {number} n
 * @returns {string}
 */
function formatDelta(n) {
	const r = Math.round(n);
	if (r > 0) return `+${r}`;
	if (r < 0) return `−${Math.abs(r)}`;
	return "±0";
}

function deltaTone(n) {
	const r = Math.round(n ?? 0);
	return r > 0 ? "win" : r < 0 ? "loss" : "draw";
}
</script>

{#if matches.length > 0}
	<Section title={$t("duo.recent_section")}>
		{#snippet icon()}<HistoryIcon size={22} strokeWidth={2} />{/snippet}
		<ul class="card rows matches">
			{#each matches as m (m.id)}
				{@const r = RESULT[m.result] ?? RESULT.D}
				<li class="match">
					<span class="result marker {r.cls}">{$t(r.key)}</span>
					<span class="score chip-score">{m.score}</span>
					<span class="flex flex-col gap-0.5 flex-1 min-w-0">
						<span class="font-bold truncate">vs. {m.opponentNames}</span>
						<span class="text-[13px] text-muted">{m.dateLabel}</span>
					</span>
					<span class="right">
						<span class="num score-a tone-{r.tone}">{m.score}</span>
						{#if m.eloDelta != null}
							<span class="delta delta-{deltaTone(m.eloDelta)}">
								{formatDelta(m.eloDelta)} <span class="delta-unit">ELO</span>
							</span>
						{/if}
					</span>
				</li>
			{/each}
		</ul>
	</Section>
{/if}

<style>
.matches {
	margin: 0;
	padding: 0;
	list-style: none;
}

.match {
	display: flex;
	align-items: center;
	gap: 12px;
	min-height: 68px;
	padding: 0 16px;
}

.marker {
	width: 32px;
	height: 32px;
	font-size: 16px;
}

.chip-score {
	display: none;
}

.right {
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	gap: 5px;
	flex-shrink: 0;
}

.score-a {
	font-size: 24px;
	line-height: 0.8;
}

/* The ELO change is the shared `.delta`: coloured text in A, a pill in B. */
.delta {
	font-size: 12px;
}

.tone-win {
	color: var(--color-win);
}

.tone-loss {
	color: var(--color-loss);
}

.tone-draw {
	color: var(--color-muted);
}

/* Design B */
:global([data-variant="b"]) .match {
	min-height: 64px;
	padding: 0;
}

:global([data-variant="b"]) .marker,
:global([data-variant="b"]) .score-a,
:global([data-variant="b"]) .delta-unit {
	display: none;
}

:global([data-variant="b"]) .chip-score {
	display: inline-flex;
	min-width: 64px;
}

:global([data-variant="b"]) .delta {
	font-size: 14px;
}
</style>
