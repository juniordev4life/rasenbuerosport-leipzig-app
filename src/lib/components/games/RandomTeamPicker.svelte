<script>
import { getTranslate } from "@tolgee/svelte";
import MinuteScroller from "$lib/components/liveMatch/MinuteScroller.svelte";
import OvrBadge from "$lib/components/ui/OvrBadge.svelte";
import StarRating from "$lib/components/ui/StarRating.svelte";
import TeamLogo from "$lib/components/ui/TeamLogo.svelte";
import { getAllTeams } from "$lib/services/teams.services.js";

/**
 * RandomTeamPicker - Modal dialog for picking two random teams of equal star rating
 * within a configurable min/max range. Both teams always share the same exact star rating.
 * @param {Function} onClose - Close handler
 * @param {(homeTeam: string, awayTeam: string) => void} onConfirm - Confirm handler with team names
 */
let { onClose, onConfirm } = $props();

const { t } = getTranslate();

let minStars = $state(4);
let maxStars = $state(5);
let homeResult = $state(null);
let awayResult = $state(null);
let error = $state("");

/**
 * Gets teams whose star rating equals exactly the given value
 * @param {number} starRating
 * @returns {Promise<import("$lib/services/teams.services.js").TeamData[]>}
 */
async function getTeamsByExactRating(starRating) {
	const teams = await getAllTeams();
	return teams.filter((t) => t.star_rating === starRating);
}

/**
 * Picks two distinct random teams that share the same star rating, drawn from the
 * configured min/max range. The exact rating is chosen randomly from ratings that
 * have at least 2 teams available within the range.
 */
async function searchRandomTeams() {
	error = "";
	if (minStars > maxStars) {
		error = $t("new_game.random_no_teams");
		homeResult = null;
		awayResult = null;
		return;
	}

	const teams = await getAllTeams();
	const inRange = teams.filter(
		(t) =>
			t.star_rating !== null &&
			t.star_rating >= minStars &&
			t.star_rating <= maxStars,
	);

	const ratingCounts = new Map();
	for (const t of inRange) {
		ratingCounts.set(t.star_rating, (ratingCounts.get(t.star_rating) || 0) + 1);
	}
	const eligibleRatings = [...ratingCounts.entries()]
		.filter(([, count]) => count >= 2)
		.map(([rating]) => rating);

	if (eligibleRatings.length === 0) {
		error = $t("new_game.random_no_teams");
		homeResult = null;
		awayResult = null;
		return;
	}

	const chosenRating =
		eligibleRatings[Math.floor(Math.random() * eligibleRatings.length)];
	const pool = inRange.filter((t) => t.star_rating === chosenRating);

	const idx1 = Math.floor(Math.random() * pool.length);
	let idx2 = Math.floor(Math.random() * (pool.length - 1));
	if (idx2 >= idx1) idx2++;

	homeResult = pool[idx1];
	awayResult = pool[idx2];
}

/**
 * Re-rolls a single team (home or away) while keeping the other.
 * The new team must match the kept team's exact star rating.
 * @param {"home"|"away"} side
 */
async function rerollSingle(side) {
	error = "";
	const other = side === "home" ? awayResult : homeResult;
	if (!other) return;

	const sameRating = await getTeamsByExactRating(other.star_rating);
	const candidates = sameRating.filter((t) => t.name !== other.name);

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
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center"
	onmousedown={(e) => { if (e.target === e.currentTarget) onClose(); }}
	onkeydown={(e) => e.key === "Escape" && onClose()}
>
	<div class="bg-bg-secondary border-t border-border rounded-t-2xl sm:rounded-2xl sm:border w-full max-w-lg max-h-[85vh] overflow-y-auto p-5 sm:mx-4">
		<!-- Title -->
		<h2 class="text-lg font-bold text-text-primary text-center mb-5">
			{$t("new_game.random_teams_title")}
		</h2>

		<!-- Star Range Selectors with a horizontal half-star scroller
		     so picking 3.5★ is precise on mobile. The star strip is
		     a read-only visualisation; the scroller is the input. -->
		<div class="flex flex-col gap-4 mb-5">
			<div>
				<label class="text-xs font-medium text-text-secondary mb-1.5 block">
					{$t("new_game.random_min_stars")}
				</label>
				<div class="flex items-center gap-3">
					<StarRating rating={minStars} size="md" />
					<div class="flex-1">
						<MinuteScroller
							value={minStars}
							min={0.5}
							max={5}
							step={0.5}
							variant="secondary"
							onChange={(v) => {
								minStars = v;
								if (minStars > maxStars) maxStars = minStars;
							}}
						/>
					</div>
				</div>
			</div>

			<div>
				<label class="text-xs font-medium text-text-secondary mb-1.5 block">
					{$t("new_game.random_max_stars")}
				</label>
				<div class="flex items-center gap-3">
					<StarRating rating={maxStars} size="md" />
					<div class="flex-1">
						<MinuteScroller
							value={maxStars}
							min={0.5}
							max={5}
							step={0.5}
							variant="secondary"
							onChange={(v) => {
								maxStars = v;
								if (maxStars < minStars) minStars = maxStars;
							}}
						/>
					</div>
				</div>
			</div>
		</div>

		<!-- Search Button -->
		<button
			type="button"
			onclick={searchRandomTeams}
			class="w-full mb-5 rounded-xl bg-accent-red hover:bg-accent-red-hover text-white text-sm font-semibold px-5 py-2.5 shadow-md shadow-accent-red/20 transition-colors"
		>
			{$t("new_game.random_search")}
		</button>

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
			<div class="flex gap-2">
				<button
					type="button"
					onclick={searchRandomTeams}
					class="flex-1 rounded-xl border border-border bg-bg-input hover:bg-bg-card text-text-secondary text-sm font-semibold px-4 py-2.5 transition-colors"
				>
					{$t("new_game.random_reroll")}
				</button>
				<button
					type="button"
					onclick={handleConfirm}
					class="flex-1 rounded-xl bg-accent-red hover:bg-accent-red-hover text-white text-sm font-semibold px-4 py-2.5 shadow-md shadow-accent-red/20 transition-colors"
				>
					{$t("new_game.random_confirm")}
				</button>
			</div>
		{/if}

		<!-- Cancel Button -->
		<button
			type="button"
			onclick={onClose}
			class="w-full mt-4 py-2 text-xs font-medium text-text-muted hover:text-text-primary rounded-lg transition-colors"
		>
			{$t("new_game.random_cancel")}
		</button>
	</div>
</div>
