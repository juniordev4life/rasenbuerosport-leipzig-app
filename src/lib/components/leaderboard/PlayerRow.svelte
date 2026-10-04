<script>
import { getTranslate } from "@tolgee/svelte";
import LightningIcon from "$lib/components/icons/LightningIcon.svelte";
import PlayerAvatar from "$lib/components/ui/PlayerAvatar.svelte";
import RankIndicator from "./RankIndicator.svelte";
import Sparkline from "./Sparkline.svelte";
import TrendPill from "./TrendPill.svelte";

/**
 * One row of the Skill-Rating player list: rank, avatar, name with
 * badges (win streak, "Ich"), the season line, a sparkline and the
 * rating with its change. The row is a button so callers can hook into
 * clicks (open the player's profile).
 *
 * Phone: the season line reads "47 Spiele · 33S 0U 14N". Desktop
 * (≥ 1024 px): games, S/U/N and goals get their own columns. Columns and
 * gap follow `--cols` / `--col-gap` set on the list (the leaderboard
 * page), so its header row lines up; the fallback is the phone layout.
 * A win streak of 3+ shows as a compact gold chip (icon and count; the
 * full "4er-Streak" is there for screen readers).
 *
 * Players with no rated game in the selected season still show their
 * rating, but the season figures collapse to "—". `dimmed` (and an
 * unqualified player) mutes the rank and rating instead of fading the
 * row, which would drop the text contrast. Design A highlights the own
 * row in navy; design B in pale gold.
 *
 * @type {{
 *   rank: number,
 *   player: {
 *     player_id: string, username: string, avatar_url: string|null,
 *     rating: number|null, delta_season: number, delta_week: number,
 *     form_delta: number|null, history: number[],
 *     games: number, wins: number, draws: number, losses: number, goals: number,
 *     streak: { type: "W"|"D"|"L", count: number }|null, rookie: boolean,
 *     qualified?: boolean,
 *   },
 *   sort: "current"|"form",
 *   isCurrentUser?: boolean,
 *   dimmed?: boolean,
 *   onClick?: (id: string) => void,
 * }}
 */
let {
	rank,
	player,
	sort,
	isCurrentUser = false,
	dimmed = false,
	onClick,
} = $props();

const { t } = getTranslate();

const hasSeasonGames = $derived(player.games > 0);

const winStreak = $derived(
	player.streak?.type === "W" && player.streak.count >= 3
		? player.streak.count
		: null,
);

const displayedDelta = $derived(
	sort === "form" ? player.form_delta : player.delta_season,
);

const trendDown = $derived(
	displayedDelta != null && Math.round(displayedDelta) < 0,
);

const record = $derived(
	`${player.wins}${$t("leaderboard.w_short")} ${player.draws}${$t("leaderboard.d_short")} ${player.losses}${$t("leaderboard.l_short")}`,
);

function handleClick() {
	onClick?.(player.player_id);
}
</script>

<button
	type="button"
	onclick={handleClick}
	class="row"
	class:self={isCurrentUser}
	class:muted={dimmed || player.qualified === false}
	aria-current={isCurrentUser ? "true" : undefined}
>
	<span class="cols">
		<RankIndicator {rank} />
		<PlayerAvatar {player} size={40} self={isCurrentUser} />
		<span class="who">
			<span class="name-line">
				<span class="name">{player.username}</span>
				{#if winStreak}
					<!-- Icon and count on screen; "4er-Streak" for screen readers. -->
					<span class="chip chip-gold">
						<LightningIcon size={11} strokeWidth={2.4} />
						{winStreak}<span class="sr-only">{$t("leaderboard.streak_suffix")}</span>
					</span>
				{/if}
				{#if isCurrentUser}
					<span class="chip chip-outline me">{$t("leaderboard.you")}</span>
				{/if}
			</span>
			<span class="meta">
				{#if hasSeasonGames}
					{player.games} {$t("leaderboard.games_short")} · {record}
				{:else}
					—
				{/if}
			</span>
		</span>
		<span class="cell">{hasSeasonGames ? player.games : "—"}</span>
		<span class="cell">{hasSeasonGames ? record : "—"}</span>
		<span class="cell">{hasSeasonGames ? player.goals : "—"}</span>
		<span class="spark" class:down={trendDown}>
			<Sparkline points={player.history} width={48} height={20} strokeWidth={1.5} fluid />
		</span>
		<span class="value">
			<span class="rating">{player.rating ?? "—"}</span>
			<TrendPill delta={displayedDelta} />
		</span>
	</span>
</button>

<style>
/* No border reset: the list's `.rows` hairlines sit on these buttons
 * (preflight already zeroes the button border). */
.row {
	display: block;
	width: 100%;
	padding: 8px 12px;
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
	grid-template-columns: var(--cols, 26px 40px minmax(0, 1fr) 44px 52px);
	align-items: center;
	column-gap: var(--col-gap, 8px);
	min-height: 48px;
}

.who {
	display: flex;
	flex-direction: column;
	gap: 3px;
	min-width: 0;
}

.name-line {
	display: flex;
	align-items: center;
	gap: 6px;
	min-width: 0;
}

.name {
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	font-weight: 700;
	font-size: 15px;
}

.chip {
	flex-shrink: 0;
}

.meta {
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	font-size: 12px;
	color: var(--color-muted);
}

/* Desktop-only columns. */
.cell {
	display: none;
	font-family: var(--font-cond);
	font-weight: 700;
	font-size: 15px;
	font-variant-numeric: tabular-nums;
	text-align: right;
	white-space: nowrap;
}

.spark {
	display: flex;
	color: var(--color-chart-1);
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

.muted {
	--rank-color: var(--color-muted);
}

.muted .rating {
	color: var(--color-muted);
}

@media (min-width: 1024px) {
	.cell {
		display: block;
	}

	.meta {
		display: none;
	}
}

/* Design A: the own row is a navy band. */
:global([data-variant="a"]) .self,
:global([data-variant="a"]) .self:hover {
	--rank-color: currentColor;
	background: var(--color-navy);
	color: var(--color-on-navy);
}

:global([data-variant="a"]) .self .meta,
:global([data-variant="a"]) .self .spark,
:global([data-variant="a"]) .self .rating,
:global([data-variant="a"]) .self :global(.trend) {
	color: inherit;
}

/* Design B: rows sit flush in the section card; the own row is a pale
 * gold pill that reaches a little into the card's padding. */
:global([data-variant="b"]) .row {
	padding: 6px 0;
}

:global([data-variant="b"]) .row:hover {
	background: transparent;
}

:global([data-variant="b"]) .row:hover .name {
	text-decoration: underline;
}

:global([data-variant="b"]) .rating {
	font-weight: 800;
}

:global([data-variant="b"]) .meta {
	font-size: 11.5px;
}

:global([data-variant="b"]) .spark {
	color: var(--color-win);
}

:global([data-variant="b"]) .spark.down {
	color: var(--color-loss);
}

:global([data-variant="b"]) .self,
:global([data-variant="b"]) .self:hover {
	width: calc(100% + 16px);
	margin: 0 -8px;
	padding-inline: 8px;
	border-top-color: transparent;
	border-radius: 12px;
	background: var(--color-gold-soft);
}

:global([data-variant="b"]) .me {
	background: var(--color-navy);
	color: var(--color-on-navy);
	box-shadow: none;
}
</style>
