<script>
import { getTranslate } from "@tolgee/svelte";
import { avatarGradient } from "$lib/utils/avatarColor.utils.js";
import Sparkline from "./Sparkline.svelte";
import TrendPill from "./TrendPill.svelte";

/**
 * Top-of-page hero card for the #1 player of the Skill-Rating view.
 * Reads "Spitzenreiter" while the season is running, "<edition>-
 * Meister" (crown) once the season is closed — the crown always
 * shows, only the label copy changes.
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
const initial = $derived((player.username ?? "?").charAt(0).toUpperCase());
const fallbackGradient = $derived(
	avatarGradient(player.player_id ?? player.username).gradient,
);
</script>

<div class="relative rounded-2xl border border-gold/30 bg-surface p-4 overflow-hidden">
	<div class="flex items-center gap-3.5">
		<div class="relative shrink-0">
			<span
				aria-hidden="true"
				class="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[22px] drop-shadow z-10"
			>{"\u{1F451}"}</span>
			{#if player.avatar_url}
				<img referrerpolicy="no-referrer"
					src={player.avatar_url}
					alt={player.username}
					class="w-[70px] h-[70px] rounded-full object-cover border-[3px] border-gold/50 shadow-lg"
				/>
			{:else}
				<div
					class="w-[70px] h-[70px] rounded-full flex items-center justify-center text-2xl font-extrabold text-white border-[3px] border-gold/50 shadow-lg"
					style:background={fallbackGradient}
				>
					{initial}
				</div>
			{/if}
		</div>
		<div class="flex-1 min-w-0">
			<div class="text-[9px] font-extrabold uppercase tracking-widest text-brand mb-0.5">
				{"★"}
				{season.isCurrent
					? $t("leaderboard.hero_label")
					: $t("leaderboard.hero_label_closed", { version: season.gameVersion })}
			</div>
			<h2 class="text-[19px] font-extrabold tracking-tight text-ink truncate">
				{player.username}
			</h2>
		</div>
	</div>

	<div class="flex items-center justify-between gap-3.5 mt-3.5">
		<div class="flex flex-col items-start gap-2">
			<div class="text-[42px] font-extrabold leading-none tabular-nums tracking-tight text-ink">
				{player.rating ?? "—"}
			</div>
			<div class="flex flex-wrap items-center gap-1.5">
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
		<div class="flex-1 max-w-[200px] h-14">
			<Sparkline
				points={player.history}
				width={200}
				height={56}
				stroke="var(--color-win)"
				strokeWidth={2}
				opacity={1}
				fluid
			/>
		</div>
	</div>

	<div class="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-line">
		<span class="text-[11px] text-muted tabular-nums">
			<strong class="text-ink font-bold">{player.wins}</strong>{$t("leaderboard.w_short")}
		</span>
		<span class="text-line">·</span>
		<span class="text-[11px] text-muted tabular-nums">
			<strong class="text-ink font-bold">{player.draws}</strong>{$t("leaderboard.d_short")}
		</span>
		<span class="text-line">·</span>
		<span class="text-[11px] text-muted tabular-nums">
			<strong class="text-ink font-bold">{player.losses}</strong>{$t("leaderboard.l_short")}
		</span>
		<span class="text-line">·</span>
		<span class="text-[11px] text-muted tabular-nums">
			<strong class="text-ink font-bold">{player.games}</strong> {$t("leaderboard.games_short")}
		</span>
		{#if winStreak}
			<span
				class="ml-auto inline-flex items-center gap-1 rounded-full border border-gold/30 bg-gold/10 px-2 py-1 text-[10px] font-bold text-brand"
			>
				{"\u{1F525}"} {winStreak}{$t("leaderboard.streak_suffix")}
			</span>
		{/if}
	</div>
</div>
