<script>
import { getTranslate } from "@tolgee/svelte";
import { goto } from "$app/navigation";

/**
 * Liga (season-table) standings. Renders as a real `<table>` so
 * screen readers get proper row/column semantics; the wrapper scrolls
 * horizontally as a safety net on very narrow screens, though the
 * column widths are tuned to stay readable at 375px without scrolling.
 *
 * @type {{
 *   rows: Array<{
 *     rank: number, player_id: string, username: string,
 *     games: number, wins: number, draws: number, losses: number,
 *     shootout_wins: number, shootout_losses: number,
 *     goals_for: number, goals_against: number, goal_diff: number,
 *     points: number, points_per_game: number,
 *   }>,
 *   mode: "total"|"per_game",
 *   currentUserId?: string|null,
 * }}
 */
let { rows = [], mode = "total", currentUserId = null } = $props();

const { t } = getTranslate();

/**
 * Net shootout record as a short suffix, e.g. "+1 n.E." Returns null
 * when the player has taken no shootout at all, so the row doesn't
 * show a redundant "±0 n.E." for everyone.
 *
 * @param {{ shootout_wins?: number, shootout_losses?: number }} row
 * @returns {string|null}
 * @example
 *   shootoutSuffix({ shootout_wins: 1, shootout_losses: 0 }); // → "+1 n.E."
 */
function shootoutSuffix(row) {
	const wins = row.shootout_wins ?? 0;
	const losses = row.shootout_losses ?? 0;
	if (wins === 0 && losses === 0) return null;
	const net = wins - losses;
	const sign = net > 0 ? "+" : net < 0 ? "−" : "±";
	return `${sign}${Math.abs(net)} ${$t("leaderboard.shootout_short")}`;
}

function handleRowClick(id) {
	if (id) goto(`/app/profile/${id}`);
}
</script>

<div class="overflow-x-auto -mx-1 px-1">
	<table class="w-full border-collapse text-[12px]">
		<thead>
			<tr class="text-[10px] uppercase tracking-wider text-text-muted">
				<th scope="col" class="text-left font-bold py-1.5 pr-1 w-6">{$t("leaderboard.table.rank")}</th>
				<th scope="col" class="text-left font-bold py-1.5 pr-1">{$t("leaderboard.table.player")}</th>
				<th scope="col" class="text-right font-bold py-1.5 px-1">{$t("leaderboard.table.games")}</th>
				<th scope="col" class="text-right font-bold py-1.5 px-1">{$t("leaderboard.table.wdl")}</th>
				<th scope="col" class="text-right font-bold py-1.5 px-1">{$t("leaderboard.table.goals")}</th>
				<th scope="col" class="text-right font-bold py-1.5 px-1">{$t("leaderboard.table.diff")}</th>
				<th scope="col" class="text-right font-bold py-1.5 pl-1">
					{mode === "per_game" ? $t("leaderboard.ppg_label") : $t("leaderboard.table.points")}
				</th>
			</tr>
		</thead>
		<tbody>
			{#each rows as row (row.player_id)}
				<tr
					class="border-t border-border cursor-pointer hover:bg-bg-input {row.player_id ===
					currentUserId
						? 'bg-accent-red/5'
						: ''}"
					onclick={() => handleRowClick(row.player_id)}
				>
					<td class="py-2 pr-1 font-bold text-text-muted tabular-nums">{row.rank}</td>
					<td class="py-2 pr-1 font-bold text-text-primary truncate max-w-[110px]">
						{row.username}
						{#if row.player_id === currentUserId}
							<span class="text-accent-red">· {$t("leaderboard.you")}</span>
						{/if}
					</td>
					<td class="py-2 px-1 text-right text-text-secondary tabular-nums">{row.games}</td>
					<td class="py-2 px-1 text-right tabular-nums">
						<div class="text-text-secondary whitespace-nowrap">{row.wins}-{row.draws}-{row.losses}</div>
						{#if shootoutSuffix(row)}
							<div class="text-[10px] text-text-muted whitespace-nowrap">{shootoutSuffix(row)}</div>
						{/if}
					</td>
					<td class="py-2 px-1 text-right text-text-secondary tabular-nums whitespace-nowrap">
						{row.goals_for}:{row.goals_against}
					</td>
					<td
						class="py-2 px-1 text-right tabular-nums {row.goal_diff > 0
							? 'text-success'
							: row.goal_diff < 0
								? 'text-error'
								: 'text-text-secondary'}"
					>
						{row.goal_diff > 0 ? "+" : ""}{row.goal_diff}
					</td>
					<td class="py-2 pl-1 text-right font-extrabold text-text-primary tabular-nums">
						{mode === "per_game" ? row.points_per_game.toFixed(2) : row.points}
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
