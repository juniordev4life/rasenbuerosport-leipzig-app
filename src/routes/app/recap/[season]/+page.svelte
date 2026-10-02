<script>
import { getTranslate } from "@tolgee/svelte";
import { goto } from "$app/navigation";
import { page } from "$app/state";
import SeasonRecapStory from "$lib/components/recap/SeasonRecapStory.svelte";
import { ROUTES } from "$lib/constants/routes.constants.js";
import { getSeasonRecap } from "$lib/services/seasons.services.js";
import { markRecapSeen } from "$lib/utils/recapStory.utils.js";

const { t } = getTranslate();

const seasonId = $derived(page.params.season);

let recap = $state(null);
let loading = $state(true);
let error = $state(false);

async function load() {
	loading = true;
	error = false;
	try {
		recap = await getSeasonRecap(seasonId);
		// One showing is enough. Most viewers never tap ✕: they watch to the
		// last slide and close the app, or swipe back. Marking only on close
		// made the auto-launcher reopen the story on every start.
		if (recap) markRecapSeen(seasonId);
	} catch (err) {
		console.error("Failed to load season recap:", err);
		error = true;
	} finally {
		loading = false;
	}
}

$effect(() => {
	const _id = seasonId;
	void _id;
	load();
});

/**
 * Leaves the story — back to wherever the user came from when there is
 * history in this tab, otherwise the dashboard.
 */
function handleClose() {
	if (typeof window !== "undefined" && window.history.length > 1) {
		window.history.back();
	} else {
		goto(ROUTES.DASHBOARD);
	}
}
</script>

<svelte:head>
	<title>RasenBürosport - {$t("season_recap.title")}</title>
</svelte:head>

{#if loading}
	<div class="fixed inset-0 z-50 bg-[#0B0F17] flex items-center justify-center">
		<div class="animate-spin h-8 w-8 border-2 border-white/40 border-t-transparent rounded-full"></div>
	</div>
{:else if error}
	<div class="fixed inset-0 z-50 bg-[#0B0F17] text-white flex flex-col items-center justify-center gap-4 px-6 text-center">
		<p>{$t("season_recap.error")}</p>
		<button type="button" onclick={load} class="px-4 py-2 rounded-full bg-white/10 text-sm font-bold">
			{$t("season_recap.retry")}
		</button>
		<button type="button" onclick={handleClose} class="text-sm text-white/60 underline">
			{$t("season_recap.back")}
		</button>
	</div>
{:else if !recap}
	<div class="fixed inset-0 z-50 bg-[#0B0F17] text-white flex flex-col items-center justify-center gap-4 px-6 text-center">
		<p>{$t("season_recap.empty")}</p>
		<button type="button" onclick={handleClose} class="px-4 py-2 rounded-full bg-white/10 text-sm font-bold">
			{$t("season_recap.back")}
		</button>
	</div>
{:else}
	<SeasonRecapStory {recap} onClose={handleClose} />
{/if}
