<script>
import { getTranslate } from "@tolgee/svelte";
import { get } from "$lib/services/api.services.js";

/**
 * Live AI-generated weekly recap for the calling player. Fetches
 * /v1/wrapped/recap/me on mount, shows a loading skeleton, and
 * silently hides on error so the dashboard stays clean.
 */

const { t } = getTranslate();

let recap = $state(null);
let loading = $state(true);
let error = $state(false);

$effect(() => {
	loadRecap();
});

async function loadRecap() {
	try {
		const res = await get("/v1/wrapped/recap/me");
		recap = res.data;
	} catch (err) {
		console.error("Failed to load weekly recap:", err);
		error = true;
	} finally {
		loading = false;
	}
}
</script>

{#if loading}
	<div class="bg-bg-secondary border border-border rounded-xl p-4 animate-pulse">
		<div class="h-3 w-32 bg-bg-input rounded mb-3"></div>
		<div class="h-3 w-full bg-bg-input rounded mb-2"></div>
		<div class="h-3 w-5/6 bg-bg-input rounded"></div>
	</div>
{:else if !error && recap}
	<div class="bg-gradient-to-br from-accent-red/10 to-warning/10 border border-accent-red/20 rounded-xl p-4">
		<div class="flex items-baseline justify-between gap-2 mb-2">
			<p class="text-xs font-bold text-text-primary">
				✨ {$t("recap.title")}
			</p>
			{#if recap.total_bonus_points > 0}
				<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-warning/15 text-warning tabular-nums">
					+{recap.total_bonus_points} {$t("recap.bonus_points_short")}
				</span>
			{/if}
		</div>
		<p class="text-sm text-text-primary leading-relaxed whitespace-pre-line">
			{recap.text}
		</p>
		{#if recap.stats && recap.stats.games_played > 0}
			<div class="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-border">
				<div class="text-center">
					<p class="text-base font-bold text-text-primary tabular-nums">{recap.stats.games_played}</p>
					<p class="text-[10px] text-text-secondary uppercase tracking-wide">{$t("recap.games")}</p>
				</div>
				<div class="text-center">
					<p class="text-base font-bold text-success tabular-nums">{recap.stats.wins}</p>
					<p class="text-[10px] text-text-secondary uppercase tracking-wide">{$t("recap.wins")}</p>
				</div>
				<div class="text-center">
					<p class="text-base font-bold text-text-primary tabular-nums">{recap.stats.goals_scored}</p>
					<p class="text-[10px] text-text-secondary uppercase tracking-wide">{$t("recap.goals")}</p>
				</div>
				<div class="text-center">
					<p class="text-base font-bold text-text-primary tabular-nums">{recap.stats.assists}</p>
					<p class="text-[10px] text-text-secondary uppercase tracking-wide">{$t("recap.assists")}</p>
				</div>
			</div>
		{/if}
	</div>
{/if}
