<script>
import { getTranslate } from "@tolgee/svelte";
import BallIcon from "$lib/components/icons/BallIcon.svelte";
import CheckIcon from "$lib/components/icons/CheckIcon.svelte";
import FootballIcon from "$lib/components/icons/FootballIcon.svelte";
import HistoryIcon from "$lib/components/icons/HistoryIcon.svelte";
import LightningIcon from "$lib/components/icons/LightningIcon.svelte";
import ShieldIcon from "$lib/components/icons/ShieldIcon.svelte";
import TargetIcon from "$lib/components/icons/TargetIcon.svelte";
import TrophyIcon from "$lib/components/icons/TrophyIcon.svelte";
import UsersIcon from "$lib/components/icons/UsersIcon.svelte";
import {
	difficultyBucket,
	progressState,
} from "$lib/utils/challengeStatus.utils.js";

/**
 * One active challenge: a line icon for its metric, name, description
 * and difficulty, a progress bar and the state underneath ("2 to go",
 * "close call" or "done" with a check). Design B adds the ball riding
 * the bar and the trophy at its end, like the home card.
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

/** Line icon per challenge metric (the API's emoji are not UI icons). */
const METRIC_ICONS = {
	goals_scored: TargetIcon,
	clean_sheets: ShieldIcon,
	wins: TrophyIcon,
	games_played: BallIcon,
	hattricks: LightningIcon,
	comeback_wins: HistoryIcon,
	duo_wins: UsersIcon,
};

const DIFFICULTY_CHIP = {
	leicht: "chip-win",
	mittel: "chip-gold",
	schwer: "chip-loss",
};

const MetricIcon = $derived(METRIC_ICONS[challenge.metric] ?? TargetIcon);
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

<article class="card challenge" class:completed>
	<div class="head">
		<span class="tile icon" aria-hidden="true"><MetricIcon size={20} strokeWidth={2} /></span>
		<div class="flex-1 min-w-0">
			<h2 class="name">{label}</h2>
			{#if description}
				<p class="desc">{description}</p>
			{/if}
		</div>
		<span class="chip difficulty {DIFFICULTY_CHIP[bucket]}">
			{$t(`challenges.difficulty.${bucket}`)}
		</span>
	</div>

	<div class="bar-row">
		<div class="bar">
			<div class="progress {state}"><span style="width: {pct}%"></span></div>
			<span class="ball" style="left: calc((100% - 20px) * {pct / 100})" aria-hidden="true">
				<FootballIcon size={20} />
			</span>
		</div>
		<span class="goal" aria-hidden="true"><TrophyIcon size={18} strokeWidth={2} /></span>
	</div>

	<div class="meta">
		<span class="fraction">{metaLeft}</span>
		<span class="status {metaRight.tone}">
			{#if completed}<CheckIcon size={13} strokeWidth={3} />{/if}
			{metaRight.text}
		</span>
	</div>
</article>

<style>
.challenge {
	display: flex;
	flex-direction: column;
	gap: 14px;
	padding: 16px;
}

.head {
	display: flex;
	align-items: flex-start;
	gap: 12px;
}

.icon {
	width: 40px;
	height: 40px;
	flex-shrink: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	color: var(--color-ink);
}

.completed .icon {
	background: var(--color-win);
	color: var(--color-on-win);
}

.name {
	margin: 0;
	font-weight: 700;
	font-size: 15px;
	line-height: 1.25;
}

.desc {
	margin: 3px 0 0;
	font-size: 13px;
	line-height: 1.35;
	color: var(--color-muted);
}

.difficulty {
	flex-shrink: 0;
	margin-top: 2px;
}

.bar-row {
	display: flex;
	align-items: center;
	gap: 8px;
}

.bar {
	position: relative;
	flex: 1;
	min-width: 0;
}

.progress.done > span {
	background: var(--color-win);
}

.meta {
	display: flex;
	align-items: baseline;
	justify-content: space-between;
	gap: 12px;
	margin-top: -4px;
}

.fraction {
	font-family: var(--font-cond);
	font-weight: 700;
	font-size: 15px;
	font-variant-numeric: tabular-nums;
}

.status {
	display: inline-flex;
	align-items: center;
	gap: 4px;
	font-weight: 700;
	font-size: 13px;
	color: var(--color-muted);
}

.status.done {
	color: var(--color-win);
}

.status.behind {
	color: var(--color-loss);
}

.ball,
.goal {
	display: none;
}

/* Design B: ball on the bar, trophy at the end, green figures. */
:global([data-variant="b"]) .fraction {
	font-weight: 800;
	font-size: 16px;
	color: var(--color-win);
}

:global([data-variant="b"]) .ball {
	position: absolute;
	top: 50%;
	display: flex;
	transform: translateY(-50%);
}

:global([data-variant="b"]) .goal {
	display: flex;
	color: var(--color-muted);
}

:global([data-variant="b"]) .completed .goal {
	color: var(--color-win);
}
</style>
