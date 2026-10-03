<script>
import { getTranslate } from "@tolgee/svelte";
import { goto } from "$app/navigation";
import { page } from "$app/state";
import MatchDetailStatsNew from "$lib/components/games/MatchDetailStatsNew.svelte";
import MatchHeroNew from "$lib/components/games/MatchHeroNew.svelte";
import MatchHighlightReel from "$lib/components/games/MatchHighlightReel.svelte";
import MatchKeyStatsNew from "$lib/components/games/MatchKeyStatsNew.svelte";
import MatchLineupsNew from "$lib/components/games/MatchLineupsNew.svelte";
import MatchPassCharacterCard from "$lib/components/games/MatchPassCharacterCard.svelte";
import MatchReporterAwaitingCard from "$lib/components/games/MatchReporterAwaitingCard.svelte";
import MatchReporterCardNew from "$lib/components/games/MatchReporterCardNew.svelte";
import MatchTeaserPlaceholder from "$lib/components/games/MatchTeaserPlaceholder.svelte";
import MatchTimelineNew from "$lib/components/games/MatchTimelineNew.svelte";
import MicIcon from "$lib/components/icons/MicIcon.svelte";
import ShieldIcon from "$lib/components/icons/ShieldIcon.svelte";
import PenaltyShootoutSummary from "$lib/components/penaltyShootout/PenaltyShootoutSummary.svelte";
import Button from "$lib/components/ui/Button.svelte";
import Section from "$lib/components/ui/Section.svelte";
import Sheet from "$lib/components/ui/Sheet.svelte";
import { ROUTES } from "$lib/constants/routes.constants.js";
import { del, get } from "$lib/services/api.services.js";
import { getTeamByName } from "$lib/services/teams.services.js";
import { user } from "$lib/stores/auth.stores.js";
import { hasHighlight } from "$lib/utils/highlights.utils.js";
import { isReportBlocked } from "$lib/utils/matchReport.utils.js";
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

// While the office pipeline works, poll the game so updates appear live:
// "processing" -> highlight reel, `pending` -> the zero-tracking result
// (score + timeline backfilled from the recording).
$effect(() => {
	if (game?.video_status !== "processing" && !game?.pending) return;
	const id = setInterval(loadGame, 8000);
	return () => clearInterval(id);
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

// game_players.team_name first; the game-row name is the fallback for sides
// without players (CPU opponents) — set by the app at creation time.
const homeTeamName = $derived(
	getSideTeamName(homePlayers) || game?.home_team_name || null,
);
const awayTeamName = $derived(
	getSideTeamName(awayPlayers) || game?.away_team_name || null,
);

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

const resultSuffix = $derived.by(() => {
	// When the match ended on penalties we render the actual shootout
	// score ("i.E. 5:6") in the hero — printing "n.E." on top of that
	// is redundant, so the suffix is suppressed for shootouts.
	if (game?.penalty_shootout) return "";
	if (game?.result_type === "penalty") return $t("game_detail.penalty_short");
	if (game?.result_type === "extra_time")
		return $t("game_detail.extra_time_short");
	return "";
});

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

// Recorded games get their stats from the capture pipeline automatically, so
// the photo upload is hidden behind a collapsed fallback (used only if a
// recording fails). Purely manual games (no recording) still show the upload
// directly — there is nothing auto-analyzing them.
const isAutoAnalyzed = $derived(
	Boolean(game?.recording_id) ||
		game?.pending ||
		game?.video_status === "processing",
);

// A ready reel pulls the key stats up next to it (right below it on
// phones). Shared predicate with the dashboard tile.
const hasHighlightGame = $derived(hasHighlight(game));

// Key stats show beside a ready reel, otherwise once all stats are in.
const showKeyStats = $derived(
	Boolean(game?.match_stats) && (hasHighlightGame || allUploaded),
);

const userId = $derived($user?.uid ?? null);

// The reporter narrates the finished match, so the text must wait for the
// real result: never while the game is pending, and for recorded games not
// until the analysis pipeline has finished (the API generates it once
// video_status flips to ready/failed). Until then the score is 0:0 with an
// empty timeline — generating would persist a wrong report. The wait for the
// pipeline is time-bounded (see isReportBlocked): a capture that died before
// reporting any status left this blocked forever, showing a spinner that
// never resolved.
const reportBlocked = $derived(isReportBlocked(game));
</script>

<svelte:head>
	<title>RasenBürosport - {$t("game_detail.title")}</title>
</svelte:head>

{#snippet notice(titleKey, hintKey, className = "")}
	<div class="card notice {className}" role="status">
		<span class="spinner spinner-sm" aria-hidden="true"></span>
		<div>
			<p class="notice-title">{$t(titleKey)}</p>
			<p>{$t(hintKey)}</p>
		</div>
	</div>
{/snippet}

{#snippet reporterCard()}
	<MatchReporterCardNew
		{gameId}
		existingReport={game.match_report}
		existingAudioUrl={game.match_report_audio_url}
		existingReporterId={game.reporter_id}
		onReportGenerated={(report) => { game = { ...game, match_report: report, match_report_audio_url: null }; }}
		onAudioGenerated={(url) => { game = { ...game, match_report_audio_url: url }; }}
		onReporterAssigned={(rid) => { game = { ...game, reporter_id: rid }; }}
	/>
{/snippet}

{#snippet awaitingCard()}
	<MatchReporterAwaitingCard
		{gameId}
		{hasOverview}
		{hasPasses}
		{hasDefense}
		onStatsExtracted={() => loadGame()}
		onAllUploaded={() => loadGame()}
	/>
{/snippet}

{#if loading}
	<div class="state">
		<span class="spinner" role="status" aria-label={$t("common.loading")}></span>
	</div>
{:else if error || !game}
	<p class="card notice">{$t("game_detail.not_found")}</p>
{:else}
	<!-- Phones: one column; the two wrappers dissolve (display: contents)
	     and `order` keeps the reading order. Desktop: main column (match,
	     report, timeline, lineups) and a side column (highlights, stats). -->
	<div class="detail">
		<div class="col">
			<MatchHeroNew
				class="o-hero"
				{game}
				homeTeam={homeTeamData}
				awayTeam={awayTeamData}
				{homeTeamName}
				{awayTeamName}
				{homePlayers}
				{awayPlayers}
				currentUserId={userId}
				{resultSuffix}
				{rematchUrl}
			/>

			{#if game.penalty_shootout}
				<PenaltyShootoutSummary
					class="o-penalty"
					penaltyShootout={game.penalty_shootout}
					gamePlayers={game.game_players ?? []}
					{homeTeamName}
					{awayTeamName}
				/>
			{/if}

			{#if game.pending}
				{@render notice("game_detail.pending.title", "game_detail.pending.hint", "o-pending")}
			{/if}

			<Section title={$t("game_detail.section.report")} class="o-report">
				{#snippet icon()}<MicIcon size={22} strokeWidth={2} />{/snippet}
				{#if allUploaded}
					{#if !game.match_report && reportBlocked}
						<!-- Recorded game still analyzing: result/stats are not final yet,
						     so the reporter text must NOT be generated (it would narrate a
						     0:0 with an empty timeline). The API generates it once the
						     pipeline finishes (video_status ready/failed); until then show
						     a preparing notice — same cue as the other analysis placeholders. -->
						{@render notice("game_detail.report_preparing.title", "game_detail.report_preparing.hint")}
					{:else}
						{@render reporterCard()}
					{/if}
				{:else if isAutoAnalyzed}
					<!-- Recorded game whose stats never arrived. While the pipeline is
					     genuinely still running, the preparing notice is right. Once it
					     reached a terminal status the stats will NEVER arrive — a failed
					     capture has no post-match screens to read — so claiming
					     "preparing" would be a spinner that spins forever. Show the
					     report instead: the API generates it on that final status, and it
					     narrates the tapped timeline, which does not need stats images.
					     The collapsed fallback below stays for adding stats by hand. -->
					{#if reportBlocked}
						{@render notice("game_detail.report_preparing.title", "game_detail.report_preparing.hint")}
					{:else}
						{@render reporterCard()}
					{/if}

					<details class="manual">
						<summary class="btn btn-secondary btn-sm manual-toggle">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" aria-hidden="true">
								<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
								<polyline points="17 8 12 3 7 8" />
								<line x1="12" x2="12" y1="3" y2="15" />
							</svg>
							{$t("game_detail.report_preparing.manual_toggle")}
							<svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14" aria-hidden="true">
								<polyline points="6 9 12 15 18 9" />
							</svg>
						</summary>
						<div class="manual-body">
							{@render awaitingCard()}
						</div>
					</details>
				{:else}
					{@render awaitingCard()}
				{/if}
			</Section>

			<!-- Timeline and lineups come from the game row itself (tapped
			     score_timeline, game_players) — they never needed the stats
			     screenshots. Gating them behind those hid real match data, and
			     permanently so for a game whose capture failed: no screens to
			     read means the gate never opens. Rendered in every branch. -->
			<MatchTimelineNew
				class="o-timeline"
				timeline={game.score_timeline || []}
				gamePlayers={game.game_players ?? []}
				currentUserId={userId}
			/>

			<MatchLineupsNew
				class="o-lineups"
				{game}
				{homePlayers}
				{awayPlayers}
				{homeTeamName}
				{awayTeamName}
				currentUserId={userId}
			/>

			{#if isAdmin}
				<Section title={$t("game_detail.section.danger_zone")} class="o-admin">
					{#snippet icon()}<ShieldIcon size={22} strokeWidth={2} />{/snippet}
					<div class="card danger">
						<p class="danger-text">{$t("game_detail.danger_zone.description")}</p>
						<button
							type="button"
							onclick={() => (showDeleteConfirm = true)}
							class="btn btn-sm danger-btn"
						>
							{$t("game_detail.delete")}
						</button>
					</div>
				</Section>
			{/if}
		</div>

		<div class="col">
			<MatchHighlightReel
				class="o-reel"
				videoStatus={game.video_status}
				highlightUrl={game.highlight_url}
			/>

			{#if showKeyStats}
				<MatchKeyStatsNew
					class={hasHighlightGame ? "o-kpis-top" : "o-kpis"}
					matchStats={game.match_stats}
				/>
			{/if}

			{#if allUploaded}
				<MatchPassCharacterCard
					class="o-pass"
					homePassNetwork={game.home_pass_network}
					awayPassNetwork={game.away_pass_network}
					{homeTeamName}
					{awayTeamName}
				/>

				{#if game.match_stats}
					<MatchDetailStatsNew
						class="o-detail"
						matchStats={game.match_stats}
						homeTeamLabel={homeTeamName}
						awayTeamLabel={awayTeamName}
					/>
				{/if}
			{:else}
				<MatchTeaserPlaceholder
					class="o-teaser"
					label={$t("awaiting_report.teaser_stats")}
				/>
			{/if}
		</div>
	</div>
{/if}

{#if showDeleteConfirm}
	<Sheet
		title={$t("game_detail.delete_confirm_title")}
		onClose={() => (showDeleteConfirm = false)}
		size="sm"
	>
		<p class="confirm-text">{$t("game_detail.delete_confirm_message")}</p>
		<div class="confirm-actions">
			<Button loading={deleting} onclick={handleDeleteGame}>
				{deleting ? $t("common.loading") : $t("game_detail.delete_confirm")}
			</Button>
			<Button variant="secondary" onclick={() => (showDeleteConfirm = false)}>
				{$t("game_detail.delete_cancel")}
			</Button>
		</div>
	</Sheet>
{/if}

<style>
.state {
	display: flex;
	justify-content: center;
	padding: 48px 0;
}

/* ── Layout ────────────────────────────────────────────────────────── */
.detail {
	display: flex;
	flex-direction: column;
	gap: var(--stack-gap);
	padding-bottom: 8px;
}

.col {
	display: contents;
}

/* Phone reading order (the columns are dissolved); on desktop the same
 * values keep each column in DOM order. */
.detail :global(.o-hero) {
	order: 1;
}
.detail :global(.o-penalty) {
	order: 2;
}
.detail :global(.o-pending) {
	order: 3;
}
.detail :global(.o-reel) {
	order: 4;
}
.detail :global(.o-kpis-top) {
	order: 5;
}
.detail :global(.o-report) {
	order: 6;
}
.detail :global(.o-timeline) {
	order: 7;
}
.detail :global(.o-lineups) {
	order: 8;
}
.detail :global(.o-kpis) {
	order: 9;
}
.detail :global(.o-pass) {
	order: 10;
}
.detail :global(.o-detail) {
	order: 11;
}
.detail :global(.o-teaser) {
	order: 12;
}
.detail :global(.o-admin) {
	order: 13;
}

@media (min-width: 1024px) {
	.detail {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(300px, 34%);
		align-items: start;
		gap: 24px;
		padding-bottom: 32px;
	}

	.col {
		display: flex;
		flex-direction: column;
		gap: var(--stack-gap);
		min-width: 0;
	}
}

@media (min-width: 1280px) {
	.detail {
		gap: 32px;
	}
}

/* ── Manual stats upload (recorded games) ──────────────────────────── */
.manual-toggle {
	list-style: none;
	user-select: none;
}

.manual-toggle::-webkit-details-marker {
	display: none;
}

.chevron {
	transition: transform 150ms;
}

.manual[open] .chevron {
	transform: rotate(180deg);
}

.manual-body {
	margin-top: 12px;
}

/* B's white pill would vanish on the white section card. */
:global([data-variant="b"]) .manual-toggle {
	background: var(--color-sunken);
	box-shadow: none;
}

:global([data-variant="b"]) .manual-toggle:hover {
	background: var(--color-line);
}

/* ── Admin danger zone ─────────────────────────────────────────────── */
.danger {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 12px;
	padding: 16px;
}

.danger-text {
	margin: 0;
	color: var(--color-muted);
	font-size: 14px;
	line-height: 1.45;
}

.danger-btn {
	background: transparent;
	color: var(--color-loss);
	box-shadow: inset 0 0 0 1px var(--color-loss);
}

.danger-btn:hover {
	background: var(--color-loss-soft);
}

@media (min-width: 640px) {
	.danger {
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
	}

	.danger-btn {
		flex-shrink: 0;
	}
}

/* ── Delete confirmation ───────────────────────────────────────────── */
.confirm-text {
	margin: 0 0 20px;
	color: var(--color-muted);
	font-size: 15px;
	line-height: 1.5;
}

.confirm-actions {
	display: flex;
	flex-direction: column;
	gap: 10px;
}
</style>
