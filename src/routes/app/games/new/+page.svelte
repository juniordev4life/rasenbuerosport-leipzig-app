<script>
import { getTranslate } from "@tolgee/svelte";
import { goto } from "$app/navigation";
import { page } from "$app/state";
import MatchPosterStep from "$lib/components/games/MatchPosterStep.svelte";
import PlayerLobbyStep from "$lib/components/games/PlayerLobbyStep.svelte";
import LiveMatchStep from "$lib/components/liveMatch/LiveMatchStep.svelte";
import { ROUTES } from "$lib/constants/routes.constants.js";
import { get, post } from "$lib/services/api.services.js";
import {
	isOnboardingDone,
	ONBOARDING_KEYS,
	runOnboardingTour,
} from "$lib/utils/onboarding.utils.js";
import { parseRematchParams } from "$lib/utils/rematch.utils.js";

const { t } = getTranslate();

const GUEST_ID = "__guest__";

// Wizard step. 1 = Lobby, 2 = Match poster, 3 = Live-match event entry.
// The visible stepper stops at "Anpfiff" — step 3 is a linear follow-up.
let step = $state(1);

let homePlayers = $state([]);
let awayPlayers = $state([]);

let homeTeam = $state("");
let awayTeam = $state("");

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

// Seed wizard state synchronously from the URL *before* loadData
// fires — this way the onboarding effect (gated by `loading`) only
// sees the final `step` value and avoids a brief LOBBY-onboarding
// flash before jumping to LIVE on the rematch path.
$effect(() => {
	const rematch = parseRematchParams(page.url.searchParams);
	if (rematch) {
		homePlayers = rematch.homePlayers;
		awayPlayers = rematch.awayPlayers;
		homeTeam = rematch.homeTeam;
		awayTeam = rematch.awayTeam;
		step = 3;
	}
	loadData();
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

/**
 * Etappe-1 placeholder. The real penalty-shootout flow lands in the
 * next iteration — see roadmap/elfmeterschiessen. This handler keeps
 * the 11m action-row button wired end-to-end so the UX is testable
 * today, and so the prop chain doesn't need to change when the real
 * flow ships.
 *
 * @param {{ scoreHome: number, scoreAway: number, scoreTimeline: object[] }} _payload
 */
function handleStartPenaltyShootout(_payload) {
	if (typeof window !== "undefined") {
		window.alert($t("live_match.penalty_shootout_coming_soon"));
	}
}

function cancel() {
	goto(ROUTES.DASHBOARD);
}

async function saveGame({ scoreHome, scoreAway, scoreTimeline }) {
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
			result_type: "regular",
		});

		const gameId = res.data?.id;
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

/** Index of the active stepper dot. Step 3 still highlights "Anpfiff". */
const visibleStep = $derived(step >= 2 ? 2 : 1);

/**
 * Per-step onboarding tour driven by intro.js. Each wizard step has
 * its own storage flag (lobby / poster / live), so a user who lands
 * directly on the live step via the rematch shortcut still sees the
 * lobby + poster tours the next time they go through the regular
 * flow. The tour helper imports intro.js + its CSS lazily so the
 * bundle stays slim for return visits where nothing fires.
 */
const ONBOARDING_BY_STEP = {
	1: ONBOARDING_KEYS.NEW_GAME_LOBBY,
	2: ONBOARDING_KEYS.NEW_GAME_POSTER,
	3: ONBOARDING_KEYS.NEW_GAME_LIVE,
};
const triggeredTours = new Set();

$effect(() => {
	if (loading) return;
	const key = ONBOARDING_BY_STEP[step];
	if (!key || triggeredTours.has(key) || isOnboardingDone(key)) return;
	triggeredTours.add(key);
	// Two rAFs: the first lets Svelte commit the step swap, the second
	// gives the freshly mounted step's children (e.g. the live pitch's
	// team logos) a tick to layout before intro.js measures anchors.
	requestAnimationFrame(() => {
		requestAnimationFrame(() => {
			runOnboardingTour(key);
		});
	});
});

/**
 * Manually re-trigger the current step's onboarding tour. Useful when
 * someone comes back to the app after a longer break and wants to
 * see the explanation again — the persisted "done" flag would
 * otherwise suppress the auto-trigger. We bypass `isOnboardingDone`
 * by calling `runOnboardingTour` directly, and drop the per-session
 * `triggeredTours` guard so the auto-effect could fire it again if
 * the user navigates back to this step later.
 */
function replayTourForCurrentStep() {
	const key = ONBOARDING_BY_STEP[step];
	if (!key) return;
	triggeredTours.delete(key);
	runOnboardingTour(key);
}
</script>

<svelte:head>
	<title>RasenBürosport - {isRematch ? $t("rematch.title") : $t("new_game.title")}</title>
</svelte:head>

{#if step === 1 || step === 2 || step === 3}
	<div class="screen-banner">
		<!-- Invisible spacer matches the button's width so the centred
		     label is geometrically balanced between the left and right
		     edges. Without it the label would lean right because the
		     button takes up real space on the right but not the left. -->
		<span class="screen-banner-spacer" aria-hidden="true"></span>
		<span class="screen-banner-label">
			{step === 1
				? $t("new_game.banner.step_1")
				: step === 2
					? $t("new_game.banner.step_2")
					: $t("new_game.banner.step_3")}
		</span>
		<button
			type="button"
			class="replay-tour-btn"
			onclick={replayTourForCurrentStep}
			aria-label={$t("new_game.replay_tour")}
			title={$t("new_game.replay_tour")}
		>
			<svg
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				width="14"
				height="14"
				aria-hidden="true"
			>
				<circle cx="12" cy="12" r="10" />
				<path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.7-2.5 2-2.5 4" />
				<line x1="12" y1="17" x2="12" y2="17.01" />
			</svg>
		</button>
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
			onEndMatch={saveGame}
			onStartPenaltyShootout={handleStartPenaltyShootout}
			onBack={goBack}
		/>
	{/if}
</div>

<style>
.screen-banner {
	/* Step label sits dead-centre between the spacer (left) and the
	 * replay button (right), both 28 px wide. Tap-target on the
	 * button is intentionally larger than the 14 px icon for mobile
	 * reachability.
	 *
	 * `padding-top` includes `env(safe-area-inset-top)` because this
	 * page runs in the app layout's "immersive" mode where the
	 * regular Header (which normally owns the iOS status-bar inset)
	 * is hidden. Without this padding the banner slides under the
	 * notch / status bar on iOS PWAs. Negative horizontal margin
	 * keeps the band edge-to-edge against the page padding. */
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 8px;
	padding: calc(env(safe-area-inset-top, 0px) + 8px) 12px 8px;
	background: rgba(226, 75, 74, 0.08);
	border-bottom: 1px solid rgba(226, 75, 74, 0.2);
	margin: 0 -1rem;
}
.screen-banner-spacer {
	width: 28px;
	flex-shrink: 0;
}
.screen-banner-label {
	font-size: 11px;
	color: #9CA3AF;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.1em;
	text-align: center;
	flex: 1;
}
.replay-tour-btn {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 28px;
	height: 28px;
	flex-shrink: 0;
	border: 0;
	background: none;
	color: rgba(255, 255, 255, 0.4);
	cursor: pointer;
	border-radius: 50%;
	transition: color 0.15s, background-color 0.15s;
}
.replay-tour-btn:hover,
.replay-tour-btn:focus-visible {
	color: rgba(255, 255, 255, 0.95);
	background: rgba(255, 255, 255, 0.06);
	outline: none;
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
