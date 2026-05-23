<script>
import { getTranslate } from "@tolgee/svelte";
import TeamLogo from "$lib/components/ui/TeamLogo.svelte";

/**
 * Live-match hero: atmospheric red glow card with a centered "LIVE"
 * pulsing pill on top, then the two teams flanking the running score.
 * Matches the live-hero treatment from the new-game mockup.
 *
 * @type {{
 *   homeTeam: object|null,
 *   awayTeam: object|null,
 *   scoreHome: number,
 *   scoreAway: number,
 * }}
 */
let { homeTeam, awayTeam, scoreHome, scoreAway } = $props();

const { t } = getTranslate();
</script>

<header class="live-hero">
	<div class="pill-row">
		<span class="live-pill">
			<span class="pill-dot"></span>
			{$t("live_match.live_pill")}
		</span>
	</div>

	<div class="score-row">
		<div class="team-side">
			<div class="logo-wrap">
				<TeamLogo logoUrl={homeTeam?.logo_url} teamName={homeTeam?.name ?? "?"} size="sm" />
			</div>
			<div class="team-name">{homeTeam?.name ?? "—"}</div>
		</div>

		<div class="score">
			<span>{scoreHome}</span>
			<span class="sep">:</span>
			<span>{scoreAway}</span>
		</div>

		<div class="team-side right">
			<div class="logo-wrap">
				<TeamLogo logoUrl={awayTeam?.logo_url} teamName={awayTeam?.name ?? "?"} size="sm" />
			</div>
			<div class="team-name">{awayTeam?.name ?? "—"}</div>
		</div>
	</div>
</header>

<style>
.live-hero {
	position: relative;
	background: radial-gradient(ellipse at top, rgba(226, 75, 74, 0.14) 0%, transparent 60%),
		linear-gradient(180deg, #1A1F2A 0%, #131822 100%);
	border: 1px solid rgba(226, 75, 74, 0.22);
	border-radius: 18px;
	padding: 14px 16px;
	overflow: hidden;
}
.live-hero::before {
	content: '';
	position: absolute;
	top: 0; left: 0; right: 0; height: 2px;
	background: linear-gradient(90deg, transparent, #E24B4A 50%, transparent);
}
.pill-row {
	text-align: center;
	margin-bottom: 8px;
}
.live-pill {
	display: inline-flex; align-items: center; gap: 5px;
	background: rgba(226, 75, 74, 0.18);
	border: 1px solid rgba(226, 75, 74, 0.4);
	color: #E24B4A;
	font-size: 9px;
	font-weight: 800;
	padding: 3px 10px;
	border-radius: 999px;
	letter-spacing: 0.12em;
	text-transform: uppercase;
}
.pill-dot {
	width: 6px; height: 6px;
	border-radius: 50%;
	background: #E24B4A;
	animation: livePulse 1.4s ease-in-out infinite;
}
@keyframes livePulse {
	0%, 100% { opacity: 1; transform: scale(1); }
	50% { opacity: 0.4; transform: scale(0.9); }
}
.score-row {
	display: grid;
	grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
	align-items: center;
	gap: 10px;
}
.team-side {
	display: flex; align-items: center;
	gap: 8px;
	min-width: 0;
}
.team-side.right {
	justify-content: flex-end;
	flex-direction: row-reverse;
}
.logo-wrap {
	width: 32px; height: 32px;
	border-radius: 7px;
	background: rgba(255,255,255,0.04);
	border: 1px solid rgba(255,255,255,0.06);
	display: flex; align-items: center; justify-content: center;
	overflow: hidden;
	flex-shrink: 0;
}
.team-name {
	font-size: 13px;
	font-weight: 700;
	color: #E5E7EB;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
.score {
	display: flex; align-items: center; gap: 8px;
	font-size: 32px;
	font-weight: 800;
	line-height: 1;
	font-variant-numeric: tabular-nums;
	letter-spacing: -0.02em;
	color: #FFFFFF;
}
.score .sep {
	color: #4B5563;
	font-size: 26px;
}
</style>
