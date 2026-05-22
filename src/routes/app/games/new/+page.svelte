<script>
import { getTranslate } from "@tolgee/svelte";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { goto } from "$app/navigation";
import { page } from "$app/state";
import MatchPosterStep from "$lib/components/games/MatchPosterStep.svelte";
import MatchPrediction from "$lib/components/games/MatchPrediction.svelte";
import PlayerLobbyStep from "$lib/components/games/PlayerLobbyStep.svelte";
import ScoreStep from "$lib/components/games/ScoreStep.svelte";
import LiveMatchStep from "$lib/components/liveMatch/LiveMatchStep.svelte";
import { storage } from "$lib/config/firebase.config.js";
import { ROUTES } from "$lib/constants/routes.constants.js";
import { get, post } from "$lib/services/api.services.js";
import { resizeImage } from "$lib/utils/image.utils.js";
import { parseRematchParams } from "$lib/utils/rematch.utils.js";

const { t } = getTranslate();

const GUEST_ID = "__guest__";

// Wizard step. 1 = Lobby, 2 = Match poster, 3 = Live-match event entry,
// 4 = Score (only reached via the rematch shortcut). The visible
// stepper stops at "Anpfiff" — 3 and 4 are linear follow-ups.
let step = $state(1);

let homePlayers = $state([]);
let awayPlayers = $state([]);

let homeTeam = $state("");
let awayTeam = $state("");

let scoreHome = $state(0);
let scoreAway = $state(0);
let scoreTimeline = $state([]);
let resultType = $state("regular");
let statsOverview = $state(null);
let statsPasses = $state(null);
let statsDefense = $state(null);

let saving = $state(false);

let allPlayers = $state([]);
let loading = $state(true);

const mode = $derived.by(() => {
	const h = homePlayers.length;
	const a = awayPlayers.length;
	if (h === 1 && a === 1) return "1v1";
	if (h === 2 && a === 2) return "2v2";
	return `${h}v${a}`;
});

const isRematch = $derived(page.url.searchParams.has("hp"));

$effect(() => {
	loadData().then(() => {
		const rematch = parseRematchParams(page.url.searchParams);
		if (rematch) {
			homePlayers = rematch.homePlayers;
			awayPlayers = rematch.awayPlayers;
			homeTeam = rematch.homeTeam;
			awayTeam = rematch.awayTeam;
			step = 4;
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

function cancel() {
	goto(ROUTES.DASHBOARD);
}

async function saveGame() {
	saving = true;
	try {
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

			try {
				await post(`/v1/games/${gameId}/match-report`);
			} catch (reportErr) {
				console.error("Match report generation failed:", reportErr);
			}
		}

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

/** Index of the active stepper dot. Steps 3 + 4 still highlight "Anpfiff". */
const visibleStep = $derived(step >= 2 ? 2 : 1);

/**
 * Bridge from the live-match step to the existing save pipeline. The
 * live step hands the user's accumulated score + timeline back; we
 * push them into the wizard's bound state and run the standard
 * `saveGame` (no stats screenshots — those are uploaded later on the
 * game-detail page).
 */
function endLiveMatch({ scoreHome: sh, scoreAway: sa, scoreTimeline: st }) {
	scoreHome = sh;
	scoreAway = sa;
	scoreTimeline = st;
	saveGame();
}
</script>

<svelte:head>
	<title>RasenBürosport - {isRematch ? $t("rematch.title") : $t("new_game.title")}</title>
</svelte:head>

<div class="flex flex-col gap-5 lg:gap-7 max-w-4xl mx-auto w-full pt-8">
	{#if step !== 3}
		<header class="text-center">
			<h1 class="text-xl sm:text-2xl font-bold tracking-tight">
				{step === 1
					? $t("new_game.lobby.page_title")
					: step === 2
						? $t("new_game.poster.page_title")
						: $t("new_game.score.page_title")}
			</h1>
			<p class="mt-1 text-sm text-text-secondary">
				{step === 1
					? $t("new_game.lobby.page_subtitle")
					: step === 2
						? $t("new_game.poster.page_subtitle")
						: $t("new_game.score.page_subtitle")}
			</p>
		</header>
	{/if}

	<!-- 2-step indicator (hidden on live screen for screen real-estate) -->
	{#if step !== 3}
	<div class="flex items-start justify-center gap-3">
		<div class="flex flex-col items-center gap-1.5">
			<div class={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
				visibleStep === 1
					? "bg-accent-red text-white ring-4 ring-accent-red/20"
					: "bg-success/15 text-success"
			}`}>
				{visibleStep === 1 ? "1" : "✓"}
			</div>
			<span class={`text-[10px] tracking-[0.05em] uppercase font-semibold ${visibleStep === 1 ? "text-text-primary" : "text-success"}`}>
				{$t("new_game.lobby.step_label")}
			</span>
		</div>
		<div class="flex-1 max-w-[120px] h-px bg-border mt-4"></div>
		<div class="flex flex-col items-center gap-1.5">
			<div class={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
				visibleStep === 2
					? "bg-accent-red text-white ring-4 ring-accent-red/20"
					: "bg-bg-input border border-border text-text-muted"
			}`}>
				2
			</div>
			<span class={`text-[10px] tracking-[0.05em] uppercase font-semibold ${visibleStep === 2 ? "text-text-primary" : "text-text-muted"}`}>
				{$t("new_game.poster.step_label")}
			</span>
		</div>
	</div>
	{/if}

	{#if loading}
		<div class="flex justify-center py-8">
			<div class="animate-spin h-8 w-8 border-2 border-accent-red border-t-transparent rounded-full"></div>
		</div>
	{:else if step === 1}
		<PlayerLobbyStep
			{allPlayers}
			bind:homePlayers
			bind:awayPlayers
			onNext={() => goToStep(2)}
			onCancel={cancel}
		/>
	{:else if step === 2}
		<MatchPosterStep
			{homePlayers}
			{awayPlayers}
			{allPlayers}
			bind:homeTeam
			bind:awayTeam
			onAnpfiff={() => goToStep(3)}
			onBack={goBack}
		/>
	{:else if step === 3}
		<LiveMatchStep
			{homePlayers}
			{awayPlayers}
			{allPlayers}
			{homeTeam}
			{awayTeam}
			ending={saving}
			onEndMatch={endLiveMatch}
			onBack={goBack}
		/>
	{:else if step === 4}
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
