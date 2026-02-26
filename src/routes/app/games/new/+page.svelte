<script>
	import { getTranslate } from "@tolgee/svelte";
	import { goto } from "$app/navigation";
	import { post } from "$lib/services/api.services.js";
	import { supabase } from "$lib/config/supabase.config.js";
	import { ROUTES } from "$lib/constants/routes.constants.js";
	import StepIndicator from "$lib/components/games/StepIndicator.svelte";
	import PlayerSelectionStep from "$lib/components/games/PlayerSelectionStep.svelte";
	import TeamSelectionStep from "$lib/components/games/TeamSelectionStep.svelte";
	import ScoreStep from "$lib/components/games/ScoreStep.svelte";

	const { t } = getTranslate();

	const GUEST_ID = "__guest__";

	// Wizard state
	let step = $state(1);

	// Step 1: Player selection (IDs including guest IDs)
	let homePlayers = $state([]);
	let awayPlayers = $state([]);

	// Step 2: Teams
	let homeTeam = $state("");
	let awayTeam = $state("");

	// Step 3: Score + Timeline
	let scoreHome = $state(0);
	let scoreAway = $state(0);
	let scoreTimeline = $state([]);
	let resultType = $state("regular");

	// Save state
	let saving = $state(false);

	// Data from Supabase
	let allPlayers = $state([]);
	let loading = $state(true);

	// Auto-derive game mode from player counts
	const mode = $derived.by(() => {
		const h = homePlayers.length;
		const a = awayPlayers.length;
		if (h === 1 && a === 1) return "1v1";
		if (h === 2 && a === 2) return "2v2";
		return `${h}v${a}`;
	});

	$effect(() => {
		loadData();
	});

	async function loadData() {
		try {
			const { data, error } = await supabase
				.from("profiles")
				.select("id, username, avatar_url")
				.order("username", { ascending: true });

			if (error) throw error;
			allPlayers = data || [];
		} catch (err) {
			console.error("Failed to load players:", err);
		} finally {
			loading = false;
		}
	}

	function goToStep(n) {
		step = n;
	}

	function goBack() {
		step = Math.max(1, step - 1);
	}

	async function saveGame() {
		saving = true;
		try {
			// Filter out guest players (they don't have real IDs in the DB)
			const players = [
				...homePlayers
					.filter((id) => !id.startsWith(GUEST_ID))
					.map((id) => ({
						id,
						team: "home",
						team_name: homeTeam || undefined,
					})),
				...awayPlayers
					.filter((id) => !id.startsWith(GUEST_ID))
					.map((id) => ({
						id,
						team: "away",
						team_name: awayTeam || undefined,
					})),
			];

			await post("/v1/games", {
				mode,
				score_home: scoreHome,
				score_away: scoreAway,
				players,
				score_timeline: scoreTimeline.length > 0 ? scoreTimeline : undefined,
				result_type: resultType,
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
		<PlayerSelectionStep
			{allPlayers}
			bind:homePlayers
			bind:awayPlayers
			onNext={() => goToStep(2)}
		/>
	{:else if step === 2}
		<TeamSelectionStep
			{homePlayers}
			{awayPlayers}
			{allPlayers}
			bind:homeTeam
			bind:awayTeam
			onNext={() => goToStep(3)}
			onBack={goBack}
		/>
	{:else if step === 3}
		<ScoreStep
			{homeTeam}
			{awayTeam}
			bind:scoreHome
			bind:scoreAway
			bind:scoreTimeline
			bind:resultType
			{saving}
			onSave={saveGame}
			onBack={goBack}
		/>
	{/if}
</div>
