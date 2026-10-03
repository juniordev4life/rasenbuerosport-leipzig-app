<script>
import { getTranslate } from "@tolgee/svelte";

/**
 * The signed-in player's last three matches. Design A: S / U / N marker
 * left, the score in display type and the ELO change right. Design B:
 * a dark green score chip left, the ELO change as a pill right.
 *
 * @type {{
 *   matches: Array<{
 *     id: string,
 *     opponent: string,
 *     dateLabel: string,
 *     mode: string,
 *     result: "win"|"loss"|"draw"|null,
 *     score: string,
 *     eloDelta: number|null,
 *   }>,
 * }}
 */
let { matches = [] } = $props();

const { t } = getTranslate();

const RESULT = {
	win: { letter: "S", cls: "result-w", tone: "win" },
	draw: { letter: "U", cls: "result-d", tone: "draw" },
	loss: { letter: "N", cls: "result-l", tone: "loss" },
};

function formatDelta(n) {
	if (n === null || n === undefined) return null;
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

{#if matches.length === 0}
	<div class="card px-4 py-5 text-center text-sm text-muted">
		{$t("home.recent_matches.empty")}
	</div>
{:else}
	<div class="card rows matches">
		{#each matches as match (match.id)}
			{@const r = RESULT[match.result]}
			<a href={`/app/games/${match.id}`} class="match">
				<span class="result marker {r?.cls ?? 'result-d'}">{r?.letter ?? "–"}</span>
				<span class="score chip-score">{match.score}</span>
				<span class="flex flex-col gap-0.5 flex-1 min-w-0">
					<span class="font-bold truncate">vs. {match.opponent}</span>
					<span class="text-[13px] text-muted">{match.dateLabel} · {match.mode}</span>
				</span>
				<span class="right">
					<span class="num score-a tone-{r?.tone ?? 'draw'}">{match.score}</span>
					{#if match.eloDelta != null}
						<span class="delta tone-{deltaTone(match.eloDelta)}">
							{formatDelta(match.eloDelta)} <span class="delta-unit">ELO</span>
						</span>
					{/if}
				</span>
			</a>
		{/each}
	</div>
{/if}

<style>
.match {
	display: flex;
	align-items: center;
	gap: 12px;
	min-height: 68px;
	padding: 0 16px;
	text-decoration: none;
	color: inherit;
}

.match:hover {
	background: var(--color-sunken);
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

.delta {
	font-family: var(--font-cond);
	font-weight: 700;
	font-size: 12px;
	white-space: nowrap;
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
	padding: 4px 10px;
	border-radius: 999px;
	font-size: 14px;
}

:global([data-variant="b"]) .delta.tone-win {
	background: var(--color-win-soft);
}

:global([data-variant="b"]) .delta.tone-loss {
	background: var(--color-loss-soft);
}

:global([data-variant="b"]) .delta.tone-draw {
	background: var(--color-sunken);
}
</style>
