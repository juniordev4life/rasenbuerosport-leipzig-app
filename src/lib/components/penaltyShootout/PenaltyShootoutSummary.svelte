<script>
import { getTranslate } from "@tolgee/svelte";
import TargetIcon from "$lib/components/icons/TargetIcon.svelte";
import PlayerAvatar from "$lib/components/ui/PlayerAvatar.svelte";
import Section from "$lib/components/ui/Section.svelte";

/**
 * Read-only summary of a finished penalty shootout ("Elferkrimi") on the
 * match-detail page, rendered when `game.penalty_shootout` is present:
 * the final shootout score with the winning side, then one row per shot
 * — order, shooter, their side and the outcome (Tor / gehalten /
 * vorbei) as a labelled chip, so it never depends on colour.
 *
 * The shots come snake-case off the backend; players are resolved via
 * the same `game_players` list the rest of match-detail uses.
 *
 * @type {{
 *   penaltyShootout: {
 *     score_before: { home: number, away: number },
 *     final_score: { home: number, away: number },
 *     winner_side: 'home' | 'away',
 *     shots: Array<{
 *       order: number,
 *       round: number,
 *       team: 'home' | 'away',
 *       shooter_id: string,
 *       result: 'goal' | 'missed',
 *       keeper_id: string | null,
 *     }>,
 *   },
 *   gamePlayers: Array<{ player_id: string, team: string, profiles?: { username?: string, avatar_url?: string | null } | null }>,
 *   homeTeamName?: string | null,
 *   awayTeamName?: string | null,
 *   class?: string,
 * }}
 */
let {
	penaltyShootout,
	gamePlayers,
	homeTeamName = null,
	awayTeamName = null,
	class: className = "",
} = $props();

const { t } = getTranslate();

const playerById = $derived.by(() => {
	const map = new Map();
	for (const gp of gamePlayers ?? []) {
		map.set(gp.player_id, {
			username: gp.profiles?.username ?? "?",
			avatar_url: gp.profiles?.avatar_url ?? null,
		});
	}
	return map;
});

function shooterName(id) {
	return playerById.get(id)?.username ?? "?";
}

function keeperName(id) {
	if (!id) return null;
	return playerById.get(id)?.username ?? null;
}

/** Shape PlayerAvatar reads: name, photo and the id for the colour. */
function avatarFor(id) {
	const player = playerById.get(id);
	return {
		name: player?.username ?? "?",
		avatarUrl: player?.avatar_url ?? null,
		id,
	};
}

/** Three-letter side tag ("LIV"), from the team name. */
function sideTag(team) {
	const name = team === "home" ? homeTeamName : awayTeamName;
	return (name ?? "—").slice(0, 3).toUpperCase();
}

const winnerName = $derived(
	penaltyShootout?.winner_side === "home"
		? homeTeamName || $t("penalty_shootout.summary.home_fallback")
		: awayTeamName || $t("penalty_shootout.summary.away_fallback"),
);

const finalHome = $derived(penaltyShootout?.final_score?.home ?? 0);
const finalAway = $derived(penaltyShootout?.final_score?.away ?? 0);
</script>

<Section title={$t("penalty_shootout.summary.badge")} class={className}>
	{#snippet icon()}<TargetIcon size={22} strokeWidth={2} />{/snippet}
	<div class="card shootout">
		<div class="summary">
			<span class="num final">
				{finalHome}<span class="colon">:</span>{finalAway}
			</span>
			<p class="winner-line">
				{$t("penalty_shootout.summary.winner_line", { winner: winnerName })}
			</p>
		</div>

		<ol class="rows shots">
			{#each penaltyShootout.shots as shot (shot.order)}
				{@const isGoal = shot.result === "goal"}
				<li class="shot">
					<span class="order">#{shot.order}</span>
					<PlayerAvatar player={avatarFor(shot.shooter_id)} size={32} />
					<span class="line">
						<span class="line-main">
							<span class="chip side-tag {shot.team === 'home' ? 'chip-brand' : 'chip-navy'}">
								{sideTag(shot.team)}
							</span>
							<span class="shooter">{shooterName(shot.shooter_id)}</span>
						</span>
						{#if isGoal}
							<span class="chip chip-win outcome">
								{$t("penalty_shootout.summary.result_goal")}
							</span>
						{:else if shot.keeper_id}
							<span class="chip chip-loss outcome">
								{$t("penalty_shootout.summary.result_saved", {
									keeper: keeperName(shot.keeper_id) ?? "?",
								})}
							</span>
						{:else}
							<span class="chip chip-loss outcome">
								{$t("penalty_shootout.summary.result_off_target")}
							</span>
						{/if}
					</span>
				</li>
			{/each}
		</ol>
	</div>
</Section>

<style>
.shootout {
	display: flex;
	flex-direction: column;
	gap: 6px;
	padding: 16px 16px 6px;
}

.summary {
	display: flex;
	align-items: center;
	gap: 14px;
	padding-bottom: 10px;
	border-bottom: 1px solid var(--color-line);
}

.final {
	display: inline-flex;
	align-items: baseline;
	font-size: 40px;
	white-space: nowrap;
}

.colon {
	margin: 0 0.05em;
}

.winner-line {
	margin: 0;
	font-weight: 600;
	font-size: 15px;
	line-height: 1.35;
}

.shots {
	margin: 0;
	padding: 0;
	list-style: none;
}

.shot {
	display: grid;
	grid-template-columns: 30px 32px minmax(0, 1fr);
	align-items: center;
	gap: 10px;
	padding: 10px 0;
}

.order {
	color: var(--color-muted);
	font-family: var(--font-cond);
	font-weight: 700;
	font-size: 14px;
	font-variant-numeric: tabular-nums;
}

.line {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: space-between;
	gap: 6px 10px;
	min-width: 0;
}

.line-main {
	display: flex;
	align-items: center;
	gap: 8px;
	min-width: 0;
}

.side-tag {
	flex-shrink: 0;
}

.shooter {
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	font-weight: 700;
	font-size: 15px;
}

.outcome {
	font-size: 12px;
}

:global([data-variant="b"]) .final {
	padding: 6px 12px;
	border-radius: 12px;
	background: var(--color-score);
	color: var(--color-on-score);
	font-size: 30px;
	line-height: 1;
}

:global([data-variant="b"]) .colon {
	margin: 0 0.2em;
}
</style>
