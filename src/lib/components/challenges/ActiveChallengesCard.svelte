<script>
import { getTranslate } from "@tolgee/svelte";
import FootballIcon from "$lib/components/icons/FootballIcon.svelte";
import TrophyIcon from "$lib/components/icons/TrophyIcon.svelte";
import { tolgee } from "$lib/config/i18n.config.js";
import { fetchActiveChallenges } from "$lib/services/challenges.services.js";

/**
 * Home card for the active weekly challenges: a summary line ("X von Y
 * geschafft"), then one row per challenge with its name, progress bar
 * and fraction. Design B adds a ball riding the bar and a trophy at its
 * end. The link to the full list lives in the surrounding section.
 */

const { t } = getTranslate();

let language = $state(tolgee.getLanguage());
$effect(() => {
	const update = () => {
		language = tolgee.getLanguage();
	};
	tolgee.on("language", update);
});

let active = $state(null);
let loading = $state(true);
let error = $state(false);

$effect(() => {
	loadActive();
});

async function loadActive() {
	try {
		const res = await fetchActiveChallenges();
		active = res.data;
	} catch (err) {
		console.error("Failed to load active challenges:", err);
		error = true;
	} finally {
		loading = false;
	}
}

const challenges = $derived(active?.challenges ?? []);
const completedCount = $derived(
	challenges.filter((c) => c.progress.completed).length,
);

function progressPct(current, target) {
	if (!target) return 0;
	return Math.min(100, Math.round((current / target) * 100));
}
</script>

<div class="card challenges">
	{#if loading}
		<div class="flex justify-center py-4">
			<span class="spinner" role="status"></span>
		</div>
	{:else if error}
		<p class="text-sm text-muted">{$t("challenges.dashboard_error")}</p>
	{:else if challenges.length === 0}
		<p class="text-sm text-muted">{$t("challenges.dashboard_empty")}</p>
	{:else}
		<p class="summary">
			<span class="summary-count">{completedCount} {$t("challenges.dashboard_of")} {challenges.length}</span>
			{$t("challenges.completed_short")}
		</p>

		{#each challenges as challenge (challenge.definition_id)}
			{@const done = challenge.progress.completed}
			{@const pct = progressPct(challenge.progress.current, challenge.progress.target)}
			<div class="flex flex-col gap-2">
				<div class="flex justify-between items-baseline gap-3">
					<span class="font-medium text-[15px] min-w-0">
						{language === "de" ? challenge.label_de : challenge.label_en}
					</span>
					<span class="fraction" class:done>
						{challenge.progress.current} / {challenge.progress.target}
					</span>
				</div>
				<div class="flex items-center gap-2">
					<div class="bar">
						<div class="progress"><span style="width: {pct}%"></span></div>
						<span class="ball" style="left: calc((100% - 20px) * {pct / 100})" aria-hidden="true">
							<FootballIcon size={20} />
						</span>
					</div>
					<span class="goal" class:done aria-hidden="true"><TrophyIcon size={18} strokeWidth={2} /></span>
				</div>
			</div>
		{/each}
	{/if}
</div>

<style>
.challenges {
	display: flex;
	flex-direction: column;
	gap: 14px;
	padding: 16px;
}

.summary {
	display: flex;
	align-items: baseline;
	gap: 8px;
	margin: 0;
	padding-bottom: 14px;
	border-bottom: 1px solid var(--color-line);
	font-size: 14px;
}

.summary-count {
	font-family: var(--font-display);
	font-size: 26px;
	line-height: 0.8;
	text-transform: uppercase;
}

.fraction {
	flex-shrink: 0;
	font-family: var(--font-cond);
	font-weight: 700;
	font-size: 15px;
	font-variant-numeric: tabular-nums;
}

.bar {
	position: relative;
	flex: 1;
	min-width: 0;
}

.ball,
.goal {
	display: none;
}

/* Design B */
:global([data-variant="b"]) .summary {
	display: block;
	padding-bottom: 0;
	border-bottom: 0;
}

:global([data-variant="b"]) .summary-count {
	font-family: var(--font-sans);
	font-weight: 700;
	font-size: 14px;
	line-height: inherit;
	text-transform: none;
	color: var(--color-win);
}

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

:global([data-variant="b"]) .goal.done {
	color: var(--color-win);
}
</style>
