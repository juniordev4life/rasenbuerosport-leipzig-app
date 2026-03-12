<script>
	import { getTranslate } from "@tolgee/svelte";
	import { getAllTeams, getLeagues } from "$lib/services/teams.services.js";
	import { getCountryFlag } from "$lib/constants/teams.constants.js";
	import TeamLogo from "$lib/components/ui/TeamLogo.svelte";
	import OvrBadge from "$lib/components/ui/OvrBadge.svelte";
	import StarRating from "$lib/components/ui/StarRating.svelte";

	const { t } = getTranslate();

	let teams = $state([]);
	let leagues = $state([]);
	let loading = $state(true);
	let searchQuery = $state("");
	let selectedLeague = $state("");
	let sortBy = $state("name");

	$effect(() => {
		Promise.all([getAllTeams(), getLeagues()]).then(([teamsData, leaguesData]) => {
			teams = teamsData;
			leagues = leaguesData;
			loading = false;
		});
	});

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
			result = [...result].sort((a, b) => (b.overall_rating || 0) - (a.overall_rating || 0));
		}

		return result;
	});
</script>

<svelte:head>
	<title>RasenBürosport - {$t("teams.title")}</title>
</svelte:head>

<div class="flex flex-col gap-4">
	<h1 class="text-xl font-bold">{$t("teams.title")}</h1>

	<!-- Filters -->
	<div class="flex flex-col gap-2">
		<!-- Search -->
		<input
			type="text"
			bind:value={searchQuery}
			placeholder={$t("teams.search_placeholder")}
			class="w-full bg-bg-input border border-border rounded-lg px-3 py-2.5 text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-red"
		/>

		<!-- League + Sort -->
		<div class="flex gap-2">
			<select
				bind:value={selectedLeague}
				class="flex-1 bg-bg-input border border-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-red"
			>
				<option value="">{$t("teams.all_leagues")}</option>
				{#each leagues as league (league)}
					<option value={league}>{league}</option>
				{/each}
			</select>

			<div class="flex rounded-lg border border-border overflow-hidden shrink-0">
				<button
					type="button"
					onclick={() => { sortBy = "name"; }}
					class="px-3 py-2 text-xs font-medium transition-colors {sortBy === 'name' ? 'bg-accent-red text-white' : 'bg-bg-input text-text-secondary hover:text-text-primary'}"
				>
					{$t("teams.sort_name")}
				</button>
				<button
					type="button"
					onclick={() => { sortBy = "overall_rating"; }}
					class="px-3 py-2 text-xs font-medium transition-colors {sortBy === 'overall_rating' ? 'bg-accent-red text-white' : 'bg-bg-input text-text-secondary hover:text-text-primary'}"
				>
					{$t("teams.sort_rating")}
				</button>
			</div>
		</div>
	</div>

	<!-- Team count -->
	<p class="text-xs text-text-secondary">
		{$t("teams.team_count", { count: filteredTeams.length })}
	</p>

	<!-- Teams list -->
	{#if loading}
		<div class="flex justify-center py-8">
			<div class="animate-spin h-8 w-8 border-2 border-accent-red border-t-transparent rounded-full"></div>
		</div>
	{:else if filteredTeams.length === 0}
		<div class="text-center py-8">
			<p class="text-text-secondary">{$t("teams.no_results")}</p>
		</div>
	{:else}
		<div class="flex flex-col gap-1 lg:grid lg:grid-cols-2 lg:gap-3">
			{#each filteredTeams as team (team.id)}
				<div class="flex items-center gap-3 bg-bg-secondary border border-border rounded-lg px-3 py-2.5 hover:bg-bg-input transition-colors">
					<!-- Logo -->
					<TeamLogo logoUrl={team.logo_url} teamName={team.name} size="md" />

					<!-- Name + League -->
					<div class="flex-1 min-w-0">
						<p class="text-sm font-medium text-text-primary truncate">{team.name}</p>
						{#if team.league_name}
							<p class="text-[10px] text-text-secondary truncate">
								{getCountryFlag(team.country_code)} {team.league_name}
							</p>
						{/if}
					</div>

					<!-- OVR + Stars -->
					<div class="flex items-center gap-2 shrink-0">
						<OvrBadge rating={team.overall_rating} size="sm" />
						<StarRating rating={team.star_rating} size="sm" />
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
