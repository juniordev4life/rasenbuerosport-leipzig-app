<script>
import { getTranslate } from "@tolgee/svelte";

/**
 * Onboarding card shown in the duo "fresh" lifecycle (<5 matches).
 * Tells the user how many more matches unlock the full profile and
 * shows a small green progress bar.
 *
 * @type {{ matchCount: number, target?: number }}
 */
let { matchCount, target = 10 } = $props();

const { t } = getTranslate();

const remaining = $derived(Math.max(0, target - matchCount));
const progressRatio = $derived(Math.min(1, matchCount / target));
</script>

<div class="onboarding-card">
	<div class="onboarding-icon">⚽</div>
	<div class="onboarding-headline">
		{$t("duo.onboarding_headline", { remaining })}
	</div>
	<div class="onboarding-body">
		{$t("duo.onboarding_body")}
	</div>
	<div class="progress-pill">
		<span>{matchCount} / {target}</span>
		<div class="progress-bar-mini">
			<div class="progress-bar-mini-fill" style="width: {progressRatio * 100}%;"></div>
		</div>
	</div>
</div>

<style>
.onboarding-card {
	background: linear-gradient(135deg, rgba(132, 204, 22, 0.08), rgba(132, 204, 22, 0.02));
	border: 1px solid rgba(132, 204, 22, 0.25);
	border-radius: 14px;
	padding: 18px 16px;
	text-align: center;
	position: relative;
	overflow: hidden;
}
.onboarding-card::before {
	content: '';
	position: absolute;
	top: -30px; right: -30px;
	width: 100px; height: 100px;
	background: radial-gradient(circle, rgba(132, 204, 22, 0.15), transparent 70%);
	border-radius: 50%;
}
.onboarding-icon { font-size: 28px; margin-bottom: 10px; position: relative; z-index: 1; }
.onboarding-headline {
	font-size: 15px;
	font-weight: 800;
	color: #FFFFFF;
	margin-bottom: 6px;
	position: relative; z-index: 1;
}
.onboarding-body {
	font-size: 12px;
	color: #9CA3AF;
	line-height: 1.5;
	position: relative; z-index: 1;
}
.progress-pill {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	background: rgba(132, 204, 22, 0.12);
	border: 1px solid rgba(132, 204, 22, 0.3);
	padding: 6px 12px;
	border-radius: 999px;
	margin-top: 12px;
	font-size: 11px;
	font-weight: 700;
	color: #84CC16;
	position: relative; z-index: 1;
}
.progress-bar-mini {
	width: 80px; height: 4px;
	background: rgba(255,255,255,0.06);
	border-radius: 2px;
	overflow: hidden;
}
.progress-bar-mini-fill {
	height: 100%;
	background: linear-gradient(90deg, #84CC16, #65A30D);
	border-radius: 2px;
}
</style>
