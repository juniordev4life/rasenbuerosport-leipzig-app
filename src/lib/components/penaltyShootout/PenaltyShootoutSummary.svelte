<script>
import { getTranslate } from "@tolgee/svelte";

/**
 * Read-only summary card of a finished penalty shootout. Renders on
 * the match-detail page when `game.penalty_shootout` is present so
 * the user can see who shot when, who hit, who saved.
 *
 * Renders the shoot-by-shoot list (snake-case as it comes off the
 * backend) plus a small header pill with the final shootout score
 * and the winning side. Players are resolved via the same
 * `game_players` list the rest of match-detail uses.
 *
 * Avatar gradient generator is intentionally the same hash as in
 * the live-step so a player's colour stays stable across screens.
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
 * }}
 */
let {
	penaltyShootout,
	gamePlayers,
	homeTeamName = null,
	awayTeamName = null,
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

function gradientFor(id) {
	if (!id) return "linear-gradient(135deg, #475569, #334155)";
	const palette = [
		["#84CC16", "#65A30D"],
		["#E24B4A", "#C73E3D"],
		["#6366F1", "#4338CA"],
		["#F59E0B", "#D97706"],
		["#06B6D4", "#0891B2"],
		["#A78BFA", "#7C3AED"],
		["#EC4899", "#BE185D"],
		["#14B8A6", "#0F766E"],
	];
	let hash = 0;
	for (let i = 0; i < id.length; i += 1) {
		hash = (hash * 31 + id.charCodeAt(i)) | 0;
	}
	const [a, b] = palette[Math.abs(hash) % palette.length];
	return `linear-gradient(135deg, ${a}, ${b})`;
}

const winnerName = $derived(
	penaltyShootout?.winner_side === "home"
		? homeTeamName || $t("penalty_shootout.summary.home_fallback")
		: awayTeamName || $t("penalty_shootout.summary.away_fallback"),
);

const finalHome = $derived(penaltyShootout?.final_score?.home ?? 0);
const finalAway = $derived(penaltyShootout?.final_score?.away ?? 0);
</script>

<section class="card">
	<header class="card-header">
		<span class="badge">{$t("penalty_shootout.summary.badge")}</span>
		<div class="header-score">
			<span>{finalHome}</span>
			<span class="sep">:</span>
			<span>{finalAway}</span>
		</div>
		<p class="header-meta">
			{$t("penalty_shootout.summary.winner_line", { winner: winnerName })}
		</p>
	</header>

	<ol class="shots">
		{#each penaltyShootout.shots as shot (shot.order)}
			{@const isGoal = shot.result === "goal"}
			<li class="shot">
				<span class="order">#{shot.order}</span>
				<span
					class="avatar"
					class:goal={isGoal}
					class:missed={!isGoal}
					style:--cell-gradient={gradientFor(shot.shooter_id)}
				>
					{shooterName(shot.shooter_id).charAt(0).toUpperCase()}
				</span>
				<div class="line">
					<span class="line-main">
						<span class="team-tag" class:home={shot.team === "home"} class:away={shot.team === "away"}>
							{shot.team === "home"
								? (homeTeamName ?? "—").slice(0, 3).toUpperCase()
								: (awayTeamName ?? "—").slice(0, 3).toUpperCase()}
						</span>
						<span class="shooter">{shooterName(shot.shooter_id)}</span>
					</span>
					<span class="line-meta">
						{#if isGoal}
							<span class="result-pill goal">{$t("penalty_shootout.summary.result_goal")}</span>
						{:else if shot.keeper_id}
							<span class="result-pill missed">{$t("penalty_shootout.summary.result_saved", { keeper: keeperName(shot.keeper_id) ?? "?" })}</span>
						{:else}
							<span class="result-pill missed">{$t("penalty_shootout.summary.result_off_target")}</span>
						{/if}
					</span>
				</div>
			</li>
		{/each}
	</ol>
</section>

<style>
.card {
	background: #131822;
	border: 1px solid rgba(245, 158, 11, 0.32);
	border-radius: 16px;
	padding: 16px;
	display: flex;
	flex-direction: column;
	gap: 14px;
	position: relative;
	overflow: hidden;
}
.card::before {
	content: '';
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	height: 2px;
	background: linear-gradient(90deg, transparent, #F59E0B 50%, transparent);
}

.card-header {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 6px;
	text-align: center;
}
.badge {
	font-size: 10px;
	font-weight: 800;
	color: #FBBF24;
	background: rgba(245, 158, 11, 0.16);
	border: 1px solid rgba(245, 158, 11, 0.4);
	padding: 4px 12px;
	border-radius: 999px;
	text-transform: uppercase;
	letter-spacing: 0.12em;
}
.header-score {
	font-size: 28px;
	font-weight: 800;
	letter-spacing: -0.02em;
	color: #F0F2F5;
	display: flex;
	align-items: center;
	gap: 8px;
	font-variant-numeric: tabular-nums;
}
.header-score .sep { color: #4B5563; font-size: 22px; }
.header-meta {
	font-size: 11px;
	color: #9CA3AF;
	margin: 0;
}

.shots {
	list-style: none;
	margin: 0;
	padding: 0;
	display: flex;
	flex-direction: column;
	gap: 8px;
}
.shot {
	display: grid;
	grid-template-columns: 24px 32px 1fr;
	align-items: center;
	gap: 10px;
	padding: 8px 4px;
	border-top: 1px solid rgba(255, 255, 255, 0.05);
}
.shot:first-child { border-top: none; }
.order {
	font-size: 10px;
	font-weight: 700;
	color: #6B7280;
	font-variant-numeric: tabular-nums;
}
.avatar {
	width: 32px;
	height: 32px;
	border-radius: 50%;
	background: var(--cell-gradient);
	display: flex;
	align-items: center;
	justify-content: center;
	color: white;
	font-size: 12px;
	font-weight: 800;
	border: 2px solid transparent;
	flex-shrink: 0;
}
.avatar.goal {
	border-color: rgba(132, 204, 22, 0.65);
	box-shadow: 0 0 0 2px rgba(132, 204, 22, 0.2);
}
.avatar.missed {
	border-color: rgba(226, 75, 74, 0.55);
	opacity: 0.55;
}

.line {
	display: flex;
	flex-direction: column;
	gap: 2px;
	min-width: 0;
}
.line-main {
	display: flex;
	align-items: center;
	gap: 8px;
	min-width: 0;
}
.team-tag {
	font-size: 9px;
	font-weight: 800;
	letter-spacing: 0.08em;
	padding: 2px 6px;
	border-radius: 4px;
	background: rgba(255, 255, 255, 0.05);
	color: #9CA3AF;
}
.team-tag.home { color: #E24B4A; background: rgba(226, 75, 74, 0.1); }
.team-tag.away { color: #84CC16; background: rgba(132, 204, 22, 0.1); }
.shooter {
	font-size: 13px;
	font-weight: 700;
	color: #F0F2F5;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
.line-meta {
	display: flex;
	align-items: center;
}
.result-pill {
	font-size: 10px;
	font-weight: 700;
	padding: 2px 8px;
	border-radius: 999px;
	letter-spacing: 0.04em;
}
.result-pill.goal {
	color: #84CC16;
	background: rgba(132, 204, 22, 0.12);
	border: 1px solid rgba(132, 204, 22, 0.32);
}
.result-pill.missed {
	color: #E24B4A;
	background: rgba(226, 75, 74, 0.1);
	border: 1px solid rgba(226, 75, 74, 0.32);
}
</style>
