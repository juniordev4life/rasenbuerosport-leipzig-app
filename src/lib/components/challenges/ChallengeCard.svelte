<script>
import { getTranslate } from "@tolgee/svelte";
import ChallengeProgressBar from "./ChallengeProgressBar.svelte";

/**
 * One challenge tile — emoji, label, difficulty pill, reward pill, progress.
 * Renders the localized label/description from the API row based on the
 * Tolgee active language.
 *
 * @typedef {Object} ChallengeCardProps
 * @property {{
 *   metric: string,
 *   target_value: number,
 *   reward_points: number,
 *   difficulty: "easy"|"medium"|"hard",
 *   label_de: string, label_en: string,
 *   description_de?: string|null, description_en?: string|null,
 *   emoji?: string|null,
 *   progress: { current: number, target: number, completed: boolean },
 * }} challenge
 */
let { challenge } = $props();

const { t } = getTranslate();

import { tolgee } from "$lib/config/i18n.config.js";
let language = $state(tolgee.getLanguage());
$effect(() => {
	const update = () => {
		language = tolgee.getLanguage();
	};
	tolgee.on("language", update);
});

const label = $derived(
	language === "de" ? challenge.label_de : challenge.label_en,
);
const description = $derived(
	language === "de" ? challenge.description_de : challenge.description_en,
);

const difficultyClass = $derived(
	challenge.difficulty === "easy"
		? "bg-success/15 text-success"
		: challenge.difficulty === "hard"
			? "bg-accent-red/15 text-accent-red"
			: "bg-warning/15 text-warning",
);
</script>

<div
	class="flex flex-col gap-3 p-4 rounded-xl border bg-bg-secondary transition-colors {challenge
		.progress.completed
		? 'border-success/40'
		: 'border-border'}"
>
	<div class="flex items-start gap-3">
		{#if challenge.emoji}
			<span class="text-2xl shrink-0" aria-hidden="true">{challenge.emoji}</span>
		{/if}
		<div class="flex-1 min-w-0">
			<p class="text-sm font-semibold text-text-primary leading-tight">{label}</p>
			{#if description}
				<p class="text-[11px] text-text-secondary mt-0.5">{description}</p>
			{/if}
		</div>
		<span
			class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide {difficultyClass}"
		>
			{$t(`challenges.difficulty.${challenge.difficulty}`)}
		</span>
	</div>

	<ChallengeProgressBar
		current={challenge.progress.current}
		target={challenge.progress.target}
		completed={challenge.progress.completed} />

	<div class="flex items-center justify-between">
		<span
			class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-warning/15 text-warning"
		>
			+{challenge.reward_points} {$t("challenges.bonus_points_short")}
		</span>
		{#if challenge.progress.completed}
			<span class="text-[11px] font-medium text-success">
				🎉 {$t("challenges.completed_label")}
			</span>
		{/if}
	</div>
</div>
