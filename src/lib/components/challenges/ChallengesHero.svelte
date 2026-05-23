<script>
import { getTranslate } from "@tolgee/svelte";
import ProgressDonut from "./ProgressDonut.svelte";

/**
 * Atmospheric header for the Challenges page. Mini-tag + countdown
 * pill on top, title + static subtitle, and a progress row with the
 * SVG donut plus a dynamic status text.
 *
 * @type {{
 *   completed: number,
 *   total: number,
 *   countdownText: string,
 *   statusHeadline: string,
 *   statusDetail: string,
 * }}
 */
let {
	completed = 0,
	total = 3,
	countdownText = "—",
	statusHeadline = "",
	statusDetail = "",
} = $props();

const { t } = getTranslate();
</script>

<div class="hero">
	<div class="title-bar">
		<div class="tag">★ {$t("challenges.hero_tag")}</div>
		<div class="countdown">⏱ {$t("challenges.ends_in")} {countdownText}</div>
	</div>

	<h1 class="title">{$t("challenges.title")}</h1>
	<p class="subtitle">{$t("challenges.subtitle")}</p>

	<div class="progress-row">
		<ProgressDonut {completed} {total} size={56} />
		<div class="stats">
			<div class="stats-headline">{statusHeadline}</div>
			<div class="stats-detail">{statusDetail}</div>
		</div>
	</div>
</div>

<style>
.hero {
	position: relative;
	background: radial-gradient(ellipse at top right, rgba(245, 158, 11, 0.18) 0%, transparent 55%),
		linear-gradient(180deg, #1A1F2A 0%, #131822 100%);
	border: 1px solid rgba(245, 158, 11, 0.25);
	border-radius: 18px;
	padding: 16px;
	overflow: hidden;
}
.hero::before {
	content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
	background: linear-gradient(90deg, transparent, #F59E0B 50%, transparent);
	opacity: 0.6;
}
.title-bar {
	display: flex; justify-content: space-between; align-items: center;
	margin-bottom: 12px;
	gap: 8px;
}
.tag {
	font-size: 10px; font-weight: 800;
	color: #F59E0B;
	text-transform: uppercase; letter-spacing: 0.12em;
}
.countdown {
	background: rgba(245, 158, 11, 0.15);
	border: 1px solid rgba(245, 158, 11, 0.3);
	color: #F59E0B;
	font-size: 10px; font-weight: 700;
	padding: 3px 9px;
	border-radius: 999px;
	white-space: nowrap;
}
.title {
	font-size: 22px;
	font-weight: 800;
	letter-spacing: -0.02em;
	color: #FFFFFF;
	margin: 0 0 4px;
}
.subtitle {
	font-size: 12px;
	color: #9CA3AF;
	margin: 0 0 14px;
	line-height: 1.4;
}
.progress-row {
	display: flex; align-items: center; gap: 14px;
	padding-top: 12px;
	border-top: 1px solid rgba(255,255,255,0.06);
	position: relative; z-index: 1;
}
.stats { flex: 1; min-width: 0; }
.stats-headline {
	font-size: 14px;
	font-weight: 800;
	color: #FFFFFF;
	margin-bottom: 2px;
}
.stats-detail {
	font-size: 11px;
	color: #9CA3AF;
	line-height: 1.4;
}
</style>
