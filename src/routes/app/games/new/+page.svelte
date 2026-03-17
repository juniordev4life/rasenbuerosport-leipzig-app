<script>
import { getTranslate } from "@tolgee/svelte";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { goto } from "$app/navigation";
import { page } from "$app/state";
import MatchPrediction from "$lib/components/games/MatchPrediction.svelte";
import PlayerSelectionStep from "$lib/components/games/PlayerSelectionStep.svelte";
import ScoreStep from "$lib/components/games/ScoreStep.svelte";
import StepIndicator from "$lib/components/games/StepIndicator.svelte";
import TeamSelectionStep from "$lib/components/games/TeamSelectionStep.svelte";
import { storage } from "$lib/config/firebase.config.js";
import { ROUTES } from "$lib/constants/routes.constants.js";
import { get, post } from "$lib/services/api.services.js";
import { resizeImage } from "$lib/utils/image.utils.js";
import { parseRematchParams } from "$lib/utils/rematch.utils.js";

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

// Step 3: Score + Timeline + Stats
let scoreHome = $state(0);
let scoreAway = $state(0);
let scoreTimeline = $state([]);
let resultType = $state("regular");
let statsOverview = $state(null);
let statsPasses = $state(null);
let statsDefense = $state(null);

// Save state
let saving = $state(false);

// Data from API
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

// Detect rematch mode from URL params
const isRematch = $derived(page.url.searchParams.has("hp"));

$effect(() => {
	loadData().then(() => {
		const rematch = parseRematchParams(page.url.searchParams);
		if (rematch) {
			homePlayers = rematch.homePlayers;
			awayPlayers = rematch.awayPlayers;
			homeTeam = rematch.homeTeam;
			awayTeam = rematch.awayTeam;
			step = 3;
		}
	});
});

async function loadData() {
	try {
		const res = await get("/v1/players");
		allPlayers = res.data || [];
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

		const res = await post("/v1/games", {
			mode,
			score_home: scoreHome,
			score_away: scoreAway,
			players,
			score_timeline: scoreTimeline.length > 0 ? scoreTimeline : undefined,
			result_type: resultType,
		});

		const gameId = res.data?.id;

		// Upload stats images if selected
		const statsFiles = [
			{ file: statsOverview, type: "overview" },
			{ file: statsPasses, type: "passes" },
			{ file: statsDefense, type: "defense" },
		].filter((s) => s.file);

		if (statsFiles.length > 0 && gameId) {
			for (const { file, type } of statsFiles) {
				try {
					const resized = await resizeImage(file);
					const storageRef = ref(storage, `match-stats/${gameId}/${type}.jpg`);

					await uploadBytes(storageRef, resized);
					const imageUrl = await getDownloadURL(storageRef);

					await post(`/v1/games/${gameId}/match-stats`, {
						imageUrl,
						type,
					});
				} catch (statsErr) {
					console.error(`Stats extraction failed (${type}):`, statsErr);
				}
			}

			// Auto-generate match report after all stats are uploaded
			try {
				await post(`/v1/games/${gameId}/match-report`);
			} catch (reportErr) {
				console.error("Match report generation failed:", reportErr);
			}
		}

		// Navigate to game detail if stats were uploaded, otherwise dashboard
		if (statsFiles.length > 0 && gameId) {
			goto(`/app/games/${gameId}`);
		} else {
			goto(ROUTES.DASHBOARD);
		}
	} catch (err) {
		console.error("Failed to save game:", err);
	} finally {
		saving = false;
	}
}
</script>

<svelte:head>
	<title>RasenBürosport - {isRematch ? $t("rematch.title") : $t("new_game.title")}</title>
</svelte:head>

<div class="flex flex-col gap-5">
	<h1 class="text-xl font-bold text-text-primary text-center">
		{isRematch ? $t("rematch.title") : $t("new_game.title")}
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
		<!-- AI Match Prediction (visible when players + teams are set) -->
		<MatchPrediction
			{homePlayers}
			{awayPlayers}
			{homeTeam}
			{awayTeam}
			{mode}
			{allPlayers}
		/>

		<ScoreStep
			{homeTeam}
			{awayTeam}
			{homePlayers}
			{awayPlayers}
			{allPlayers}
			bind:scoreHome
			bind:scoreAway
			bind:scoreTimeline
			bind:resultType
			bind:statsOverview
			bind:statsPasses
			bind:statsDefense
			{saving}
			onSave={saveGame}
			onBack={goBack}
		/>
	{/if}
</div>
