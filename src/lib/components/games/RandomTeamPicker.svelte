<script>
import { getTranslate } from "@tolgee/svelte";
import StepScroller from "$lib/components/games/StepScroller.svelte";
import OvrBadge from "$lib/components/ui/OvrBadge.svelte";
import Sheet from "$lib/components/ui/Sheet.svelte";
import StarRating from "$lib/components/ui/StarRating.svelte";
import TeamLogo from "$lib/components/ui/TeamLogo.svelte";
import { getAllTeams } from "$lib/services/teams.services.js";

/**
 * RandomTeamPicker - Sheet for picking two random teams of equal star rating
 * within a configurable min/max range. Both teams always share the same exact star rating.
 * @param {Function} onClose - Close handler
 * @param {(homeTeam: string, awayTeam: string) => void} onConfirm - Confirm handler with team names
 */
let { onClose, onConfirm } = $props();

const { t } = getTranslate();
const uid = $props.id();

let minStars = $state(4);
let maxStars = $state(5);
let homeResult = $state(null);
let awayResult = $state(null);
let error = $state("");

/**
 * Screen-reader text for a star-range slider, e.g. "3.5 stars" instead of "3.5"
 * @param {number} stars
 * @returns {string}
 */
function starsValueText(stars) {
	return $t("new_game.random_stars_value", { stars });
}

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

	let teams;
	try {
		teams = await getAllTeams();
	} catch (err) {
		console.error("Failed to load teams:", err);
		error = $t("teams.error_loading");
		return;
	}
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

{#snippet resultRow(team, side)}
	<div class="result-row">
		<TeamLogo logoUrl={team.logo_url} teamName={team.name} size="md" />
		<div class="flex-1 min-w-0">
			<p class="m-0 text-sm font-bold truncate">{team.name}</p>
			<div class="flex items-center gap-2 mt-1">
				<OvrBadge rating={team.overall_rating} size="xs" />
				<StarRating rating={team.star_rating} size="xs" />
			</div>
		</div>
		<button
			type="button"
			onclick={() => rerollSingle(side)}
			class="btn btn-ghost btn-icon shrink-0"
			aria-label={side === "home"
				? $t("new_game.random_reroll_home")
				: $t("new_game.random_reroll_away")}
		>
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
				<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
				<path d="M21 3v5h-5" />
			</svg>
		</button>
	</div>
{/snippet}

{#snippet starRange(labelId, label, rating, onChange)}
	<div class="flex flex-col gap-2">
		<span id={labelId} class="label text-muted">{label}</span>
		<div class="flex items-center gap-3">
			<StarRating {rating} size="md" />
			<div class="flex-1 min-w-0">
				<StepScroller
					value={rating}
					min={0.5}
					max={5}
					step={0.5}
					labelledBy={labelId}
					valueText={starsValueText}
					{onChange}
				/>
			</div>
		</div>
	</div>
{/snippet}

<Sheet title={$t("new_game.random_teams_title")} {onClose}>
	<div class="flex flex-col gap-5">
		<!-- Star range with a horizontal half-star scroller so picking
		     3.5★ is precise on mobile. The star strip is a read-only
		     visualisation; the scroller is the input. -->
		<div class="flex flex-col gap-4">
			{@render starRange(`${uid}-min-stars`, $t("new_game.random_min_stars"), minStars, (v) => {
				minStars = v;
				if (minStars > maxStars) maxStars = minStars;
			})}
			{@render starRange(`${uid}-max-stars`, $t("new_game.random_max_stars"), maxStars, (v) => {
				maxStars = v;
				if (maxStars < minStars) minStars = maxStars;
			})}
		</div>

		<button type="button" onclick={searchRandomTeams} class="btn btn-primary w-full">
			{$t("new_game.random_search")}
		</button>

		{#if error}
			<p class="m-0 text-sm font-bold text-loss text-center">{error}</p>
		{/if}

		{#if homeResult && awayResult}
			<div class="flex flex-col gap-2">
				{@render resultRow(homeResult, "home")}
				<p class="versus label text-muted">{$t("new_game.random_vs")}</p>
				{@render resultRow(awayResult, "away")}
			</div>

			<div class="grid grid-cols-2 gap-2">
				<button type="button" onclick={searchRandomTeams} class="btn btn-secondary">
					{$t("new_game.random_reroll")}
				</button>
				<button type="button" onclick={handleConfirm} class="btn btn-primary">
					{$t("new_game.random_confirm")}
				</button>
			</div>
		{/if}

		<button type="button" onclick={onClose} class="btn btn-ghost w-full">
			{$t("new_game.random_cancel")}
		</button>
	</div>
</Sheet>

<style>
.result-row {
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 10px 6px 10px 12px;
	background: var(--color-sunken);
	border-radius: var(--radius-tile);
}

.versus {
	margin: 0;
	text-align: center;
}
</style>
