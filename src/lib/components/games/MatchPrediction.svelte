<script>
	import { getTranslate } from "@tolgee/svelte";
	import { post } from "$lib/services/api.services.js";

	/**
	 * @type {{
	 *   homePlayers: string[],
	 *   awayPlayers: string[],
	 *   homeTeam: string,
	 *   awayTeam: string,
	 *   mode: string,
	 *   allPlayers: Array<{id: string, username: string}>
	 * }}
	 */
	let { homePlayers = [], awayPlayers = [], homeTeam = "", awayTeam = "", mode = "1v1", allPlayers = [] } = $props();

	const { t } = getTranslate();

	const GUEST_ID = "__guest__";

	let prediction = $state(null);
	let loading = $state(false);
	let error = $state(false);

	/** Check if we have enough data for a prediction */
	const canPredict = $derived(
		homePlayers.filter((id) => !id.startsWith(GUEST_ID)).length > 0 &&
		awayPlayers.filter((id) => !id.startsWith(GUEST_ID)).length > 0 &&
		homeTeam &&
		awayTeam,
	);

	/**
	 * Build the player payload for the prediction API
	 * @returns {Array<{id: string, team: string, team_name: string}>}
	 */
	function buildPlayerPayload() {
		const players = [];
		for (const id of homePlayers) {
			if (!id.startsWith(GUEST_ID)) {
				players.push({ id, team: "home", team_name: homeTeam });
			}
		}
		for (const id of awayPlayers) {
			if (!id.startsWith(GUEST_ID)) {
				players.push({ id, team: "away", team_name: awayTeam });
			}
		}
		return players;
	}

	/**
	 * Fetch prediction from backend AI
	 */
	async function fetchPrediction() {
		loading = true;
		error = false;
		try {
			const res = await post("/v1/games/prediction", {
				players: buildPlayerPayload(),
				mode,
			});
			prediction = res.data?.prediction || null;
		} catch (err) {
			console.error("Failed to generate prediction:", err);
			error = true;
		} finally {
			loading = false;
		}
	}
</script>

{#if canPredict}
	<div class="bg-bg-secondary border border-border rounded-lg p-4">
		{#if prediction}
			<div class="flex items-center gap-2 mb-2">
				<span class="text-base">🔮</span>
				<h3 class="text-sm font-medium text-text-primary">
					{$t("prediction.title")}
				</h3>
			</div>
			<p class="text-sm text-text-secondary leading-relaxed whitespace-pre-line">
				{prediction}
			</p>
		{:else if loading}
			<div class="flex items-center gap-3 py-2">
				<div class="animate-spin h-4 w-4 border-2 border-accent-red border-t-transparent rounded-full"></div>
				<span class="text-sm text-text-secondary">{$t("prediction.loading")}</span>
			</div>
		{:else if error}
			<div class="flex items-center gap-2 py-2">
				<span class="text-base">🔮</span>
				<p class="text-xs text-error">{$t("prediction.error")}</p>
			</div>
		{:else}
			<button
				type="button"
				onclick={fetchPrediction}
				class="flex items-center gap-2 w-full text-left cursor-pointer hover:opacity-80 transition-opacity"
			>
				<span class="text-base">🔮</span>
				<span class="text-sm font-medium text-text-primary">{$t("prediction.generate")}</span>
			</button>
		{/if}
	</div>
{/if}
