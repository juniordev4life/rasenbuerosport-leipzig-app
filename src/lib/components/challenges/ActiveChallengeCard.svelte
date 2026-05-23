<script>
import { getTranslate } from "@tolgee/svelte";
import {
	difficultyBucket,
	progressState,
} from "$lib/utils/challengeStatus.utils.js";

/**
 * Single active challenge tile. Border-left signals the difficulty
 * bucket (leicht/mittel/schwer), the progress bar switches between
 * done / in-progress / behind, and a contextual meta line on the
 * right tells the user how far off the target they are.
 *
 * @type {{
 *   challenge: {
 *     metric: string,
 *     emoji?: string|null,
 *     difficulty: "easy"|"medium"|"hard",
 *     label_de: string, label_en: string,
 *     description_de?: string|null, description_en?: string|null,
 *     progress: { current: number, target: number, completed: boolean },
 *   },
 *   hoursRemaining: number,
 *   locale: "de"|"en",
 * }}
 */
let { challenge, hoursRemaining = 7 * 24, locale = "de" } = $props();

const { t } = getTranslate();

const bucket = $derived(difficultyBucket(challenge.difficulty));
const state = $derived(progressState(challenge.progress, hoursRemaining));

const label = $derived(
	locale === "en"
		? (challenge.label_en ?? challenge.label_de)
		: (challenge.label_de ?? challenge.label_en),
);
const description = $derived(
	locale === "en" ? challenge.description_en : challenge.description_de,
);

const current = $derived(challenge.progress?.current ?? 0);
const target = $derived(challenge.progress?.target ?? 1);
const completed = $derived(challenge.progress?.completed ?? false);
const remaining = $derived(Math.max(0, target - current));
const pct = $derived(
	target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0,
);

const metaLeft = $derived(`${current} / ${target}`);
const metaRight = $derived.by(() => {
	if (completed) return { text: $t("challenges.done_label"), tone: "done" };
	if (state === "behind") {
		return { text: $t("challenges.behind_label"), tone: "behind" };
	}
	return {
		text: $t("challenges.remaining_label", { count: remaining }),
		tone: "in-progress",
	};
});
</script>

<div class="card {bucket}" class:completed>
	<div class="head">
		<div class="icon">{challenge.emoji ?? "🎯"}</div>
		<div class="head-text">
			<div class="name">{label}</div>
			{#if description}
				<div class="desc">{description}</div>
			{/if}
		</div>
		<div class="difficulty-pill {bucket}">{$t(`challenges.difficulty.${bucket}`)}</div>
	</div>

	<div class="bar-track">
		<div class="bar-fill {state}" style="width: {pct}%;"></div>
	</div>

	<div class="meta">
		<span class="current {completed ? 'done' : ''}">{metaLeft}</span>
		<span class="status {metaRight.tone}">
			{#if completed}✓ {/if}{metaRight.text}
		</span>
	</div>
</div>

<style>
.card {
	background: #131822;
	border: 1px solid #1F2937;
	border-radius: 14px;
	padding: 12px 14px;
	transition: background-color .15s;
}
.card.leicht { border-left: 3px solid #84CC16; }
.card.mittel { border-left: 3px solid #F59E0B; }
.card.schwer { border-left: 3px solid #E24B4A; }
.card.completed {
	background: linear-gradient(180deg, rgba(132, 204, 22, 0.05), #131822);
}
.head {
	display: flex; align-items: flex-start; gap: 10px;
	margin-bottom: 10px;
}
.icon {
	width: 32px; height: 32px;
	border-radius: 10px;
	background: rgba(255,255,255,0.04);
	display: flex; align-items: center; justify-content: center;
	font-size: 18px;
	flex-shrink: 0;
}
.head-text { flex: 1; min-width: 0; }
.name {
	font-size: 13px;
	font-weight: 800;
	color: #E5E7EB;
	margin-bottom: 2px;
}
.desc {
	font-size: 11px;
	color: #9CA3AF;
	line-height: 1.35;
}
.difficulty-pill {
	font-size: 9px;
	font-weight: 800;
	text-transform: uppercase;
	letter-spacing: 0.08em;
	padding: 3px 8px;
	border-radius: 999px;
	white-space: nowrap;
	flex-shrink: 0;
}
.difficulty-pill.leicht {
	background: rgba(132, 204, 22, 0.12);
	color: #84CC16;
	border: 1px solid rgba(132, 204, 22, 0.3);
}
.difficulty-pill.mittel {
	background: rgba(245, 158, 11, 0.12);
	color: #F59E0B;
	border: 1px solid rgba(245, 158, 11, 0.3);
}
.difficulty-pill.schwer {
	background: rgba(226, 75, 74, 0.12);
	color: #E24B4A;
	border: 1px solid rgba(226, 75, 74, 0.3);
}
.bar-track {
	height: 6px;
	background: rgba(255,255,255,0.05);
	border-radius: 3px;
	overflow: hidden;
	margin-bottom: 6px;
}
.bar-fill {
	height: 100%;
	border-radius: 3px;
	transition: width 0.4s ease;
}
.bar-fill.done {
	background: linear-gradient(90deg, #84CC16, #65A30D);
}
.bar-fill.in-progress {
	background: linear-gradient(90deg, #F59E0B, #D97706);
}
.bar-fill.behind {
	background: linear-gradient(90deg, #E24B4A, #C73E3D);
}
.meta {
	display: flex; justify-content: space-between;
	font-size: 11px;
	font-weight: 700;
	font-variant-numeric: tabular-nums;
}
.current { color: #9CA3AF; }
.current.done { color: #84CC16; }
.status.done { color: #84CC16; }
.status.in-progress { color: #F59E0B; }
.status.behind { color: #E24B4A; }
</style>
