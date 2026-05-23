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

		if (gameId) {
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

{#if step === 1 || step === 2 || step === 3}
	<div class="screen-banner">
		{step === 1
			? $t("new_game.banner.step_1")
			: step === 2
				? $t("new_game.banner.step_2")
				: $t("new_game.banner.step_3")}
	</div>
{/if}

<div class="flex flex-col gap-5 lg:gap-7 max-w-4xl mx-auto w-full pt-4">
	{#if step !== 3}
		<header class="text-center">
			<h1 class="screen-hero-title">
				{step === 1
					? $t("new_game.lobby.page_title")
					: $t("new_game.poster.page_title")}
			</h1>
			<p class="screen-hero-subtitle">
				{step === 1
					? $t("new_game.lobby.page_subtitle")
					: $t("new_game.poster.page_subtitle")}
			</p>
		</header>
	{/if}

	<!-- 2-step indicator (hidden on live screen for screen real-estate) -->
	{#if step !== 3}
		<div style="max-width: 280px; margin: 0 auto; padding: 0 8px; width: 100%;">
			<div style="display: flex; align-items: center; gap: 8px;">
				<div
					class="step-circle {visibleStep === 1 ? 'active' : 'complete'}"
					style="flex-shrink: 0; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 800; border: 2px solid; color: white; {visibleStep === 1 ? 'background: linear-gradient(135deg, #E24B4A, #C73E3D); border-color: rgba(226, 75, 74, 0.4); box-shadow: 0 4px 14px rgba(226, 75, 74, 0.35);' : 'background: linear-gradient(135deg, #84CC16, #65A30D); border-color: rgba(132, 204, 22, 0.4); box-shadow: 0 4px 14px rgba(132, 204, 22, 0.35);'}"
				>
					{#if visibleStep === 1}
						1
					{:else}
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" width="14" height="14" aria-hidden="true">
							<polyline points="20 6 9 17 4 12" />
						</svg>
					{/if}
				</div>
				<div style="flex: 1; height: 2px; background: #1A1F2A; border-radius: 1px; overflow: hidden; position: relative;">
					<div style="height: 100%; background: linear-gradient(90deg, #84CC16, #65A30D); border-radius: 1px; width: {visibleStep === 1 ? '0%' : '100%'}; transition: width 0.4s ease;"></div>
				</div>
				<div
					style="flex-shrink: 0; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 800; border: 2px solid; {visibleStep === 2 ? 'background: linear-gradient(135deg, #E24B4A, #C73E3D); border-color: rgba(226, 75, 74, 0.4); color: white; box-shadow: 0 4px 14px rgba(226, 75, 74, 0.35);' : 'background: #1A1F2A; border-color: #2A3142; color: #6B7280;'}"
				>
					2
				</div>
			</div>
			<div style="display: flex; justify-content: space-between; margin-top: 6px;">
				<div style="width: 32px; text-align: center; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: {visibleStep === 1 ? '#E24B4A' : '#84CC16'};">
					{$t("new_game.lobby.step_label")}
				</div>
				<div style="width: 32px; text-align: center; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: {visibleStep === 2 ? '#E24B4A' : '#6B7280'};">
					{$t("new_game.poster.step_label")}
				</div>
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

<style>
.screen-banner {
	text-align: center;
	font-size: 11px;
	color: #9CA3AF;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.1em;
	padding: 8px 0;
	background: rgba(226, 75, 74, 0.08);
	border-bottom: 1px solid rgba(226, 75, 74, 0.2);
	margin: 0 -1rem;
}
.screen-hero-title {
	font-size: 22px;
	font-weight: 800;
	letter-spacing: -0.02em;
	margin: 0 0 4px;
	color: #FFFFFF;
}
.screen-hero-subtitle {
	font-size: 12px;
	color: #9CA3AF;
	margin: 0;
}
</style>
