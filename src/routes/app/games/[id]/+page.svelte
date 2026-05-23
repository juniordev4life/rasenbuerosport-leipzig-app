<script>
import { getTranslate } from "@tolgee/svelte";
import { goto } from "$app/navigation";
import { page } from "$app/state";
import MatchDetailStatsNew from "$lib/components/games/MatchDetailStatsNew.svelte";
import MatchHeroNew from "$lib/components/games/MatchHeroNew.svelte";
import MatchKeyStatsNew from "$lib/components/games/MatchKeyStatsNew.svelte";
import MatchLineupsNew from "$lib/components/games/MatchLineupsNew.svelte";
import MatchPassCharacterCard from "$lib/components/games/MatchPassCharacterCard.svelte";
import MatchReporterAwaitingCard from "$lib/components/games/MatchReporterAwaitingCard.svelte";
import MatchReporterCardNew from "$lib/components/games/MatchReporterCardNew.svelte";
import MatchTeaserPlaceholder from "$lib/components/games/MatchTeaserPlaceholder.svelte";
import MatchTimelineNew from "$lib/components/games/MatchTimelineNew.svelte";
import { ROUTES } from "$lib/constants/routes.constants.js";
import { del, get } from "$lib/services/api.services.js";
import { getTeamByName } from "$lib/services/teams.services.js";
import { user } from "$lib/stores/auth.stores.js";
import { buildRematchUrl } from "$lib/utils/rematch.utils.js";

const { t } = getTranslate();

let game = $state(null);
let loading = $state(true);
let error = $state(false);
let showDeleteConfirm = $state(false);
let deleting = $state(false);

const gameId = $derived(page.params.id);
const isAdmin = $derived($user?.role === "admin");

$effect(() => {
	if (gameId) loadGame();
});

async function loadGame() {
	try {
		const res = await get(`/v1/games/${gameId}`);
		game = res.data;
	} catch (err) {
		console.error("Failed to load game:", err);
		error = true;
	} finally {
		loading = false;
	}
}

async function handleDeleteGame() {
	deleting = true;
	try {
		await del(`/v1/games/${gameId}`);
		goto(ROUTES.GAMES);
	} catch (err) {
		console.error("Failed to delete game:", err);
		deleting = false;
		showDeleteConfirm = false;
	}
}

const homePlayers = $derived(
	game?.game_players?.filter((p) => p.team === "home") || [],
);
const awayPlayers = $derived(
	game?.game_players?.filter((p) => p.team === "away") || [],
);

function getSideTeamName(players) {
	for (const p of players) if (p.team_name) return p.team_name;
	return null;
}

const homeTeamName = $derived(getSideTeamName(homePlayers));
const awayTeamName = $derived(getSideTeamName(awayPlayers));

const homePlayerIds = $derived(homePlayers.map((p) => p.player_id));
const awayPlayerIds = $derived(awayPlayers.map((p) => p.player_id));

const rematchUrl = $derived(
	game
		? buildRematchUrl({
				homePlayers: homePlayerIds,
				awayPlayers: awayPlayerIds,
				homeTeam: homeTeamName || "",
				awayTeam: awayTeamName || "",
			})
		: "#",
);

/** @type {import('$lib/services/teams.services.js').TeamData|null} */
let homeTeamData = $state(null);
/** @type {import('$lib/services/teams.services.js').TeamData|null} */
let awayTeamData = $state(null);

$effect(() => {
	if (homeTeamName) {
		getTeamByName(homeTeamName).then((td) => {
			homeTeamData = td || null;
		});
	}
});
$effect(() => {
	if (awayTeamName) {
		getTeamByName(awayTeamName).then((td) => {
			awayTeamData = td || null;
		});
	}
});

const resultSuffix = $derived(
	game?.result_type === "penalty"
		? $t("game_detail.penalty_short")
		: game?.result_type === "extra_time"
			? $t("game_detail.extra_time_short")
			: "",
);

/** Lookup profile for any player in the game by player_id. */
function getProfile(playerId) {
	if (!playerId || !game?.game_players) return null;
	const gp = game.game_players.find((p) => p.player_id === playerId);
	return gp?.profiles || null;
}

const hasOverview = $derived(!!game?.stats_image_url);
const hasPasses = $derived(!!game?.passes_image_url);
const hasDefense = $derived(!!game?.defense_image_url);
const allUploaded = $derived(hasOverview && hasPasses && hasDefense);
</script>

<svelte:head>
	<title>RasenBürosport - {$t("game_detail.title")}</title>
</svelte:head>

<div class="flex flex-col gap-3 max-w-5xl mx-auto px-1 pt-0 pb-8">
	<button
		type="button"
		onclick={() => history.back()}
		class="flex items-center gap-1 text-text-secondary text-sm hover:text-text-primary transition-colors self-start mb-1"
	>
		<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
			<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
		</svg>
		{$t("common.back")}
	</button>

	{#if loading}
		<div class="flex justify-center py-8">
			<div class="animate-spin h-8 w-8 border-2 border-accent-red border-t-transparent rounded-full"></div>
		</div>
	{:else if error || !game}
		<div class="text-center py-8">
			<p class="text-text-secondary">{$t("game_detail.not_found")}</p>
		</div>
	{:else}
		<MatchHeroNew
			{game}
			homeTeam={homeTeamData}
			awayTeam={awayTeamData}
			{homeTeamName}
			{awayTeamName}
			{homePlayers}
			{awayPlayers}
			currentUserId={$user?.uid ?? null}
			{resultSuffix}
			{rematchUrl}
		/>

		{#if allUploaded}
			<MatchReporterCardNew
				{gameId}
				existingReport={game.match_report}
				existingAudioUrl={game.match_report_audio_url}
				existingReporterId={game.reporter_id}
				onReportGenerated={(report) => { game = { ...game, match_report: report, match_report_audio_url: null }; }}
				onAudioGenerated={(url) => { game = { ...game, match_report_audio_url: url }; }}
				onReporterAssigned={(rid) => { game = { ...game, reporter_id: rid }; }}
			/>

			<MatchTimelineNew
				timeline={game.score_timeline || []}
				gamePlayers={game.game_players ?? []}
				currentUserId={$user?.uid ?? null}
			/>

			<MatchLineupsNew
				{game}
				{homePlayers}
				{awayPlayers}
				{homeTeamName}
				{awayTeamName}
				currentUserId={$user?.uid ?? null}
			/>

			{#if game.match_stats}
				<MatchKeyStatsNew matchStats={game.match_stats} />
			{/if}

			<MatchPassCharacterCard
				homePassNetwork={game.home_pass_network}
				awayPassNetwork={game.away_pass_network}
				{homeTeamName}
				{awayTeamName}
			/>

			{#if game.match_stats}
				<MatchDetailStatsNew
					matchStats={game.match_stats}
					homeTeamLabel={homeTeamName}
					awayTeamLabel={awayTeamName}
				/>
			{/if}
		{:else}
			<MatchReporterAwaitingCard
				{gameId}
				{hasOverview}
				{hasPasses}
				{hasDefense}
				onStatsExtracted={() => loadGame()}
				onAllUploaded={() => loadGame()}
			/>

			<MatchTeaserPlaceholder label={$t("awaiting_report.teaser_timeline")} />
			<MatchTeaserPlaceholder label={$t("awaiting_report.teaser_lineups")} />
			<MatchTeaserPlaceholder label={$t("awaiting_report.teaser_stats")} />
		{/if}

		{#if isAdmin}
			<div class="mt-2 rounded-xl border border-accent-red/30 px-4 sm:px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 justify-between">
				<div class="leading-tight">
					<div class="text-[10px] tracking-[0.08em] uppercase text-text-muted mb-1 font-semibold">
						{$t("game_detail.section.danger_zone")}
					</div>
					<div class="text-sm text-text-secondary">
						{$t("game_detail.danger_zone.description")}
					</div>
				</div>
				<button
					type="button"
					onclick={() => (showDeleteConfirm = true)}
					class="shrink-0 px-4 py-2.5 rounded-lg border border-accent-red/40 text-accent-red text-sm font-medium hover:bg-accent-red/10 transition-colors"
				>
					{$t("game_detail.delete")}
				</button>
			</div>
		{/if}
	{/if}
</div>

{#if showDeleteConfirm}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
		onclick={() => (showDeleteConfirm = false)}
	>
		<div
			class="bg-bg-secondary border border-border rounded-xl p-6 w-full max-w-sm"
			onclick={(e) => e.stopPropagation()}
		>
			<h3 class="text-lg font-bold text-text-primary mb-2">
				{$t("game_detail.delete_confirm_title")}
			</h3>
			<p class="text-sm text-text-secondary mb-6">
				{$t("game_detail.delete_confirm_message")}
			</p>
			<div class="flex gap-3">
				<button
					type="button"
					onclick={() => (showDeleteConfirm = false)}
					class="flex-1 py-2 px-4 rounded-lg bg-bg-input border border-border text-text-primary text-sm font-medium hover:bg-bg-secondary transition-colors"
				>
					{$t("game_detail.delete_cancel")}
				</button>
				<button
					type="button"
					onclick={handleDeleteGame}
					disabled={deleting}
					class="flex-1 py-2 px-4 rounded-lg bg-error text-white text-sm font-medium hover:bg-error/90 disabled:opacity-50 transition-colors"
				>
					{deleting ? $t("common.loading") : $t("game_detail.delete_confirm")}
				</button>
			</div>
		</div>
	</div>
{/if}
