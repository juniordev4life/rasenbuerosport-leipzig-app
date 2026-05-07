<script>
import { getTranslate } from "@tolgee/svelte";
import { ROUTES } from "$lib/constants/routes.constants.js";
import { fetchActiveChallenges } from "$lib/services/challenges.services.js";
import ChallengeProgressBar from "./ChallengeProgressBar.svelte";
import ChallengeWeekCountdown from "./ChallengeWeekCountdown.svelte";

import { tolgee } from "$lib/config/i18n.config.js";

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

const teaser = $derived(active?.challenges?.slice(0, 2) ?? []);
const completedCount = $derived(
	active?.challenges?.filter((c) => c.progress.completed).length ?? 0,
);
</script>

<div class="bg-bg-secondary border border-border rounded-xl p-4 flex flex-col gap-3">
	<div class="flex items-center justify-between gap-2">
		<h3 class="text-sm font-bold text-text-primary">
			🏅 {$t("challenges.dashboard_title")}
		</h3>
		{#if active}
			<ChallengeWeekCountdown msRemaining={active.ms_remaining} />
		{/if}
	</div>

	{#if loading}
		<div class="flex justify-center py-4">
			<div class="animate-spin h-5 w-5 border-2 border-accent-red border-t-transparent rounded-full"></div>
		</div>
	{:else if error}
		<p class="text-xs text-text-secondary">{$t("challenges.dashboard_error")}</p>
	{:else if !teaser.length}
		<p class="text-xs text-text-secondary">{$t("challenges.dashboard_empty")}</p>
	{:else}
		<div class="flex flex-col gap-3">
			{#each teaser as challenge (challenge.definition_id)}
				<div class="flex items-start gap-2">
					{#if challenge.emoji}
						<span class="text-lg shrink-0" aria-hidden="true">{challenge.emoji}</span>
					{/if}
					<div class="flex-1 min-w-0 flex flex-col gap-1">
						<p class="text-xs font-medium text-text-primary truncate">
							{language === "de" ? challenge.label_de : challenge.label_en}
						</p>
						<ChallengeProgressBar
							current={challenge.progress.current}
							target={challenge.progress.target}
							completed={challenge.progress.completed}
							size="sm" />
					</div>
				</div>
			{/each}
		</div>

		<div class="flex items-center justify-between pt-1">
			<span class="text-[11px] text-text-secondary">
				{completedCount}/{active.challenges.length} {$t("challenges.completed_short")}
			</span>
			<a
				href={ROUTES.CHALLENGES}
				class="text-[11px] font-medium text-accent-red hover:underline"
			>
				{$t("challenges.dashboard_open")} →
			</a>
		</div>
	{/if}
</div>
