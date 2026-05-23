<script>
import { getTranslate } from "@tolgee/svelte";
import SophieCard from "$lib/components/duo/SophieCard.svelte";

/**
 * Hero card for the H2H detail. Faceoff with both players, the
 * head-to-head score in the middle, optional crown over the leader
 * and the Marcel verdict at the bottom.
 *
 * @type {{
 *   playerA: { id: string, username: string, avatarUrl: string|null, initials: string, archetype: string|null, elo: number|null, rank: number|null },
 *   playerB: { id: string, username: string, avatarUrl: string|null, initials: string, archetype: string|null, elo: number|null, rank: number|null },
 *   winsA: number,
 *   winsB: number,
 *   draws: number,
 *   streakLeader?: string|null,
 *   streakCount?: number|null,
 *   marcelQuote: string,
 * }}
 */
let {
	playerA,
	playerB,
	winsA,
	winsB,
	draws,
	streakLeader = null,
	streakCount = null,
	marcelQuote,
} = $props();

const { t } = getTranslate();

const COLOR_A = "#F59E0B";
const COLOR_B = "#06B6D4";

const crownOn = $derived.by(() => {
	if (Math.abs(winsA - winsB) < 2) return null;
	return winsA > winsB ? "a" : "b";
});

const streakLabel = $derived(
	streakLeader && streakCount && streakCount >= 2
		? `${"\u{1F525}"} ${streakCount} ${$t("compare.in_a_row")}`
		: null,
);
</script>

<div class="hero">
	<div class="title-bar">
		<div class="title-tag">⚔ {$t("compare.h2h_tag")}</div>
		{#if streakLabel}
			<div class="streak">{streakLabel}</div>
		{/if}
	</div>

	<div class="faceoff">
		<div class="side side-a">
			{#if crownOn === "a"}<div class="crown" aria-hidden="true">{"\u{1F451}"}</div>{/if}
			<div class="avatar" style="background: linear-gradient(135deg, {COLOR_A}, #D97706); border-color: {COLOR_A}66;">
				{#if playerA.avatarUrl}
					<img src={playerA.avatarUrl} alt={playerA.username} />
				{:else}
					<span>{playerA.initials}</span>
				{/if}
			</div>
			<div class="name">{playerA.username}</div>
			{#if playerA.archetype}
				<div class="archetype">{playerA.archetype}</div>
			{/if}
			<div class="elo-row" style="color: {COLOR_A};">
				{playerA.elo ?? "—"}
				{#if playerA.rank}<span class="rank">· #{playerA.rank}</span>{/if}
			</div>
		</div>

		<div class="score-block">
			<div class="score-num" style="color: {winsA > winsB ? COLOR_A : '#6B7280'}">{winsA}</div>
			<div class="score-sep">:</div>
			<div class="score-num" style="color: {winsB > winsA ? COLOR_B : '#6B7280'}">{winsB}</div>
		</div>

		<div class="side side-b">
			{#if crownOn === "b"}<div class="crown" aria-hidden="true">{"\u{1F451}"}</div>{/if}
			<div class="avatar" style="background: linear-gradient(135deg, {COLOR_B}, #0891B2); border-color: {COLOR_B}66;">
				{#if playerB.avatarUrl}
					<img src={playerB.avatarUrl} alt={playerB.username} />
				{:else}
					<span>{playerB.initials}</span>
				{/if}
			</div>
			<div class="name">{playerB.username}</div>
			{#if playerB.archetype}
				<div class="archetype">{playerB.archetype}</div>
			{/if}
			<div class="elo-row" style="color: {COLOR_B};">
				{playerB.elo ?? "—"}
				{#if playerB.rank}<span class="rank">· #{playerB.rank}</span>{/if}
			</div>
		</div>
	</div>

	<div class="marcel-wrap">
		<SophieCard quote={marcelQuote} />
	</div>
</div>

<style>
.hero {
	background: radial-gradient(ellipse at top left, rgba(245, 158, 11, 0.10) 0%, transparent 50%),
		radial-gradient(ellipse at top right, rgba(6, 182, 212, 0.10) 0%, transparent 50%),
		linear-gradient(180deg, #1A1F2A 0%, #131822 100%);
	border: 1px solid rgba(255,255,255,0.06);
	border-radius: 18px;
	padding: 16px;
	position: relative;
	overflow: hidden;
}
.hero::before {
	content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
	background: linear-gradient(90deg, #F59E0B 0%, transparent 50%, #06B6D4 100%);
	opacity: 0.5;
}
.title-bar {
	display: flex; justify-content: space-between; align-items: center;
	margin-bottom: 14px;
}
.title-tag {
	font-size: 10px; font-weight: 800;
	color: #E5E7EB;
	text-transform: uppercase; letter-spacing: 0.12em;
}
.streak {
	background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.1));
	border: 1px solid rgba(245, 158, 11, 0.3);
	color: #F59E0B;
	font-size: 10px;
	font-weight: 700;
	padding: 3px 8px;
	border-radius: 999px;
}
.faceoff {
	display: grid;
	grid-template-columns: minmax(0, 1fr) 76px minmax(0, 1fr);
	gap: 8px;
	align-items: center;
	width: 100%;
}
.side {
	position: relative;
	display: flex; flex-direction: column;
	align-items: center;
	gap: 4px;
	text-align: center;
	min-width: 0;
	max-width: 100%;
}
.crown {
	position: absolute;
	top: -14px; left: 50%; transform: translateX(-50%);
	font-size: 18px;
	filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));
	z-index: 2;
}
.avatar {
	width: 60px; height: 60px;
	border-radius: 50%;
	border: 3px solid;
	display: flex; align-items: center; justify-content: center;
	color: white;
	font-size: 22px;
	font-weight: 800;
	overflow: hidden;
	box-shadow: 0 4px 12px rgba(0,0,0,0.4);
}
.avatar img { width: 100%; height: 100%; object-fit: cover; }
.name {
	font-size: 14px;
	font-weight: 800;
	color: #FFFFFF;
	width: 100%;
	max-width: 100%;
	overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.archetype {
	font-size: 10px;
	color: #9CA3AF;
	font-style: italic;
	width: 100%;
	max-width: 100%;
	overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.elo-row {
	font-size: 13px;
	font-weight: 800;
	font-variant-numeric: tabular-nums;
}
.elo-row .rank {
	color: #6B7280;
	font-weight: 600;
	margin-left: 2px;
}
.score-block {
	display: flex; flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 2px;
	width: 100%;
}
.score-num {
	font-size: 36px;
	font-weight: 800;
	line-height: 1;
	font-variant-numeric: tabular-nums;
}
.score-sep {
	font-size: 14px;
	color: #4B5563;
	margin-top: -4px;
}
.score-meta {
	font-size: 9px;
	color: #6B7280;
	text-transform: uppercase;
	letter-spacing: 0.08em;
	font-weight: 700;
	margin-top: 4px;
}
.marcel-wrap { margin-top: 14px; }
</style>
