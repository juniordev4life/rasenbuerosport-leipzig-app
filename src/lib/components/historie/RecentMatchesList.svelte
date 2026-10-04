<script>
import { getTranslate } from "@tolgee/svelte";
import { formatEloDelta } from "$lib/utils/matchEloSnapshot.utils.js";

/**
 * A short list of recent matches, each row linking to the match: the
 * player's last three on the dashboard, a duo's last five on the duo
 * page. Design A: S / U / N marker left, the score in display type and
 * the ELO change right. Design B: a dark green score chip left, the ELO
 * change as a pill right.
 *
 * `result` and `eloDelta` are from the viewer's side: the signed-in
 * player, or the duo. `result: null` (the player was not in the match)
 * shows a neutral marker. Without matches the list shows `emptyText`, or
 * nothing when there is none.
 *
 * @type {{
 *   matches: Array<{
 *     id: string,
 *     opponent: string,
 *     dateLabel: string,
 *     mode?: string|null,
 *     result: "win"|"draw"|"loss"|null,
 *     score: string,
 *     eloDelta: number|null,
 *   }>,
 *   emptyText?: string|null,
 * }}
 */
let { matches = [], emptyText = null } = $props();

const { t } = getTranslate();

const RESULT = {
	win: { key: "historie.w_short", cls: "result-w", tone: "win" },
	draw: { key: "historie.d_short", cls: "result-d", tone: "draw" },
	loss: { key: "historie.l_short", cls: "result-l", tone: "loss" },
};

function toneOf(n) {
	return n > 0 ? "win" : n < 0 ? "loss" : "draw";
}
</script>

{#if matches.length > 0}
	<ul class="card rows matches">
		{#each matches as match (match.id)}
			{@const r = RESULT[match.result]}
			{@const delta = match.eloDelta == null ? null : Math.round(match.eloDelta)}
			<li>
				<a href={`/app/games/${match.id}`} class="match">
					<span class="result marker {r?.cls ?? 'result-d'}">{r ? $t(r.key) : "–"}</span>
					<span class="score chip-score">{match.score}</span>
					<span class="flex flex-col gap-0.5 flex-1 min-w-0">
						<span class="font-bold truncate">{$t("common.vs")} {match.opponent}</span>
						<span class="text-[13px] text-muted">
							{[match.dateLabel, match.mode].filter(Boolean).join(" · ")}
						</span>
					</span>
					<span class="right">
						<span class="num score-a tone-{r?.tone ?? 'draw'}">{match.score}</span>
						{#if delta != null}
							<span class="delta delta-{toneOf(delta)}">
								{formatEloDelta(delta)} <span class="delta-unit">ELO</span>
							</span>
						{/if}
					</span>
				</a>
			</li>
		{/each}
	</ul>
{:else if emptyText}
	<div class="card notice">{emptyText}</div>
{/if}

<style>
.matches {
	margin: 0;
	padding: 0;
	list-style: none;
}

/* The row height sits on the item, which carries the `.rows` hairline,
 * so the line counts towards it. The link fills the item; `min-width: 0`
 * lets a long opponent name truncate instead of widening the row. */
.matches > li {
	display: flex;
	min-height: 68px;
}

.match {
	display: flex;
	flex: 1;
	min-width: 0;
	align-items: center;
	gap: 12px;
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
:global([data-variant="b"]) .matches > li {
	min-height: 64px;
}

:global([data-variant="b"]) .match {
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
