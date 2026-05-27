<script>
import { getTranslate } from "@tolgee/svelte";
import Sparkline from "$lib/components/leaderboard/Sparkline.svelte";
import TrendPill from "$lib/components/leaderboard/TrendPill.svelte";
import InfoTip from "$lib/components/ui/InfoTip.svelte";
import { avatarGradient } from "$lib/utils/avatarColor.utils.js";
import MarcelCard from "./MarcelCard.svelte";

/**
 * Profile hero: red-glow card with title bar, big avatar, archetype
 * line, ELO + sparkline + week trend, Marcel character verdict and
 * the W/D/L/Win-Rate stats row.
 *
 * @type {{
 *   playerId: string|null,
 *   username: string,
 *   initials: string,
 *   avatarUrl: string|null,
 *   archetype: string|null,
 *   rank: number|null,
 *   matchCount: number,
 *   currentRating: number|null,
 *   ratings: number[],
 *   weekDelta: number,
 *   wins: number,
 *   draws: number,
 *   losses: number,
 *   marcelQuote: string,
 * }}
 */
let {
	playerId,
	username,
	initials,
	avatarUrl,
	archetype,
	rank,
	matchCount,
	currentRating,
	ratings,
	weekDelta,
	wins,
	draws,
	losses,
	marcelQuote,
} = $props();

const { t } = getTranslate();

const gradient = $derived(avatarGradient(playerId ?? username));

const decided = $derived(wins + losses);
const winRate = $derived(decided > 0 ? Math.round((wins / decided) * 100) : 0);
</script>

<div class="hero-profile">
	<div class="hero-title-bar">
		<div class="hero-title-tag">★ {$t("profile.hero_tag")}</div>
		{#if rank != null}
			<div class="rank-pill">{$t("profile.rank_short")} #{rank} · {matchCount} {$t("profile.games_short")}</div>
		{:else}
			<div class="rank-pill">{matchCount} {$t("profile.games_short")}</div>
		{/if}
	</div>

	<div class="hero-top">
		<div
			class="hero-avatar"
			style="background: {gradient.gradient}; border-color: {gradient.from}66;"
		>
			{#if avatarUrl}
				<img src={avatarUrl} alt={username} />
			{:else}
				<span>{initials}</span>
			{/if}
		</div>
		<div class="hero-identity">
			<div class="hero-name">{username}</div>
			<div class="hero-archetype-row">
				{#if archetype}
					<span class="hero-archetype">{archetype}</span>
				{:else}
					<span class="hero-archetype">{$t("profile.archetype_placeholder")}</span>
				{/if}
				<InfoTip titleKey="info_tips.archetype.title" bodyKey="info_tips.archetype.body" />
			</div>
		</div>
	</div>

	<div class="elo-row">
		<div class="elo-left">
			<div class="elo-value-row">
				<div class="elo-value">{currentRating ?? "—"}</div>
				<InfoTip titleKey="info_tips.elo.title" bodyKey="info_tips.elo.body" />
			</div>
			<TrendPill delta={weekDelta} variant="pill" suffix={$t("profile.this_week")} />
		</div>
		<div class="hero-sparkline">
			<Sparkline
				points={ratings}
				width={220}
				height={56}
				stroke="#E24B4A"
				fillId="profileHeroSpark"
				strokeWidth={2}
				opacity={1}
				fluid
			/>
		</div>
	</div>

	<div class="marcel-wrap">
		<MarcelCard quote={marcelQuote} />
	</div>

	<div class="hero-stats-row">
		<span class="hero-stat"><strong>{wins}</strong>{$t("profile.w_short")}</span>
		<span class="hero-stat-divider">·</span>
		<span class="hero-stat"><strong>{draws}</strong>{$t("profile.d_short")}</span>
		<span class="hero-stat-divider">·</span>
		<span class="hero-stat"><strong>{losses}</strong>{$t("profile.l_short")}</span>
		<span class="hero-stat-divider">·</span>
		<span class="hero-stat"><strong>{winRate}%</strong> {$t("profile.win_rate")}</span>
	</div>
</div>

<style>
.hero-profile {
	background: radial-gradient(ellipse at top right, rgba(226, 75, 74, 0.15) 0%, transparent 55%),
		linear-gradient(180deg, #1A1F2A 0%, #131822 100%);
	border: 1px solid rgba(226, 75, 74, 0.25);
	border-radius: 18px;
	padding: 20px 16px 16px;
	position: relative;
	overflow: hidden;
}
.hero-profile::before {
	content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
	background: linear-gradient(90deg, transparent, #E24B4A 50%, transparent);
	opacity: 0.5;
}
.hero-title-bar {
	display: flex; justify-content: space-between; align-items: center;
	margin-bottom: 14px;
}
.hero-title-tag {
	font-size: 10px; font-weight: 800;
	color: #E24B4A;
	text-transform: uppercase; letter-spacing: 0.12em;
}
.rank-pill {
	background: rgba(226, 75, 74, 0.15);
	border: 1px solid rgba(226, 75, 74, 0.3);
	color: #E24B4A;
	font-size: 10px; font-weight: 800;
	padding: 3px 9px; border-radius: 999px;
	letter-spacing: 0.04em;
	white-space: nowrap;
}
.hero-top {
	display: flex; align-items: center; gap: 14px;
	margin-bottom: 14px;
}
.hero-avatar {
	width: 72px; height: 72px;
	border-radius: 50%;
	border: 3px solid;
	flex-shrink: 0;
	box-shadow: 0 6px 18px rgba(0,0,0,0.4);
	display: flex; align-items: center; justify-content: center;
	font-size: 28px; font-weight: 800; color: white;
	overflow: hidden;
}
.hero-avatar img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
.hero-identity { flex: 1; min-width: 0; }
.hero-name {
	font-size: 22px; font-weight: 800;
	margin: 0 0 3px;
	letter-spacing: -0.01em;
	color: #FFFFFF;
}
.hero-archetype {
	font-size: 13px;
	color: #E24B4A;
	font-weight: 600;
	font-style: italic;
}
.elo-row {
	display: flex; justify-content: space-between; align-items: center;
	gap: 14px;
	position: relative; z-index: 1;
}
.elo-left { display: flex; flex-direction: column; gap: 8px; }
.elo-value-row { display: flex; align-items: baseline; gap: 6px; }
.hero-archetype-row { display: flex; align-items: center; gap: 4px; }
.elo-value {
	font-size: 42px; font-weight: 800;
	line-height: 1;
	color: #FFFFFF;
	font-variant-numeric: tabular-nums;
	letter-spacing: -0.02em;
}
/* Sparkline fills the space between the ELO block and the card edge
 * instead of clinging to a fixed 110 px. flex:1 lets it grow, the
 * min/max bounds keep it sensible on very narrow or very wide screens.
 * Trend graph reads better with more horizontal real-estate. */
.hero-sparkline { flex: 1 1 auto; min-width: 110px; max-width: 240px; height: 56px; }
.marcel-wrap { margin-top: 14px; }
.hero-stats-row {
	display: flex; gap: 8px;
	margin-top: 12px;
	padding-top: 12px;
	border-top: 1px solid rgba(255,255,255,0.06);
	position: relative; z-index: 1;
	flex-wrap: wrap;
}
.hero-stat { font-size: 11px; color: #9CA3AF; font-variant-numeric: tabular-nums; }
.hero-stat strong { color: #E5E7EB; font-weight: 700; }
.hero-stat-divider { color: #4B5563; }
</style>
