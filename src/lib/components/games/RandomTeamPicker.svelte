<script>
import { getTranslate } from "@tolgee/svelte";
import Button from "$lib/components/ui/Button.svelte";
import OvrBadge from "$lib/components/ui/OvrBadge.svelte";
import StarRating from "$lib/components/ui/StarRating.svelte";
import TeamLogo from "$lib/components/ui/TeamLogo.svelte";
import { getAllTeams } from "$lib/services/teams.services.js";

/**
 * RandomTeamPicker - Modal dialog for picking two random teams of equal star rating
 * @param {Function} onClose - Close handler
 * @param {(homeTeam: string, awayTeam: string) => void} onConfirm - Confirm handler with team names
 */
let { onClose, onConfirm } = $props();

const { t } = getTranslate();

let stars = $state(4);
let homeResult = $state(null);
let awayResult = $state(null);
let error = $state("");

/**
 * Gets all teams matching the selected star rating
 * @returns {Promise<import("$lib/services/teams.services.js").TeamData[]>}
 */
async function getFilteredTeams() {
	const teams = await getAllTeams();
	return teams.filter((t) => t.star_rating === stars);
}

/**
 * Picks two distinct random teams within the star rating range
 */
async function searchRandomTeams() {
	error = "";
	const filtered = await getFilteredTeams();

	if (filtered.length < 2) {
		error = $t("new_game.random_no_teams");
		homeResult = null;
		awayResult = null;
		return;
	}

	const idx1 = Math.floor(Math.random() * filtered.length);
	let idx2 = Math.floor(Math.random() * (filtered.length - 1));
	if (idx2 >= idx1) idx2++;

	homeResult = filtered[idx1];
	awayResult = filtered[idx2];
}

/**
 * Re-rolls a single team (home or away) while keeping the other
 * @param {"home"|"away"} side
 */
async function rerollSingle(side) {
	error = "";
	const filtered = await getFilteredTeams();
	const other = side === "home" ? awayResult : homeResult;
	const candidates = filtered.filter((t) => t.name !== other?.name);

	if (candidates.length < 1) {
		error = $t("new_game.random_no_teams");
		return;
	}

	const pick = candidates[Math.floor(Math.random() * candidates.length)];
	if (side === "home") {
		homeResult = pick;
	} else {
		awayResult = pick;
	}
}

function handleConfirm() {
	if (homeResult && awayResult) {
		onConfirm(homeResult.name, awayResult.name);
	}
}

function getStarValue(starIndex, isLeft) {
	return isLeft ? starIndex + 0.5 : starIndex + 1;
}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center"
	onmousedown={(e) => { if (e.target === e.currentTarget) onClose(); }}
	onkeydown={(e) => e.key === "Escape" && onClose()}
>
	<div class="bg-bg-primary border-t border-border rounded-t-2xl sm:rounded-2xl sm:border w-full max-w-lg max-h-[85vh] overflow-y-auto p-5 sm:mx-4">
		<!-- Title -->
		<h2 class="text-lg font-bold text-text-primary text-center mb-5">
			{$t("new_game.random_teams_title")}
		</h2>

		<!-- Star Selector -->
		<div class="flex flex-col gap-4 mb-5">
			<div>
				<label class="text-xs font-medium text-text-secondary mb-1.5 block">
					{$t("new_game.random_stars")}
				</label>
				<div class="flex items-center gap-3">
					<div class="flex items-center gap-0.5">
						{#each Array.from({ length: 5 }, (_, i) => i) as starIdx (starIdx)}
							<div class="relative" style="width: 24px; height: 24px;">
								<button
									type="button"
									class="absolute inset-y-0 left-0 w-1/2 z-10 cursor-pointer"
									onclick={() => { stars = getStarValue(starIdx, true); }}
									aria-label="{starIdx + 0.5} stars"
								></button>
								<button
									type="button"
									class="absolute inset-y-0 right-0 w-1/2 z-10 cursor-pointer"
									onclick={() => { stars = getStarValue(starIdx, false); }}
									aria-label="{starIdx + 1} stars"
								></button>
								{#if stars >= starIdx + 1}
									<svg class="w-6 h-6 text-warning" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
										<path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
									</svg>
								{:else if stars >= starIdx + 0.5}
									<svg class="w-6 h-6 text-warning" viewBox="0 0 24 24" aria-hidden="true">
										<defs>
											<linearGradient id="stars-half-{starIdx}">
												<stop offset="50%" stop-color="currentColor" />
												<stop offset="50%" stop-color="var(--color-text-muted)" />
											</linearGradient>
										</defs>
										<path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill="url(#stars-half-{starIdx})" />
									</svg>
								{:else}
									<svg class="w-6 h-6 text-text-muted" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
										<path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
									</svg>
								{/if}
							</div>
						{/each}
					</div>
					<span class="text-sm text-text-secondary font-medium min-w-[2rem] text-center">{stars}</span>
				</div>
			</div>
		</div>

		<!-- Search Button -->
		<Button variant="primary" onclick={searchRandomTeams} class="mb-5">
			{$t("new_game.random_search")}
		</Button>

		<!-- Results -->
		{#if error}
			<p class="text-sm text-error text-center mb-4">{error}</p>
		{/if}

		{#if homeResult && awayResult}
			<div class="flex flex-col gap-3 mb-5">
				<!-- Home Team -->
				<div class="flex items-center gap-3 bg-bg-secondary border border-border rounded-xl p-3">
					<TeamLogo logoUrl={homeResult.logo_url} teamName={homeResult.name} size="md" />
					<div class="flex-1 min-w-0">
						<p class="text-sm font-bold text-text-primary truncate">{homeResult.name}</p>
						<div class="flex items-center gap-2 mt-0.5">
							<OvrBadge rating={homeResult.overall_rating} size="xs" />
							<StarRating rating={homeResult.star_rating} size="xs" />
						</div>
					</div>
					<button
						type="button"
						onclick={() => rerollSingle("home")}
						class="shrink-0 text-text-secondary hover:text-accent-red transition-colors p-1.5"
						aria-label="Reroll home team"
					>
						<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
							<path d="M21 3v5h-5" />
						</svg>
					</button>
				</div>

				<!-- VS -->
				<p class="text-xs font-bold text-text-secondary text-center">{$t("new_game.random_vs")}</p>

				<!-- Away Team -->
				<div class="flex items-center gap-3 bg-bg-secondary border border-border rounded-xl p-3">
					<TeamLogo logoUrl={awayResult.logo_url} teamName={awayResult.name} size="md" />
					<div class="flex-1 min-w-0">
						<p class="text-sm font-bold text-text-primary truncate">{awayResult.name}</p>
						<div class="flex items-center gap-2 mt-0.5">
							<OvrBadge rating={awayResult.overall_rating} size="xs" />
							<StarRating rating={awayResult.star_rating} size="xs" />
						</div>
					</div>
					<button
						type="button"
						onclick={() => rerollSingle("away")}
						class="shrink-0 text-text-secondary hover:text-accent-red transition-colors p-1.5"
						aria-label="Reroll away team"
					>
						<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
							<path d="M21 3v5h-5" />
						</svg>
					</button>
				</div>
			</div>

			<!-- Action Buttons -->
			<div class="flex gap-3">
				<Button variant="secondary" onclick={searchRandomTeams} class="flex-1">
					{$t("new_game.random_reroll")}
				</Button>
				<Button variant="primary" onclick={handleConfirm} class="flex-1">
					{$t("new_game.random_confirm")}
				</Button>
			</div>
		{/if}

		<!-- Cancel Button -->
		<button
			type="button"
			onclick={onClose}
			class="w-full mt-4 py-2.5 text-sm font-medium text-text-secondary border border-border rounded-lg hover:bg-bg-secondary transition-colors"
		>
			{$t("new_game.random_cancel")}
		</button>
	</div>
</div>
