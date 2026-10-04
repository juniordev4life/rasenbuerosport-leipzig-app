<script>
import { getTranslate } from "@tolgee/svelte";
import ActiveChallengeCard from "$lib/components/challenges/ActiveChallengeCard.svelte";
import ChallengesHero from "$lib/components/challenges/ChallengesHero.svelte";
import StreakBanner from "$lib/components/challenges/StreakBanner.svelte";
import WeekCard from "$lib/components/challenges/WeekCard.svelte";
import SegmentedControl from "$lib/components/ui/SegmentedControl.svelte";
import { tolgee } from "$lib/config/i18n.config.js";
import {
	fetchActiveChallenges,
	fetchChallengeHistory,
} from "$lib/services/challenges.services.js";
import {
	challengeStatusKey,
	formatCountdown,
	streakBannerKey,
} from "$lib/utils/challengeStatus.utils.js";

const { t } = getTranslate();

let language = $state(tolgee.getLanguage());
$effect(() => {
	const update = () => {
		language = tolgee.getLanguage();
	};
	tolgee.on("language", update);
});

/** @type {"active" | "history"} */
let tab = $state("active");

let active = $state(null);
let history = $state(null);
let loading = $state(true);
let errorState = $state(false);

$effect(() => {
	let aborted = false;
	loading = true;
	errorState = false;
	(async () => {
		try {
			const [a, h] = await Promise.all([
				fetchActiveChallenges(),
				fetchChallengeHistory(8),
			]);
			if (aborted) return;
			active = a.data;
			history = h.data;
		} catch (err) {
			if (aborted) return;
			console.error("Failed to load challenges:", err);
			errorState = true;
		} finally {
			if (!aborted) loading = false;
		}
	})();
	return () => {
		aborted = true;
	};
});

const tabOptions = $derived([
	{ value: "active", label: $t("challenges.tab_active") },
	{ value: "history", label: $t("challenges.tab_history") },
]);

const challenges = $derived(active?.challenges ?? []);
const completedCount = $derived(
	challenges.filter((c) => c.progress?.completed).length,
);
const totalCount = $derived(challenges.length);
const msRemaining = $derived(active?.ms_remaining ?? 0);
const hoursRemaining = $derived(msRemaining / (1000 * 60 * 60));
const countdownText = $derived(formatCountdown(msRemaining));

const status = $derived(
	challengeStatusKey(completedCount, totalCount, hoursRemaining),
);
const statusHeadline = $derived(
	$t(`challenges.status.${status.key}`, status.params),
);
const statusDetail = $derived(
	$t(`challenges.status.${status.key}_detail`, status.params),
);

const historyWeeks = $derived(history?.weeks ?? history ?? []);
const streak = $derived(streakBannerKey(historyWeeks.slice(0, 4)));
const streakHeadline = $derived($t(`challenges.${streak.key}`, streak.params));
const streakDetail = $derived(
	$t(`challenges.${streak.key}_detail`, streak.params),
);
</script>

<svelte:head>
	<title>RasenBürosport - {$t("challenges.title")}</title>
</svelte:head>

<div class="stack page pb-4 lg:pb-8">
	{#if loading}
		<div class="flex justify-center py-12">
			<span class="spinner" role="status" aria-label={$t("common.loading")}></span>
		</div>
	{:else if errorState}
		<p class="card notice text-loss" role="alert">{$t("challenges.error")}</p>
	{:else}
		<ChallengesHero
			completed={completedCount}
			total={totalCount}
			{countdownText}
			{statusHeadline}
			{statusDetail}
		>
			<SegmentedControl
				options={tabOptions}
				value={tab}
				onChange={(next) => (tab = next)}
				ariaLabel={$t("challenges.title")}
				tone="brand"
			/>
		</ChallengesHero>

		{#if tab === "active"}
			{#if challenges.length === 0}
				<p class="card notice">{$t("challenges.empty_active")}</p>
			{:else}
				<div class="list">
					{#each challenges as c, i (i)}
						<ActiveChallengeCard
							challenge={c}
							{hoursRemaining}
							locale={language === "en" ? "en" : "de"}
						/>
					{/each}
				</div>
			{/if}
		{:else}
			<StreakBanner headline={streakHeadline} detail={streakDetail} />

			{#if historyWeeks.length === 0}
				<p class="card notice">{$t("challenges.empty_history")}</p>
			{:else}
				<div class="list">
					{#each historyWeeks as week, i (week.week_start ?? i)}
						<WeekCard {week} locale={language === "en" ? "en" : "de"} />
					{/each}
				</div>
			{/if}
		{/if}
	{/if}
</div>

<style>
.list {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

/* Desktop: a centred column; challenge and week cards tile. */
@media (min-width: 1024px) {
	.page {
		max-width: 64rem;
		margin-inline: auto;
	}

	.list {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		align-items: start;
		gap: var(--stack-gap);
	}
}

@media (min-width: 1280px) {
	.list {
		grid-template-columns: repeat(3, minmax(0, 1fr));
	}
}
</style>
