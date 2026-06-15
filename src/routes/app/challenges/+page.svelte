<script>
import { getTranslate } from "@tolgee/svelte";
import ActiveChallengeCard from "$lib/components/challenges/ActiveChallengeCard.svelte";
import ChallengesHero from "$lib/components/challenges/ChallengesHero.svelte";
import ChallengesTabs from "$lib/components/challenges/ChallengesTabs.svelte";
import StreakBanner from "$lib/components/challenges/StreakBanner.svelte";
import WeekCard from "$lib/components/challenges/WeekCard.svelte";
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

<div class="page lg:max-w-5xl lg:mx-auto">
	{#if loading}
		<div class="loading">
			<div class="spinner"></div>
		</div>
	{:else if errorState}
		<div class="error">{$t("challenges.error")}</div>
	{:else}
		<ChallengesHero
			completed={completedCount}
			total={totalCount}
			{countdownText}
			{statusHeadline}
			{statusDetail}
		/>

		<div class="tabs-wrap">
			<ChallengesTabs
				value={tab}
				onChange={(v) => (tab = v)}
				activeLabel={$t("challenges.tab_active")}
				historyLabel={$t("challenges.tab_history")}
			/>
		</div>

		{#if tab === "active"}
			{#if challenges.length === 0}
				<div class="empty">{$t("challenges.empty_active")}</div>
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
				<div class="empty">{$t("challenges.empty_history")}</div>
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
.page {
	padding: 0 4px 32px;
	display: flex; flex-direction: column;
	gap: 12px;
}
.tabs-wrap { margin-top: 2px; }
.list {
	display: flex; flex-direction: column;
	gap: 8px;
}
/* Tile challenge / week cards on desktop instead of one tall column. */
@media (min-width: 1024px) {
	.list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); align-items: start; }
}
@media (min-width: 1280px) {
	.list { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
.loading {
	display: flex; justify-content: center;
	padding: 48px 0;
}
.spinner {
	width: 28px; height: 28px;
	border: 2px solid #F59E0B;
	border-top-color: transparent;
	border-radius: 50%;
	animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.error {
	background: rgba(226, 75, 74, 0.1);
	border: 1px solid rgba(226, 75, 74, 0.3);
	color: #E24B4A;
	border-radius: 12px;
	padding: 16px;
	text-align: center;
	font-size: 13px;
}
.empty {
	background: #131822;
	border: 1px solid #1F2937;
	border-radius: 14px;
	padding: 28px 18px;
	text-align: center;
	color: #9CA3AF;
	font-size: 13px;
}
</style>
