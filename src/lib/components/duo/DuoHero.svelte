<script>
import { getTranslate } from "@tolgee/svelte";
import ChemistryDonut from "./ChemistryDonut.svelte";
import DuoAvatars from "./DuoAvatars.svelte";
import SophieCard from "./SophieCard.svelte";

/**
 * Duo hero card with overlapping avatars, name/archetype, chemistry
 * donut (or pending placeholder) and a Sophie verdict.
 *
 * @type {{
 *   player1: object,
 *   player2: object,
 *   archetype: string|null,
 *   archetypeTentative?: boolean,
 *   chemistryScore: number|null,
 *   chemistryTrend?: number|null,
 *   rankInfo?: string|null,
 *   sophieQuote: string,
 * }}
 */
let {
	player1,
	player2,
	archetype,
	archetypeTentative = false,
	chemistryScore,
	chemistryTrend = null,
	rankInfo = null,
	sophieQuote,
} = $props();

const { t } = getTranslate();

const archetypeText = $derived.by(() => {
	if (!archetype) return $t("duo.archetype_placeholder");
	if (archetypeTentative) return `${archetype} (?)`;
	return archetype;
});
</script>

<div class="hero-duo">
	<div class="hero-title-bar">
		<div class="hero-title">⚡ {$t("duo.team_identity")}</div>
	</div>

	<div class="duo-faceoff">
		<div class="avatars-slot">
			<DuoAvatars {player1} {player2} />
		</div>
		<div class="duo-names-block">
			<div class="duo-name">{player1.username} &amp; {player2.username}</div>
			<div class="duo-archetype" class:tentative={archetypeTentative}>{archetypeText}</div>
		</div>
	</div>

	<ChemistryDonut score={chemistryScore} trendDelta={chemistryTrend} {rankInfo} />

	<div class="sophie-wrap">
		<SophieCard quote={sophieQuote} />
	</div>
</div>

<style>
.hero-duo {
	background: radial-gradient(ellipse at top right, rgba(132, 204, 22, 0.15) 0%, transparent 55%),
		linear-gradient(180deg, #1A1F2A 0%, #131822 100%);
	border: 1px solid rgba(132, 204, 22, 0.25);
	border-radius: 18px;
	padding: 20px 16px 16px;
	position: relative;
	overflow: hidden;
}
.hero-duo::before {
	content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
	background: linear-gradient(90deg, transparent, #84CC16 50%, transparent);
	opacity: 0.5;
}
.hero-title-bar {
	display: flex; justify-content: space-between; align-items: center;
	margin-bottom: 14px;
}
.hero-title {
	font-size: 10px; font-weight: 800;
	color: #84CC16;
	text-transform: uppercase; letter-spacing: 0.12em;
}
.duo-faceoff {
	display: flex; flex-direction: column;
	align-items: center;
	gap: 14px;
	position: relative; z-index: 1;
}
.avatars-slot {
	padding-bottom: 6px;
}
.duo-names-block {
	text-align: center;
}
.duo-name {
	font-size: 20px; font-weight: 800;
	color: #FFFFFF;
	letter-spacing: -0.01em;
	margin-bottom: 3px;
}
.duo-archetype {
	font-size: 12px;
	color: #84CC16;
	font-weight: 600;
	font-style: italic;
}
.duo-archetype.tentative { color: #9CA3AF; }
.sophie-wrap { margin-top: 16px; }
</style>
