<script>
import { getTranslate } from "@tolgee/svelte";
import PlayerAvatar from "$lib/components/ui/PlayerAvatar.svelte";
import RankIndicator from "./RankIndicator.svelte";
import TrendPill from "./TrendPill.svelte";

/**
 * Duo row of the Skill-Rating "Duos" tab: rank, two overlapping
 * avatars, both names, the duo's season games and all-time games, its
 * season record and its rating with the season change. A button, so
 * the page can open the duo profile.
 *
 * Phone: the figures sit in two lines under the names. Desktop
 * (≥ 1024 px): games, S/U/N and all-time games get their own columns.
 * Columns and gap follow `--cols` / `--col-gap` set on the list (the
 * leaderboard page).
 *
 * @type {{
 *   rank: number,
 *   duo: {
 *     duo_id: string,
 *     players: Array<{ player_id: string, username: string, avatar_url: string|null }>,
 *     rating: number, delta_season: number,
 *     games: number, wins: number, draws: number, losses: number, games_total: number,
 *   },
 *   onClick?: (duo: object) => void,
 * }}
 */
let { rank, duo, onClick } = $props();

const { t } = getTranslate();

const pair = $derived(duo.players.slice(0, 2));
const names = $derived(duo.players.map((p) => p.username).join(" & "));
const record = $derived(
	`${duo.wins}${$t("leaderboard.w_short")} ${duo.draws}${$t("leaderboard.d_short")} ${duo.losses}${$t("leaderboard.l_short")}`,
);
</script>

<button type="button" class="row" onclick={() => onClick?.(duo)}>
	<span class="cols">
		<RankIndicator {rank} />
		<span class="pair">
			{#each pair as p (p.player_id)}
				<PlayerAvatar player={p} size={36} class="pair-pic" />
			{/each}
		</span>
		<span class="who">
			<span class="names">{names}</span>
			<span class="meta">
				{duo.games} {$t("leaderboard.games_short")} · {duo.games_total}
				{$t("leaderboard.duo_total_games_short")}
			</span>
			<span class="meta">{record}</span>
		</span>
		<span class="cell">{duo.games}</span>
		<span class="cell">{record}</span>
		<span class="cell">{duo.games_total}</span>
		<span class="value">
			<span class="rating">{duo.rating ?? "—"}</span>
			<TrendPill delta={duo.delta_season} />
		</span>
	</span>
</button>

<style>
/* No border reset: the list's `.rows` hairlines sit on these buttons
 * (preflight already zeroes the button border). */
.row {
	display: block;
	width: 100%;
	padding: 10px 12px;
	background: transparent;
	color: inherit;
	font: inherit;
	text-align: left;
	cursor: pointer;
}

.row:hover {
	background: var(--color-sunken);
}

.cols {
	display: grid;
	grid-template-columns: var(--cols, 26px 60px minmax(0, 1fr) 52px);
	align-items: center;
	column-gap: var(--col-gap, 8px);
	min-height: 56px;
}

.pair {
	display: flex;
	padding-bottom: 4px;
}

/* A: the second square sits a little lower; B: plain overlap. */
.pair :global(.pair-pic + .pair-pic) {
	margin-top: 8px;
	margin-left: -12px;
	box-shadow: 0 0 0 2px var(--color-surface);
}

.who {
	display: flex;
	flex-direction: column;
	gap: 3px;
	min-width: 0;
}

.names {
	font-weight: 700;
	font-size: 14px;
	line-height: 1.25;
}

.meta {
	font-size: 12px;
	color: var(--color-muted);
}

.cell {
	display: none;
	font-family: var(--font-cond);
	font-weight: 700;
	font-size: 15px;
	font-variant-numeric: tabular-nums;
	text-align: right;
	white-space: nowrap;
}

.value {
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	gap: 4px;
}

.rating {
	font-family: var(--font-cond);
	font-weight: 700;
	font-size: 20px;
	line-height: 1;
	font-variant-numeric: tabular-nums;
}

@media (min-width: 1024px) {
	.cell {
		display: block;
	}

	.meta {
		display: none;
	}
}

/* Design B */
:global([data-variant="b"]) .row {
	padding: 8px 0;
}

:global([data-variant="b"]) .row:hover {
	background: transparent;
}

:global([data-variant="b"]) .row:hover .names {
	text-decoration: underline;
}

:global([data-variant="b"]) .pair {
	padding-bottom: 0;
}

:global([data-variant="b"]) .pair :global(.pair-pic + .pair-pic) {
	margin-top: 0;
}

:global([data-variant="b"]) .rating {
	font-weight: 800;
}
</style>
