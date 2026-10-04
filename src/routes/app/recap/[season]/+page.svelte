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

<!-- Loading and error states fill the screen like the story they stand in
     for: the page colour (grey in A, the pitch in B) with a white card. -->
{#if loading}
	<div class="recap-state">
		<span class="spinner" role="status" aria-label={$t("common.loading")}></span>
	</div>
{:else if error}
	<div class="recap-state">
		<div class="card state-card">
			<p class="state-text">{$t("season_recap.error")}</p>
			<button type="button" onclick={load} class="btn btn-primary">
				{$t("season_recap.retry")}
			</button>
			<button type="button" onclick={handleClose} class="btn btn-ghost">
				{$t("season_recap.back")}
			</button>
		</div>
	</div>
{:else if !recap}
	<div class="recap-state">
		<div class="card state-card">
			<p class="state-text">{$t("season_recap.empty")}</p>
			<button type="button" onclick={handleClose} class="btn btn-primary">
				{$t("season_recap.back")}
			</button>
		</div>
	</div>
{:else}
	<SeasonRecapStory {recap} onClose={handleClose} />
{/if}

<style>
.recap-state {
	position: fixed;
	inset: 0;
	z-index: 50;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 24px;
	background: var(--page-bg);
}

.state-card {
	display: flex;
	flex-direction: column;
	align-items: stretch;
	gap: 12px;
	width: 100%;
	max-width: 22rem;
	padding: 24px;
	text-align: center;
}

.state-text {
	margin: 0 0 4px;
	font-size: 16px;
	line-height: 1.4;
}
</style>
