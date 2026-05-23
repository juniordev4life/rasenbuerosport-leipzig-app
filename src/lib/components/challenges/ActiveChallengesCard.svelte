<script>
import { getTranslate } from "@tolgee/svelte";
import { tolgee } from "$lib/config/i18n.config.js";
import { ROUTES } from "$lib/constants/routes.constants.js";
import { fetchActiveChallenges } from "$lib/services/challenges.services.js";

/**
 * Compact home-screen card for the active weekly challenges. Matches
 * the V2 home design: a summary line at the top ("X von Y geschafft")
 * followed by one row per challenge with name + progress bar +
 * fraction. No leading row icons and no bonus-points pill per design
 * direction — the action link to the full list lives at the bottom.
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

<div class="bg-bg-card border border-border rounded-2xl p-3.5">
	{#if loading}
		<div class="flex justify-center py-4">
			<div class="animate-spin h-5 w-5 border-2 border-accent-red border-t-transparent rounded-full"></div>
		</div>
	{:else if error}
		<p class="text-xs text-text-secondary">{$t("challenges.dashboard_error")}</p>
	{:else if challenges.length === 0}
		<p class="text-xs text-text-secondary">{$t("challenges.dashboard_empty")}</p>
	{:else}
		<div class="flex items-center justify-between pb-2.5 mb-2.5 border-b border-border">
			<div class="text-[12px] font-bold text-text-secondary">
				<strong class="text-success font-extrabold">{completedCount} {$t("challenges.dashboard_of")} {challenges.length}</strong>
				{$t("challenges.completed_short")}
			</div>
			<a
				href={ROUTES.CHALLENGES}
				class="text-[10px] font-bold text-text-muted hover:text-text-primary"
			>
				{$t("challenges.dashboard_open")} →
			</a>
		</div>

		<div class="flex flex-col">
			{#each challenges as challenge, i (challenge.definition_id)}
				{@const done = challenge.progress.completed}
				{@const pct = progressPct(challenge.progress.current, challenge.progress.target)}
				<div class="flex items-center gap-3 py-2 {i > 0 ? 'border-t border-border' : ''}">
					<div class="flex-1 min-w-0">
						<div class="text-[12px] font-semibold text-text-primary mb-1.5 truncate">
							{language === "de" ? challenge.label_de : challenge.label_en}
						</div>
						<div class="h-1 bg-white/5 rounded-full overflow-hidden">
							<div
								class="h-full rounded-full {done
									? 'bg-gradient-to-r from-success to-success/80'
									: 'bg-gradient-to-r from-warning to-warning/80'}"
								style="width: {pct}%;"
							></div>
						</div>
					</div>
					<div
						class="text-[11px] font-bold tabular-nums shrink-0 min-w-[36px] text-right {done ? 'text-success' : 'text-warning'}"
					>
						{challenge.progress.current} / {challenge.progress.target}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
