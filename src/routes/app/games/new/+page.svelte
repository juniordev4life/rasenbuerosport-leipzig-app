<script>
	import { getTranslate } from "@tolgee/svelte";
	import { goto } from "$app/navigation";
	import { user } from "$lib/stores/auth.stores.js";
	import { get, post } from "$lib/services/api.services.js";
	import { ROUTES } from "$lib/constants/routes.constants.js";
	import StepIndicator from "$lib/components/games/StepIndicator.svelte";
	import GameSetupStep from "$lib/components/games/GameSetupStep.svelte";
	import ScoreEntryStep from "$lib/components/games/ScoreEntryStep.svelte";
	import GameSummaryStep from "$lib/components/games/GameSummaryStep.svelte";

	const { t } = getTranslate();

	// Wizard state
	let step = $state(1);

	// Step 1: Setup
	let mode = $state("1v1");
	let homePlayers = $state([""]);
	let awayPlayers = $state([""]);
	let homeTeam = $state("");
	let awayTeam = $state("");

	// Step 2: Score
	let scoreHome = $state(0);
	let scoreAway = $state(0);

	// Step 3: Ratings
	let ratings = $state({});
	let saving = $state(false);

	// Data from API
	let allPlayers = $state([]);
	let allTeams = $state([]);
	let loading = $state(true);

	// Derived helper values
	const homePlayerNames = $derived(
		homePlayers
			.filter(Boolean)
			.map((id) => allPlayers.find((p) => p.id === id)?.username || "?"),
	);

	const awayPlayerNames = $derived(
		awayPlayers
			.filter(Boolean)
			.map((id) => allPlayers.find((p) => p.id === id)?.username || "?"),
	);

	const homeTeamName = $derived(
		homeTeam ? allTeams.find((t) => t.id === homeTeam)?.name || "" : "",
	);

	const awayTeamName = $derived(
		awayTeam ? allTeams.find((t) => t.id === awayTeam)?.name || "" : "",
	);

	const allPlayerIds = $derived(
		[...homePlayers, ...awayPlayers].filter(Boolean),
	);

	$effect(() => {
		loadData();
	});

	async function loadData() {
		try {
			const [playersRes, teamsRes] = await Promise.all([
				get("/v1/players"),
				get("/v1/teams"),
			]);
			allPlayers = playersRes.data || [];
			allTeams = teamsRes.data || [];
		} catch (err) {
			console.error("Failed to load data:", err);
		} finally {
			loading = false;
		}
	}

	function goToStep2() {
		step = 2;
	}

	function goToStep3() {
		// Initialize ratings for all players
		for (const id of allPlayerIds) {
			if (!ratings[id]) {
				ratings[id] = 0;
			}
		}
		step = 3;
	}

	function goBack() {
		step = Math.max(1, step - 1);
	}

	async function saveGame() {
		saving = true;
		try {
			const players = [
				...homePlayers.filter(Boolean).map((id) => ({
					id,
					team: "home",
					team_name: homeTeam || undefined,
					rating: ratings[id] || undefined,
				})),
				...awayPlayers.filter(Boolean).map((id) => ({
					id,
					team: "away",
					team_name: awayTeam || undefined,
					rating: ratings[id] || undefined,
				})),
			];

			await post("/v1/games", {
				mode,
				score_home: scoreHome,
				score_away: scoreAway,
				players,
			});

			goto(ROUTES.DASHBOARD);
		} catch (err) {
			console.error("Failed to save game:", err);
		} finally {
			saving = false;
		}
	}
</script>

<svelte:head>
	<title>RasenBürosport - {$t("new_game.title")}</title>
</svelte:head>

<div class="flex flex-col gap-5">
	<h1 class="text-xl font-bold text-text-primary text-center">
		{$t("new_game.title")}
	</h1>

	<StepIndicator currentStep={step} totalSteps={3} />

	{#if loading}
		<div class="flex justify-center py-8">
			<div
				class="animate-spin h-8 w-8 border-2 border-accent-red border-t-transparent rounded-full"
			></div>
		</div>
	{:else if step === 1}
		<GameSetupStep
			bind:mode
			bind:homePlayers
			bind:awayPlayers
			bind:homeTeam
			bind:awayTeam
			{allPlayers}
			{allTeams}
			onNext={goToStep2}
		/>
	{:else if step === 2}
		<ScoreEntryStep
			bind:scoreHome
			bind:scoreAway
			{homeTeamName}
			{awayTeamName}
			{homePlayerNames}
			{awayPlayerNames}
			onNext={goToStep3}
			onBack={goBack}
		/>
	{:else if step === 3}
		<GameSummaryStep
			{mode}
			{scoreHome}
			{scoreAway}
			{homeTeamName}
			{awayTeamName}
			{homePlayerNames}
			{awayPlayerNames}
			bind:ratings
			{allPlayerIds}
			{saving}
			onSave={saveGame}
			onBack={goBack}
		/>
	{/if}
</div>
