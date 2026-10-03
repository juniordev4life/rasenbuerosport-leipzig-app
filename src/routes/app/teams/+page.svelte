<script>
import { getTranslate } from "@tolgee/svelte";
import OvrBadge from "$lib/components/ui/OvrBadge.svelte";
import SegmentedControl from "$lib/components/ui/SegmentedControl.svelte";
import StarRating from "$lib/components/ui/StarRating.svelte";
import TeamLogo from "$lib/components/ui/TeamLogo.svelte";
import { getCountryFlag } from "$lib/constants/teams.constants.js";
import { getAllTeams, getLeagues } from "$lib/services/teams.services.js";

const { t } = getTranslate();

let teams = $state([]);
let leagues = $state([]);
let loading = $state(true);
let loadFailed = $state(false);
let searchQuery = $state("");
let selectedLeague = $state("");
let sortBy = $state("name");

$effect(() => {
	Promise.all([getAllTeams(), getLeagues()])
		.then(([teamsData, leaguesData]) => {
			teams = teamsData;
			leagues = leaguesData;
		})
		.catch((err) => {
			console.error("Failed to load teams:", err);
			loadFailed = true;
		})
		.finally(() => {
			loading = false;
		});
});

const sortOptions = $derived([
	{ value: "name", label: $t("teams.sort_name") },
	{ value: "overall_rating", label: $t("teams.sort_rating") },
]);

const filteredTeams = $derived.by(() => {
	let result = teams;

	if (searchQuery) {
		const q = searchQuery.toLowerCase();
		result = result.filter((t) => t.name.toLowerCase().includes(q));
	}

	if (selectedLeague) {
		result = result.filter((t) => t.league_name === selectedLeague);
	}

	if (sortBy === "overall_rating") {
		result = [...result].sort(
			(a, b) => (b.overall_rating || 0) - (a.overall_rating || 0),
		);
	}

	return result;
});
</script>

<svelte:head>
	<title>RasenBürosport - {$t("teams.title")}</title>
</svelte:head>

<div class="stack pb-4 lg:pb-8">
	<header class="hero bleed page-hero">
		<div class="hero-head">
			<h1 class="page-title page-hero-title">{$t("teams.title")}</h1>
			<p class="count" aria-live="polite">
				{$t("teams.team_count", { count: filteredTeams.length })}
			</p>
		</div>

		<div class="filters">
			<label class="search">
				<span class="sr-only">{$t("teams.search_placeholder")}</span>
				<svg
					class="search-icon"
					viewBox="0 0 24 24"
					width="18"
					height="18"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					aria-hidden="true"
				>
					<circle cx="11" cy="11" r="7" />
					<line x1="16.5" y1="16.5" x2="21" y2="21" />
				</svg>
				<input
					type="search"
					bind:value={searchQuery}
					placeholder={$t("teams.search_placeholder")}
					class="field pill search-field"
				/>
			</label>

			<div class="filter-row">
				<select
					bind:value={selectedLeague}
					class="field pill league"
					aria-label={$t("teams.league_label")}
				>
					<option value="">{$t("teams.all_leagues")}</option>
					{#each leagues as league (league)}
						<option value={league}>{league}</option>
					{/each}
				</select>

				<SegmentedControl
					options={sortOptions}
					value={sortBy}
					onChange={(next) => (sortBy = next)}
					ariaLabel={$t("teams.sort_label")}
					class="sort"
				/>
			</div>
		</div>
	</header>

	{#if loading}
		<div class="flex justify-center py-12">
			<span class="spinner" role="status" aria-label={$t("common.loading")}></span>
		</div>
	{:else if loadFailed}
		<p class="card notice" role="alert">{$t("teams.error_loading")}</p>
	{:else if filteredTeams.length === 0}
		<p class="card notice">{$t("teams.no_results")}</p>
	{:else}
		<ul class="team-list">
			{#each filteredTeams as team (team.id)}
				<li class="team">
					<TeamLogo logoUrl={team.logo_url} teamName={team.name} size="md" />
					<span class="flex flex-col gap-0.5 flex-1 min-w-0">
						<span class="font-bold truncate">{team.name}</span>
						{#if team.league_name}
							<span class="league-name truncate">
								<span aria-hidden="true">{getCountryFlag(team.country_code)}</span>
								{team.league_name}
							</span>
						{/if}
					</span>
					<span class="rating">
						<OvrBadge rating={team.overall_rating} size="sm" />
						<StarRating rating={team.star_rating} size="sm" />
					</span>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
/* ── Hero: title and count, then the filters ──────────────────────────── */
.page-hero {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.hero-head {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.count {
	margin: 0;
	font-size: 15px;
	font-weight: 700;
}

.filters {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.search {
	position: relative;
	display: block;
}

.search-icon {
	position: absolute;
	left: 14px;
	top: 50%;
	transform: translateY(-50%);
	color: var(--color-muted);
	pointer-events: none;
}

/* White pills, like the filters of the match history. */
.pill {
	min-height: 40px;
	border-color: transparent;
	border-radius: 999px;
	font-size: 14px;
}

.pill:focus {
	border-color: var(--color-navy);
	box-shadow: 0 0 0 1px var(--color-navy);
}

/* Plain text-field look in Safari too (search inputs bring their own). */
.search-field {
	padding-left: 40px;
	appearance: none;
}

.filter-row {
	display: flex;
	align-items: center;
	gap: 16px;
}

.league {
	flex: 1;
	min-width: 0;
	width: auto;
	font-weight: 700;
	cursor: pointer;
}

.filter-row :global(.sort) {
	flex-shrink: 0;
}

:global([data-variant="b"]) .page-hero {
	gap: 12px;
}

:global([data-variant="b"]) .hero-head {
	flex-direction: row;
	align-items: center;
	gap: 12px;
}

/* B: the count is a white sticker next to the title. */
:global([data-variant="b"]) .count {
	padding: 4px 12px;
	border-radius: 999px;
	background: var(--color-surface);
	color: var(--color-ink);
	font-size: 13px;
	text-shadow: none;
	box-shadow: var(--shadow-control);
}

:global([data-variant="b"]) .pill:not(:focus) {
	box-shadow: var(--shadow-control);
}

:global([data-variant="b"]) .filter-row {
	gap: 10px;
}

:global([data-variant="b"]) .filter-row :global(.sort) {
	min-width: 12rem;
}

/* ── Team list: rows in one card on phones, a grid of cards on desktop ─ */
.team-list {
	margin: 0;
	padding: 0;
	list-style: none;
	background: var(--color-surface);
	border-radius: var(--radius-card);
	box-shadow: var(--shadow-card);
}

.team {
	display: flex;
	align-items: center;
	gap: 12px;
	min-height: 64px;
	padding: 10px 16px;
}

.team + .team {
	border-top: 1px solid var(--color-line);
}

.league-name {
	font-size: 13px;
	color: var(--color-muted);
}

.rating {
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	gap: 4px;
	flex-shrink: 0;
}

/* Desktop: the top bar carries the title; the hero becomes a toolbar on
 * the page and the catalog a grid of cards. */
@media (min-width: 1024px) {
	.page-hero {
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		gap: 24px;
		margin: 0;
		padding: 0;
		background: transparent;
		color: var(--color-on-page);
	}

	.page-hero-title {
		display: none;
	}

	/* The count moves to the right end of the toolbar. */
	.hero-head {
		order: 2;
		margin-left: auto;
	}

	.count {
		white-space: nowrap;
	}

	.filters {
		flex-direction: row;
		align-items: center;
		flex: 1;
		min-width: 0;
		gap: 16px;
	}

	.search {
		flex: 0 1 22rem;
	}

	.league {
		flex: 0 1 16rem;
	}

	:global([data-variant="a"]) .pill:not(:focus) {
		border-color: var(--color-line);
	}

	.team-list {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 12px;
		background: transparent;
		box-shadow: none;
	}

	.team {
		background: var(--color-surface);
		border-radius: var(--radius-card);
		box-shadow: var(--shadow-card);
	}

	.team + .team {
		border-top: 0;
	}
}

@media (min-width: 1280px) {
	.team-list {
		grid-template-columns: repeat(4, minmax(0, 1fr));
	}
}
</style>
