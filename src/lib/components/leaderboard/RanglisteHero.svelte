<script>
import { getTranslate } from "@tolgee/svelte";
import LightningIcon from "$lib/components/icons/LightningIcon.svelte";
import TrophyIcon from "$lib/components/icons/TrophyIcon.svelte";
import PlayerAvatar from "$lib/components/ui/PlayerAvatar.svelte";
import Sparkline from "./Sparkline.svelte";
import TrendPill from "./TrendPill.svelte";

/**
 * The season leader of the Skill-Rating view: label, avatar, name,
 * season record, rating with its changes and a sparkline. Reads
 * "Spitzenreiter" while the season is running, "<edition>-Meister"
 * once it is closed. A win streak of 3+ shows as a gold chip.
 *
 * Design A: plain content inside the page's red hero band (white text,
 * white avatar tile). Design B: a white card with a gold header strip,
 * a gold-ringed avatar with a captain's armband and a green sparkline.
 *
 * @type {{
 *   player: {
 *     player_id: string, username: string, avatar_url: string|null,
 *     rating: number, delta_season: number, delta_week: number,
 *     history: number[], wins: number, draws: number, losses: number,
 *     games: number, streak: { type: "W"|"D"|"L", count: number }|null,
 *   },
 *   season: { isCurrent: boolean, gameVersion: string },
 * }}
 */
let { player, season } = $props();

const { t } = getTranslate();

const winStreak = $derived(
	player.streak?.type === "W" && player.streak.count >= 3
		? player.streak.count
		: null,
);

const label = $derived(
	season.isCurrent
		? $t("leaderboard.hero_label")
		: $t("leaderboard.hero_label_closed", { version: season.gameVersion }),
);
</script>

<section class="leader" aria-label={label}>
	<p class="leader-label">
		<TrophyIcon size={20} strokeWidth={2} />
		<span>{label}</span>
	</p>

	<div class="leader-who">
		<span class="leader-pic">
			<PlayerAvatar {player} size={64} class="leader-avatar" />
			<span class="captain" aria-hidden="true">C</span>
		</span>
		<div class="flex flex-col gap-1.5 min-w-0">
			<h2 class="leader-name">{player.username}</h2>
			<p class="leader-record">
				{player.wins}
				{$t("leaderboard.w_short")} · {player.draws}
				{$t("leaderboard.d_short")} · {player.losses}
				{$t("leaderboard.l_short")} · {player.games}
				{$t("leaderboard.games_short")}
			</p>
			{#if winStreak}
				<span class="chip chip-gold streak">
					<LightningIcon size={12} strokeWidth={2.4} />
					{winStreak}{$t("leaderboard.streak_suffix")}
				</span>
			{/if}
		</div>
	</div>

	<div class="leader-rating">
		<div class="flex flex-col items-start gap-2 min-w-0">
			<span class="num leader-elo">{player.rating ?? "—"}</span>
			<div class="flex flex-wrap items-center gap-x-3 gap-y-1.5">
				<TrendPill
					delta={player.delta_season}
					variant="pill"
					suffix={$t("leaderboard.since_season_start")}
				/>
				{#if season.isCurrent}
					<TrendPill
						delta={player.delta_week}
						variant="pill"
						suffix={$t("leaderboard.this_week")}
					/>
				{/if}
			</div>
		</div>
		<div class="leader-spark">
			<Sparkline points={player.history} width={140} height={56} strokeWidth={2.5} area fluid />
		</div>
	</div>
</section>

<style>
/* ── Design A: content on the red hero band ─────────────────────────── */
.leader {
	display: flex;
	flex-direction: column;
	gap: 14px;
	min-width: 0;
}

.leader-label {
	display: flex;
	align-items: center;
	gap: 8px;
	margin: 0;
	font-family: var(--font-cond);
	font-weight: 700;
	font-size: 14px;
	letter-spacing: 0.03em;
	text-transform: uppercase;
}

.leader-who {
	display: flex;
	align-items: center;
	gap: 14px;
}

.leader-pic {
	position: relative;
	display: flex;
	flex-shrink: 0;
}

:global([data-variant="a"]) .leader-pic :global(.leader-avatar) {
	--avatar-bg: var(--color-surface);
	--avatar-fg: var(--color-ink);
}

.captain {
	display: none;
}

.leader-name {
	margin: 0;
	font-family: var(--font-display);
	font-weight: 400;
	font-size: 38px;
	line-height: 0.85;
	text-transform: uppercase;
	overflow-wrap: anywhere;
}

.leader-record {
	margin: 0;
	font-size: 14px;
}

.streak {
	align-self: flex-start;
}

.leader-rating {
	display: flex;
	align-items: flex-end;
	justify-content: space-between;
	gap: 12px;
}

.leader-elo {
	font-size: 76px;
	line-height: 0.8;
}

.leader-spark {
	flex: 1;
	max-width: 160px;
	min-width: 96px;
	--spark-area-opacity: 0;
}

/* ── Design B: a white card with a gold header strip ────────────────── */
:global([data-variant="b"]) .leader {
	gap: 12px;
	padding: 0 18px 18px;
	overflow: hidden;
	background: var(--color-surface);
	color: var(--color-ink);
	border-radius: var(--radius-card);
	box-shadow: var(--shadow-card);
	text-shadow: none;
}

:global([data-variant="b"]) .leader-label {
	margin: 0 -18px 4px;
	padding: 8px 18px;
	background: var(--color-gold);
	color: var(--color-on-gold);
	font-weight: 800;
	font-size: 17px;
	letter-spacing: 0;
	text-transform: none;
}

:global([data-variant="b"]) .leader-pic :global(.leader-avatar) {
	box-shadow: 0 0 0 4px var(--color-gold);
}

:global([data-variant="b"]) .captain {
	position: absolute;
	right: -8px;
	bottom: -2px;
	display: block;
	padding: 1px 6px;
	border: 2px solid var(--color-surface);
	border-radius: 6px;
	background: var(--color-navy);
	color: var(--color-gold);
	font-family: var(--font-cond);
	font-weight: 800;
	font-size: 13px;
	line-height: 1.2;
}

:global([data-variant="b"]) .leader-name {
	font-family: var(--font-cond);
	font-weight: 800;
	font-size: 30px;
	line-height: 1;
	text-transform: none;
}

:global([data-variant="b"]) .leader-record {
	font-size: 13px;
	color: var(--color-muted);
}

:global([data-variant="b"]) .leader-elo {
	font-size: 64px;
	line-height: 0.9;
}

:global([data-variant="b"]) .leader-spark {
	color: var(--color-win);
	--spark-area-opacity: 0.14;
}
</style>
