<script>
import { getTranslate } from "@tolgee/svelte";
import {
	getBoardCellCount,
	getCurrentRound,
	PENALTY_REGULAR_ROUNDS,
} from "$lib/utils/penaltyShootout.utils.js";
import SequenceCell from "./SequenceCell.svelte";

/**
 * Two-row sequence board (home / away) with one cell per round.
 * Fixed left column shows the team abbreviation, the cells scroll
 * horizontally on narrow viewports when sudden death pushes past
 * the regular five rounds.
 *
 * Cell state is derived per (team, round) from the shot list +
 * decision flag:
 *   - if a shot exists for that slot, render goal/missed
 *   - if it's the next slot for the next-shooting team, render
 *     "active" (or "wartet" once a shooter is picked)
 *   - if the shootout is already decided and the slot would never
 *     fire, render "skipped"
 *   - otherwise "pending"
 *
 * @type {{
 *   shots: Array<{ team: 'home' | 'away', round: number, result: 'goal' | 'missed', shooterId: string }>,
 *   homeLabel: string,
 *   awayLabel: string,
 *   homePlayers: Array<{ id: string, username: string, avatar_url?: string | null }>,
 *   awayPlayers: Array<{ id: string, username: string, avatar_url?: string | null }>,
 *   pendingShooter?: { id: string, username: string, avatar_url?: string | null } | null,
 *   decided?: boolean,
 * }}
 */
let {
	shots,
	homeLabel,
	awayLabel,
	homePlayers,
	awayPlayers,
	pendingShooter = null,
	decided = false,
} = $props();

const { t } = getTranslate();

const cellCount = $derived(getBoardCellCount(shots));
const currentRound = $derived(getCurrentRound(shots));
const cellIndexes = $derived(
	Array.from({ length: cellCount }, (_, i) => i + 1),
);

/**
 * For O(1) lookups while rendering — keyed by `<team>:<round>`.
 * Recomputed whenever the shot list changes.
 */
const shotByCell = $derived.by(() => {
	const map = new Map();
	for (const shot of shots) {
		map.set(`${shot.team}:${shot.round}`, shot);
	}
	return map;
});

const allPlayersById = $derived.by(() => {
	const map = new Map();
	for (const p of homePlayers ?? []) map.set(p.id, p);
	for (const p of awayPlayers ?? []) map.set(p.id, p);
	return map;
});

/**
 * Determines the visual state for a single cell.
 * @param {'home' | 'away'} team
 * @param {number} round
 * @returns {{ state: string, shooter: object | null }}
 */
function resolveCell(team, round) {
	const existing = shotByCell.get(`${team}:${round}`);
	if (existing) {
		return {
			state: existing.result === "goal" ? "goal" : "missed",
			shooter: allPlayersById.get(existing.shooterId) ?? null,
		};
	}

	// Not yet shot — figure out whether this slot is the active one,
	// pending, or skipped because the shootout was decided early.
	const nextTeam = shots.length % 2 === 0 ? "home" : "away";
	const isCurrentRoundForTeam = round === currentRound && team === nextTeam;

	if (decided) {
		return { state: "skipped", shooter: null };
	}
	if (isCurrentRoundForTeam) {
		if (pendingShooter) {
			return { state: "wartet", shooter: pendingShooter };
		}
		return { state: "active", shooter: null };
	}
	return { state: "pending", shooter: null };
}

const homeCells = $derived(
	cellIndexes.map((round) => ({ round, ...resolveCell("home", round) })),
);
const awayCells = $derived(
	cellIndexes.map((round) => ({ round, ...resolveCell("away", round) })),
);

const showScrollHint = $derived(cellCount > PENALTY_REGULAR_ROUNDS);
</script>

<div class="card board">
	<div class="header">
		<span class="label text-muted">{$t("penalty_shootout.board.title")}</span>
		<span class="chip chip-gold">
			{$t("penalty_shootout.board.round_progress", {
				current: currentRound,
				total: Math.max(PENALTY_REGULAR_ROUNDS, currentRound),
			})}
		</span>
	</div>

	<div class="rows">
		<div class="team-labels">
			<span class="team-label">{homeLabel}</span>
			<span class="team-label">{awayLabel}</span>
		</div>

		<div class="cells-scroll">
			<div class="cells-row">
				{#each homeCells as cell (cell.round)}
					<SequenceCell state={cell.state} round={cell.round} shooter={cell.shooter} />
				{/each}
			</div>
			<div class="cells-row">
				{#each awayCells as cell (cell.round)}
					<SequenceCell state={cell.state} round={cell.round} shooter={cell.shooter} />
				{/each}
			</div>
		</div>
	</div>

	{#if showScrollHint}
		<p class="scroll-hint" aria-live="polite">
			{$t("penalty_shootout.board.scroll_hint")}
		</p>
	{/if}
</div>

<style>
/* Cell width (read by SequenceCell): five regular rounds fit a phone
 * without scrolling; sudden death scrolls sideways. */
.board {
	--sb-cell-width: 54px;
	padding: 14px;
}

@media (min-width: 640px) {
	.board {
		--sb-cell-width: 60px;
	}
}

.header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	margin-bottom: 10px;
}

.rows {
	display: grid;
	grid-template-columns: 40px minmax(0, 1fr);
	gap: 6px;
	min-width: 0;
}

/* Same track sizes as the two cell rows (58px cells, 6px + 1px + 6px
 * divider), so each label sits level with its row. */
.team-labels {
	display: grid;
	grid-template-rows: 58px 58px;
	row-gap: 13px;
	align-items: center;
}

.team-label {
	font-family: var(--font-cond);
	font-weight: 700;
	font-size: 13px;
	letter-spacing: 0.03em;
	text-align: center;
	text-transform: uppercase;
}

.cells-scroll {
	min-width: 0;
	overflow-x: auto;
	scrollbar-width: thin;
}

.cells-row {
	display: flex;
	gap: 2px;
}

.cells-row + .cells-row {
	margin-top: 6px;
	padding-top: 6px;
	border-top: 1px solid var(--color-line);
}

.scroll-hint {
	margin: 8px 0 0;
	color: var(--color-muted);
	font-size: 12px;
	text-align: center;
}
</style>
