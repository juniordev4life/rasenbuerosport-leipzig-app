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
 *   gradientFor?: (id: string) => string,
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
	gradientFor,
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

<div class="board">
	<div class="header">
		<span class="board-title">{$t("penalty_shootout.board.title")}</span>
		<span class="round-pill">
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
					<SequenceCell
						state={cell.state}
						round={cell.round}
						shooter={cell.shooter}
						gradient={cell.shooter && gradientFor ? gradientFor(cell.shooter.id) : null}
					/>
				{/each}
			</div>
			<div class="cells-row">
				{#each awayCells as cell (cell.round)}
					<SequenceCell
						state={cell.state}
						round={cell.round}
						shooter={cell.shooter}
						gradient={cell.shooter && gradientFor ? gradientFor(cell.shooter.id) : null}
					/>
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
.board {
	background: #131822;
	border: 1px solid #1F2937;
	border-radius: 14px;
	padding: 12px;
}

.header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 10px;
}
.board-title {
	font-size: 10px;
	font-weight: 800;
	letter-spacing: 0.12em;
	text-transform: uppercase;
	color: #9CA3AF;
}
.round-pill {
	font-size: 10px;
	font-weight: 700;
	color: #FBBF24;
	background: rgba(245, 158, 11, 0.1);
	border: 1px solid rgba(245, 158, 11, 0.3);
	border-radius: 999px;
	padding: 3px 10px;
	letter-spacing: 0.05em;
}

.rows {
	display: grid;
	grid-template-columns: 36px 1fr;
	gap: 6px;
	min-width: 0;
}
.team-labels {
	display: flex;
	flex-direction: column;
	justify-content: space-around;
	gap: 4px;
}
.team-label {
	font-size: 10px;
	font-weight: 800;
	color: #9CA3AF;
	letter-spacing: 0.06em;
	text-transform: uppercase;
	text-align: center;
}

.cells-scroll {
	overflow-x: auto;
	scrollbar-width: thin;
	min-width: 0;
}
.cells-row {
	display: flex;
	gap: 2px;
}
.cells-row + .cells-row {
	margin-top: 4px;
}

.scroll-hint {
	font-size: 10px;
	color: #6B7280;
	margin: 6px 0 0;
	text-align: center;
}
</style>
