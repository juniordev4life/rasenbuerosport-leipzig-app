<script>
import { getTranslate } from "@tolgee/svelte";
import ChallengeCard from "$lib/components/challenges/ChallengeCard.svelte";
import ChallengeProgressBar from "$lib/components/challenges/ChallengeProgressBar.svelte";
import ChallengeWeekCountdown from "$lib/components/challenges/ChallengeWeekCountdown.svelte";
import { tolgee } from "$lib/config/i18n.config.js";
import {
	fetchActiveChallenges,
	fetchChallengeHistory,
	fetchChallengeLeaderboard,
} from "$lib/services/challenges.services.js";

const { t } = getTranslate();

let language = $state(tolgee.getLanguage());
$effect(() => {
	const update = () => {
		language = tolgee.getLanguage();
	};
	tolgee.on("language", update);
});

/** @type {"active" | "history" | "leaderboard"} */
let tab = $state("active");

let active = $state(null);
let history = $state(null);
let leaderboard = $state(null);
let loading = $state(true);
let error = $state(false);

$effect(() => {
	loadAll();
});

async function loadAll() {
	loading = true;
	error = false;
	try {
		const [a, h, l] = await Promise.all([
			fetchActiveChallenges(),
			fetchChallengeHistory(8),
			fetchChallengeLeaderboard(20),
		]);
		active = a.data;
		history = h.data;
		leaderboard = l.data;
	} catch (err) {
		console.error("Failed to load challenges:", err);
		error = true;
	} finally {
		loading = false;
	}
}

const formatWeek = (start, end) => {
	const fmt = (s) =>
		new Date(`${s}T12:00:00Z`).toLocaleDateString(
			language === "de" ? "de-DE" : "en-US",
			{ day: "2-digit", month: "short" },
		);
	return `${fmt(start)} – ${fmt(end)}`;
};
</script>

<svelte:head>
	<title>RasenBürosport - {$t("challenges.title")}</title>
</svelte:head>

<div class="flex flex-col gap-4">
	<!-- Header -->
	<div class="flex items-baseline justify-between gap-3">
		<div>
			<h1 class="text-xl font-bold text-text-primary">
				🏅 {$t("challenges.title")}
			</h1>
			<p class="text-xs text-text-secondary mt-0.5">{$t("challenges.subtitle")}</p>
		</div>
		{#if active}
			<ChallengeWeekCountdown msRemaining={active.ms_remaining} />
		{/if}
	</div>

	<!-- Tabs -->
	<div class="flex gap-1 p-1 bg-bg-secondary border border-border rounded-lg">
		<button
			type="button"
			onclick={() => (tab = "active")}
			class="flex-1 py-2 px-3 rounded-md text-xs font-medium transition-colors {tab ===
			'active'
				? 'bg-accent-red text-white'
				: 'text-text-secondary hover:text-text-primary'}"
		>
			{$t("challenges.tab_active")}
		</button>
		<button
			type="button"
			onclick={() => (tab = "history")}
			class="flex-1 py-2 px-3 rounded-md text-xs font-medium transition-colors {tab ===
			'history'
				? 'bg-accent-red text-white'
				: 'text-text-secondary hover:text-text-primary'}"
		>
			{$t("challenges.tab_history")}
		</button>
		<button
			type="button"
			onclick={() => (tab = "leaderboard")}
			class="flex-1 py-2 px-3 rounded-md text-xs font-medium transition-colors {tab ===
			'leaderboard'
				? 'bg-accent-red text-white'
				: 'text-text-secondary hover:text-text-primary'}"
		>
			{$t("challenges.tab_leaderboard")}
		</button>
	</div>

	{#if loading}
		<div class="flex justify-center py-12">
			<div class="animate-spin h-8 w-8 border-2 border-accent-red border-t-transparent rounded-full"></div>
		</div>
	{:else if error}
		<p class="text-center py-12 text-text-secondary">{$t("challenges.dashboard_error")}</p>
	{:else if tab === "active"}
		{#if active?.challenges?.length}
			<div class="flex flex-col gap-3">
				{#each active.challenges as challenge (challenge.definition_id)}
					<ChallengeCard {challenge} />
				{/each}
			</div>
		{:else}
			<p class="text-center py-12 text-text-secondary">{$t("challenges.dashboard_empty")}</p>
		{/if}
	{:else if tab === "history"}
		{#if history?.length}
			<div class="flex flex-col gap-3">
				{#each history as week (week.week_start)}
					<div class="bg-bg-secondary border border-border rounded-xl p-4 flex flex-col gap-3">
						<div class="flex items-center justify-between gap-2">
							<span class="text-xs font-bold text-text-primary">
								{formatWeek(week.week_start, week.week_end)}
							</span>
							<span class="text-[11px] tabular-nums text-text-secondary">
								{week.completed_count}/{week.challenges.length} ·
								<span class="text-warning font-medium">+{week.reward_points}</span>
							</span>
						</div>
						<div class="flex flex-col gap-2">
							{#each week.challenges as c (c.definition_id)}
								<div class="flex items-center gap-2">
									{#if c.emoji}<span class="text-sm" aria-hidden="true">{c.emoji}</span>{/if}
									<div class="flex-1 min-w-0">
										<p class="text-[11px] text-text-primary truncate">
											{language === "de" ? c.label_de : c.label_en}
										</p>
										<ChallengeProgressBar
											current={c.progress.current}
											target={c.progress.target}
											completed={c.progress.completed}
											size="sm" />
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<p class="text-center py-12 text-text-secondary">{$t("challenges.history_empty")}</p>
		{/if}
	{:else if tab === "leaderboard"}
		{#if leaderboard?.length}
			<div class="bg-bg-secondary border border-border rounded-xl divide-y divide-border">
				{#each leaderboard as entry, i (entry.player.id)}
					<div class="flex items-center gap-3 p-3">
						<span class="w-6 text-center text-xs font-bold text-text-secondary tabular-nums">
							{i + 1}
						</span>
						{#if entry.player.avatar_url}
							<img
								src={entry.player.avatar_url}
								alt={entry.player.username}
								class="w-8 h-8 rounded-full object-cover ring-1 ring-border" />
						{:else}
							<div class="w-8 h-8 rounded-full bg-accent-red/20 ring-1 ring-border flex items-center justify-center text-xs font-bold text-text-primary">
								{(entry.player.username || "?").charAt(0).toUpperCase()}
							</div>
						{/if}
						<span class="flex-1 text-sm text-text-primary font-medium truncate">
							{entry.player.username}
						</span>
						<span class="text-[11px] text-text-secondary tabular-nums">
							{entry.weeks_completed} {$t("challenges.weeks_short")}
						</span>
						<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-warning/15 text-warning tabular-nums">
							{entry.total_points}
						</span>
					</div>
				{/each}
			</div>
		{:else}
			<p class="text-center py-12 text-text-secondary">{$t("challenges.leaderboard_empty")}</p>
		{/if}
	{/if}
</div>
