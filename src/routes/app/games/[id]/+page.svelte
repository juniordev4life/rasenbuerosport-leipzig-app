<script>
import { getTranslate } from "@tolgee/svelte";
import { goto } from "$app/navigation";
import { page } from "$app/state";
import MatchReport from "$lib/components/games/MatchReport.svelte";
import MatchStatsDisplay from "$lib/components/games/MatchStatsDisplay.svelte";
import MatchStatsUpload from "$lib/components/games/MatchStatsUpload.svelte";
import EloInfoModal from "$lib/components/profile/EloInfoModal.svelte";
import OvrBadge from "$lib/components/ui/OvrBadge.svelte";
import StarRating from "$lib/components/ui/StarRating.svelte";
import TeamLogo from "$lib/components/ui/TeamLogo.svelte";
import { getCountryFlag } from "$lib/constants/teams.constants.js";
import { get, del } from "$lib/services/api.services.js";
import { getTeamByName } from "$lib/services/teams.services.js";
import { user } from "$lib/stores/auth.stores.js";
import { buildRematchUrl } from "$lib/utils/rematch.utils.js";
import { ROUTES } from "$lib/constants/routes.constants.js";

const { t } = getTranslate();

let game = $state(null);
let eloChanges = $state([]);
let loading = $state(true);
let error = $state(false);
let showEloInfo = $state(false);
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

		// Load Elo changes for this game
		try {
			const eloRes = await get(`/v1/games/${gameId}/elo`);
			eloChanges = eloRes.data || [];
		} catch {
			eloChanges = [];
		}
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

/**
 * Gets the Elo change for a specific player in this game
 * @param {string} playerId
 * @returns {{player_id: string, elo_before: number, elo_after: number, elo_change: number}|null}
 */
function getPlayerEloChange(playerId) {
	return eloChanges.find((e) => e.player_id === playerId) || null;
}

const homePlayers = $derived(
	game?.game_players?.filter((p) => p.team === "home") || [],
);
const awayPlayers = $derived(
	game?.game_players?.filter((p) => p.team === "away") || [],
);

const userId = $derived($user?.id);

const userTeam = $derived(
	game?.game_players?.find((p) => p.player_id === userId)?.team || null,
);

const isWin = $derived(
	userTeam === "home"
		? game?.score_home > game?.score_away
		: userTeam === "away"
			? game?.score_away > game?.score_home
			: false,
);
const isDraw = $derived(game?.score_home === game?.score_away);

const resultColor = $derived(
	isDraw
		? "text-warning"
		: isWin
			? "text-success"
			: userTeam
				? "text-error"
				: "text-text-secondary",
);

/** Get the team name used by a side */
function getSideTeamName(players) {
	for (const p of players) {
		if (p.team_name) return p.team_name;
	}
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
const rematchSwapUrl = $derived(
	game
		? buildRematchUrl({
				homePlayers: homePlayerIds,
				awayPlayers: awayPlayerIds,
				homeTeam: homeTeamName || "",
				awayTeam: awayTeamName || "",
				swap: true,
			})
		: "#",
);

/** @type {import('$lib/services/teams.services.js').TeamData|null} */
let homeTeamData = $state(null);
/** @type {import('$lib/services/teams.services.js').TeamData|null} */
let awayTeamData = $state(null);

// Resolve team data asynchronously
$effect(() => {
	if (homeTeamName) {
		getTeamByName(homeTeamName).then((t) => {
			homeTeamData = t || null;
		});
	}
});
$effect(() => {
	if (awayTeamName) {
		getTeamByName(awayTeamName).then((t) => {
			awayTeamData = t || null;
		});
	}
});

const formattedDate = $derived(
	game
		? new Date(game.played_at).toLocaleDateString("de-DE", {
				weekday: "long",
				day: "2-digit",
				month: "long",
				year: "numeric",
			})
		: "",
);

/** Result type suffix (n.V. / n.E.) */
const resultSuffix = $derived(
	game?.result_type === "penalty"
		? $t("game_detail.penalty_short")
		: game?.result_type === "extra_time"
			? $t("game_detail.extra_time_short")
			: "",
);

/** Score timeline data */
const timeline = $derived(game?.score_timeline || []);

/**
 * Build enriched timeline entries with goal side info
 * Reversed so newest goal is at top
 * @returns {object[]}
 */
const timelineEntries = $derived.by(() => {
	if (!timeline.length) return [];
	const entries = timeline.map((entry, i) => {
		const prev = i > 0 ? timeline[i - 1] : { home: 0, away: 0 };
		const isHomeGoal = entry.home > prev.home;
		const periodChanged = i > 0 && timeline[i - 1].period !== entry.period;
		return {
			...entry,
			side: isHomeGoal ? "home" : "away",
			periodChanged,
		};
	});
	return entries.toReversed();
});

/** Lookup scorer profile from game_players by player_id */
function getScorerProfile(playerId) {
	if (!playerId || !game?.game_players) return null;
	const gp = game.game_players.find((p) => p.player_id === playerId);
	return gp?.profiles || null;
}
</script>

<svelte:head>
	<title>RasenBürosport - {$t("game_detail.title")}</title>
</svelte:head>

<div class="flex flex-col gap-4">
	<!-- Back Button -->
	<button
		type="button"
		onclick={() => history.back()}
		class="flex items-center gap-1 text-text-secondary text-sm hover:text-text-primary transition-colors self-start"
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
		<!-- Score Display -->
		<div class="bg-bg-secondary border border-border rounded-xl p-6 text-center">
			<!-- Mode Badge -->
			<span class="bg-accent-red/20 text-accent-red text-xs font-bold px-3 py-1 rounded-full">
				{game.mode}
			</span>

			<!-- Big Score -->
			<div class="flex items-center justify-center gap-6 mt-4">
				<div class="flex flex-col items-center gap-1">
					{#if homeTeamData}
						<TeamLogo logoUrl={homeTeamData.logo_url} teamName={homeTeamData.name} size="lg" />
						<span class="text-sm text-text-secondary">
							{getCountryFlag(homeTeamData.country_code)} {homeTeamData.name}
						</span>
						<div class="flex items-center gap-1">
							<OvrBadge rating={homeTeamData.overall_rating} size="xs" />
							<StarRating rating={homeTeamData.star_rating} size="xs" />
						</div>
					{:else if homeTeamName}
						<span class="text-sm text-text-secondary">{homeTeamName}</span>
					{/if}
					<span class="text-5xl font-bold {resultColor}">{game.score_home}</span>
				</div>

				<span class="text-3xl font-bold text-text-secondary">:</span>

				<div class="flex flex-col items-center gap-1">
					{#if awayTeamData}
						<TeamLogo logoUrl={awayTeamData.logo_url} teamName={awayTeamData.name} size="lg" />
						<span class="text-sm text-text-secondary">
							{getCountryFlag(awayTeamData.country_code)} {awayTeamData.name}
						</span>
						<div class="flex items-center gap-1">
							<OvrBadge rating={awayTeamData.overall_rating} size="xs" />
							<StarRating rating={awayTeamData.star_rating} size="xs" />
						</div>
					{:else if awayTeamName}
						<span class="text-sm text-text-secondary">{awayTeamName}</span>
					{/if}
					<span class="text-5xl font-bold {resultColor}">{game.score_away}</span>
				</div>
			</div>

			{#if resultSuffix}
				<p class="text-sm font-medium text-accent-red mt-2">{resultSuffix}</p>
			{/if}

			<!-- Date -->
			<p class="text-xs text-text-secondary mt-4">{formattedDate}</p>
		</div>

		<!-- Rematch Actions -->
		<div class="flex gap-2">
			<a
				href={rematchUrl}
				class="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-accent-red text-white font-semibold text-sm hover:bg-accent-red/90 active:scale-[0.98] transition-all"
			>
				<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
				</svg>
				{$t("rematch.button")}
			</a>
			<a
				href={rematchSwapUrl}
				class="flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-bg-secondary border border-border text-text-primary text-sm hover:bg-bg-input active:scale-[0.98] transition-all"
				aria-label={$t("rematch.swap_button")}
				title={$t("rematch.swap_button")}
			>
				<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
				</svg>
			</a>
		</div>

		<!-- Admin: Delete Game -->
		{#if isAdmin}
			<button
				type="button"
				onclick={() => (showDeleteConfirm = true)}
				class="flex items-center justify-center gap-2 py-2 px-4 rounded-lg border border-error/30 text-error text-sm hover:bg-error/10 active:scale-[0.98] transition-all"
			>
				<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
				</svg>
				{$t("game_detail.delete")}
			</button>
		{/if}

		<!-- Score Timeline (vertical, bottom to top) -->
		{#if timelineEntries.length > 0}
			<div class="bg-bg-secondary border border-border rounded-lg p-4">
				<h3 class="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3">
					{$t("game_detail.timeline_title")}
				</h3>
				<div class="relative flex flex-col items-center">
					<!-- Center line -->
					<div class="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px bg-border"></div>

					{#each timelineEntries as entry, i (i)}
						<!-- Period divider -->
						{#if entry.periodChanged}
							<div class="relative z-10 flex items-center justify-center w-full my-1">
								<span class="bg-bg-secondary px-2 text-[10px] font-bold text-text-secondary uppercase">
									{entry.period === "penalty"
										? $t("game_detail.penalty_short")
										: $t("game_detail.extra_time_short")}
								</span>
							</div>
						{/if}

						<!-- Goal row -->
						{@const scorer = getScorerProfile(entry.scored_by)}
						<div class="relative z-10 flex items-center w-full py-1.5">
							<!-- Home side (left) -->
							<div class="flex-1 flex items-center justify-end gap-2 pr-4">
								{#if entry.side === "home"}
									{#if scorer}
										<span class="text-[10px] text-text-secondary">{scorer.username}</span>
										{#if scorer.avatar_url}
											<img src={scorer.avatar_url} alt={scorer.username} class="w-4 h-4 rounded-full object-cover" />
										{/if}
									{/if}
									{#if entry.period === "penalty"}
										<span class="text-xs" title="Elfmeter">🥅</span>
									{/if}
									<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-accent-red/20 text-accent-red">
										{entry.home}:{entry.away}
									</span>
								{/if}
							</div>

							<!-- Center dot -->
							<div class="w-2.5 h-2.5 rounded-full shrink-0 {entry.side === 'home'
								? 'bg-accent-red'
								: 'bg-blue-500'}"></div>

							<!-- Away side (right) -->
							<div class="flex-1 flex items-center justify-start gap-2 pl-4">
								{#if entry.side === "away"}
									<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-500">
										{entry.home}:{entry.away}
									</span>
									{#if entry.period === "penalty"}
										<span class="text-xs" title="Elfmeter">🥅</span>
									{/if}
									{#if scorer}
										{#if scorer.avatar_url}
											<img src={scorer.avatar_url} alt={scorer.username} class="w-4 h-4 rounded-full object-cover" />
										{/if}
										<span class="text-[10px] text-text-secondary">{scorer.username}</span>
									{/if}
								{/if}
							</div>
						</div>
					{/each}

					<!-- Kickoff dot at bottom -->
					<div class="relative z-10 flex items-center justify-center w-full pt-1.5">
						<div class="w-2 h-2 rounded-full bg-text-secondary/40"></div>
					</div>
				</div>
			</div>
		{/if}

		<!-- Teams -->
		<div class="grid grid-cols-2 gap-3">
			<!-- Home Team -->
			<div class="bg-bg-secondary border border-border rounded-lg p-4">
				<h3 class="text-xs font-bold text-accent-red text-center uppercase tracking-wider mb-3">
					{$t("game_detail.home_team")}
				</h3>
				<div class="flex flex-col gap-3">
					{#each homePlayers as player (player.player_id)}
						{@const elo = getPlayerEloChange(player.player_id)}
						<div class="flex items-center gap-2">
							{#if player.profiles?.avatar_url}
								<img
									src={player.profiles.avatar_url}
									alt={player.profiles?.username}
									class="w-8 h-8 rounded-full object-cover ring-1 ring-accent-red"
								/>
							{:else}
								<div class="w-8 h-8 rounded-full bg-accent-red/20 ring-1 ring-accent-red flex items-center justify-center text-xs font-bold text-text-primary">
									{(player.profiles?.username || "?").charAt(0).toUpperCase()}
								</div>
							{/if}
							<span class="text-sm text-text-primary font-medium truncate">
								{player.profiles?.username || "?"}
							</span>
							{#if elo}
								<span class="text-[10px] font-medium ml-auto {elo.elo_change >= 0 ? 'text-success' : 'text-error'}">
									{elo.elo_change >= 0 ? "+" : ""}{elo.elo_change}
								</span>
							{/if}
						</div>
					{/each}
				</div>
			</div>

			<!-- Away Team -->
			<div class="bg-bg-secondary border border-border rounded-lg p-4">
				<h3 class="text-xs font-bold text-blue-500 text-center uppercase tracking-wider mb-3">
					{$t("game_detail.away_team")}
				</h3>
				<div class="flex flex-col gap-3">
					{#each awayPlayers as player (player.player_id)}
						{@const elo = getPlayerEloChange(player.player_id)}
						<div class="flex items-center gap-2">
							{#if player.profiles?.avatar_url}
								<img
									src={player.profiles.avatar_url}
									alt={player.profiles?.username}
									class="w-8 h-8 rounded-full object-cover ring-1 ring-blue-500"
								/>
							{:else}
								<div class="w-8 h-8 rounded-full bg-blue-500/20 ring-1 ring-blue-500 flex items-center justify-center text-xs font-bold text-text-primary">
									{(player.profiles?.username || "?").charAt(0).toUpperCase()}
								</div>
							{/if}
							<span class="text-sm text-text-primary font-medium truncate">
								{player.profiles?.username || "?"}
							</span>
							{#if elo}
								<span class="text-[10px] font-medium ml-auto {elo.elo_change >= 0 ? 'text-success' : 'text-error'}">
									{elo.elo_change >= 0 ? "+" : ""}{elo.elo_change}
								</span>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		</div>

		<!-- Elo Changes -->
		{#if eloChanges.length > 0}
			<div class="bg-bg-secondary border border-border rounded-lg p-4">
				<div class="flex items-center justify-between mb-3">
					<h3 class="text-xs font-bold text-text-secondary uppercase tracking-wider">
						{$t("elo.game_changes_title")}
					</h3>
					<button
						type="button"
						onclick={() => (showEloInfo = true)}
						class="text-text-secondary hover:text-text-primary transition-colors"
						aria-label={$t("elo.info_title")}
					>
						<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
					</button>
				</div>
				<div class="flex flex-col gap-2">
					{#each eloChanges as elo (elo.player_id)}
						{@const player = game.game_players.find((p) => p.player_id === elo.player_id)}
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-2">
								{#if player?.profiles?.avatar_url}
									<img src={player.profiles.avatar_url} alt={player.profiles.username} class="w-5 h-5 rounded-full object-cover" />
								{:else}
									<div class="w-5 h-5 rounded-full bg-bg-input flex items-center justify-center text-[9px] font-bold text-text-secondary">
										{(player?.profiles?.username || "?").charAt(0).toUpperCase()}
									</div>
								{/if}
								<span class="text-xs text-text-primary">{player?.profiles?.username || "?"}</span>
							</div>
							<div class="flex items-center gap-2">
								<span class="text-[10px] text-text-secondary">{elo.elo_before}</span>
								<span class="text-xs text-text-secondary">→</span>
								<span class="text-xs font-bold text-text-primary">{elo.elo_after}</span>
								<span class="text-xs font-medium {elo.elo_change >= 0 ? 'text-success' : 'text-error'}">
									({elo.elo_change >= 0 ? "+" : ""}{elo.elo_change})
								</span>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Match Stats (from FC26 screenshots) -->
		{#if game.match_stats}
			<MatchStatsDisplay matchStats={game.match_stats} />
		{/if}

		<!-- Upload Slots (show remaining upload options) -->
		{@const hasOverview = !!game.stats_image_url}
		{@const hasPasses = !!game.passes_image_url}
		{@const hasDefense = !!game.defense_image_url}
		{@const allUploaded = hasOverview && hasPasses && hasDefense}

		<!-- AI Match Report (only when all three screenshots are uploaded) -->
		{#if allUploaded}
			<MatchReport
				{gameId}
				existingReport={game.match_report}
				onReportGenerated={(report) => { game = { ...game, match_report: report }; }}
			/>
		{/if}

		{#if !hasOverview || !hasPasses || !hasDefense}
			<div class="flex flex-col gap-3">
				{#if !hasOverview}
					<MatchStatsUpload
						{gameId}
						type="overview"
						label="match_stats.upload_overview_title"
						hint="match_stats.upload_overview_hint"
						onStatsExtracted={() => loadGame()}
					/>
				{:else}
					<div class="bg-bg-secondary border border-success/30 rounded-lg p-3 flex items-center gap-2">
						<span class="text-success text-lg">✓</span>
						<span class="text-xs text-text-secondary">{$t("match_stats.upload_overview_title")}</span>
						<span class="text-xs text-success ml-auto">{$t("match_stats.uploaded")}</span>
					</div>
				{/if}

				{#if !hasPasses}
					<MatchStatsUpload
						{gameId}
						type="passes"
						label="match_stats.upload_passes_title"
						hint="match_stats.upload_passes_hint"
						onStatsExtracted={() => loadGame()}
					/>
				{:else}
					<div class="bg-bg-secondary border border-success/30 rounded-lg p-3 flex items-center gap-2">
						<span class="text-success text-lg">✓</span>
						<span class="text-xs text-text-secondary">{$t("match_stats.upload_passes_title")}</span>
						<span class="text-xs text-success ml-auto">{$t("match_stats.uploaded")}</span>
					</div>
				{/if}

				{#if !hasDefense}
					<MatchStatsUpload
						{gameId}
						type="defense"
						label="match_stats.upload_defense_title"
						hint="match_stats.upload_defense_hint"
						onStatsExtracted={() => loadGame()}
					/>
				{:else}
					<div class="bg-bg-secondary border border-success/30 rounded-lg p-3 flex items-center gap-2">
						<span class="text-success text-lg">✓</span>
						<span class="text-xs text-text-secondary">{$t("match_stats.upload_defense_title")}</span>
						<span class="text-xs text-success ml-auto">{$t("match_stats.uploaded")}</span>
					</div>
				{/if}
			</div>
		{/if}
	{/if}
</div>

{#if showEloInfo}
	<EloInfoModal onClose={() => (showEloInfo = false)} />
{/if}

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
