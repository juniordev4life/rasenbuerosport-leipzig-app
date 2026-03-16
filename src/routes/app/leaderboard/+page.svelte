<script>
import { getTranslate } from "@tolgee/svelte";
import DuoDetailModal from "$lib/components/leaderboard/DuoDetailModal.svelte";
import H2HModal from "$lib/components/leaderboard/H2HModal.svelte";
import SeasonSelector from "$lib/components/season/SeasonSelector.svelte";
import { ROUTES } from "$lib/constants/routes.constants.js";
import { get } from "$lib/services/api.services.js";
import { user } from "$lib/stores/auth.stores.js";
import { selectedSeason } from "$lib/stores/season.stores.js";

const { t } = getTranslate();

let players = $state([]);
let duos = $state([]);
let loading = $state(true);
let selectedPlayerId = $state(null);
let selectedDuo = $state(null);
let viewMode = $state("total");
let selectedMode = $state("all");

const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;
const MIN_GAMES_PPG = 3;

const isDuosMode = $derived(selectedMode === "duos");

$effect(() => {
	const season = $selectedSeason;
	const mode = selectedMode;
	let aborted = false;

	if (mode === "duos") {
		loadDuoLeaderboard(season).catch(() => {});
	} else {
		loadLeaderboard(season, mode).catch(() => {});
	}

	return () => {
		aborted = true;
	};

	async function loadLeaderboard(s, m) {
		loading = true;
		try {
			let url = "/v1/leaderboard?limit=50";
			if (s !== "all") url += `&season=${s}`;
			if (m !== "all") url += `&mode=${m}`;
			const res = await get(url);
			if (aborted) return;
			players = res.data || [];
		} catch (err) {
			if (aborted) return;
			console.error("Failed to load leaderboard:", err);
		} finally {
			if (!aborted) loading = false;
		}
	}

	async function loadDuoLeaderboard(s) {
		loading = true;
		try {
			let url = "/v1/duos?limit=50";
			if (s !== "all") url += `&season=${s}`;
			const res = await get(url);
			if (aborted) return;
			duos = res.data || [];
		} catch (err) {
			if (aborted) return;
			console.error("Failed to load duo leaderboard:", err);
		} finally {
			if (!aborted) loading = false;
		}
	}
});

/** Sorted & filtered players based on view mode */
const rankedPlayers = $derived.by(() => {
	if (viewMode === "ppg") {
		return players
			.filter((p) => p.games >= MIN_GAMES_PPG)
			.map((p) => ({ ...p, ppg: p.points / p.games }))
			.sort((a, b) => b.ppg - a.ppg);
	}
	if (viewMode === "elo") {
		return [...players].sort((a, b) => (b.elo || 1200) - (a.elo || 1200));
	}
	return players;
});

/** Get medal emoji for top 3 */
function getMedal(index) {
	if (index === 0) return "\u{1F947}";
	if (index === 1) return "\u{1F948}";
	if (index === 2) return "\u{1F949}";
	return null;
}

/** Get rank text style */
function getRankStyle(index) {
	if (index === 0) return "text-yellow-400";
	if (index === 1) return "text-gray-400";
	if (index === 2) return "text-amber-600";
	return "text-text-secondary";
}

/** Check if player is sleeping (last game > 1 month ago) */
function isSleeping(lastPlayedAt) {
	if (!lastPlayedAt) return false;
	return Date.now() - new Date(lastPlayedAt).getTime() > ONE_MONTH_MS;
}

/** Handle player row click - open H2H modal (not for current user) */
function handlePlayerClick(playerId) {
	if (playerId === userId) return;
	selectedPlayerId = playerId;
}

/** Format PPG with locale-aware decimal separator */
function formatPpg(value) {
	return value.toFixed(2).replace(".", ",");
}

const userId = $derived($user?.id);

/**
 * Collects all badge emojis for a player (streak + wall + scorer)
 * @param {object} player
 * @returns {Array<{emoji: string, title: string}>}
 */
function getPlayerBadges(player) {
	const badges = [];

	if (player.current_streak?.type === "win") {
		badges.push({
			emoji: "\u{1F525}",
			title: `${player.current_streak.count} Siege in Folge`,
		});
	} else if (player.current_streak?.type === "loss") {
		badges.push({
			emoji: "\u{1F976}",
			title: `${player.current_streak.count} Niederlagen in Folge`,
		});
	}

	for (const badge of player.badges || []) {
		if (badge.type === "wall") {
			badges.push({
				emoji: "\u{1F9F1}",
				title: `${badge.count} Spiele zu Null`,
			});
		}
		if (badge.type === "scorer") {
			badges.push({
				emoji: "\u26BD",
				title: `${badge.count} Spiele mit 3+ Toren`,
			});
		}
	}

	return badges;
}
</script>

<svelte:head>
	<title>RasenBürosport - {$t("leaderboard.title")}</title>
</svelte:head>

<div class="flex flex-col gap-4">
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-2">
			<h1 class="text-xl font-bold text-text-primary">{$t("leaderboard.title")}</h1>
			<a
				href={ROUTES.COMPARE}
				class="flex items-center gap-1 px-2 py-1 text-xs font-medium text-text-secondary bg-bg-secondary border border-border rounded-md hover:text-text-primary hover:bg-bg-input transition-colors"
				title={$t("leaderboard.compare")}
			>
				<svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
				</svg>
				{$t("leaderboard.compare")}
			</a>
		</div>
		<SeasonSelector />
	</div>

	<!-- Game Mode Filter -->
	<div class="flex bg-bg-secondary border border-border rounded-lg p-1 gap-1">
		{#each [
			{ value: "all", label: $t("leaderboard.mode_all") },
			{ value: "1v1", label: $t("leaderboard.mode_1v1") },
			{ value: "2v2", label: $t("leaderboard.mode_2v2") },
			{ value: "duos", label: $t("leaderboard.mode_duos") }
		] as option (option.value)}
			<button
				type="button"
				onclick={() => (selectedMode = option.value)}
				class="flex-1 text-center py-1.5 text-sm rounded-md transition-colors
					{selectedMode === option.value
						? 'bg-accent-red text-white font-semibold'
						: 'text-text-secondary hover:text-text-primary'}"
			>
				{option.label}
			</button>
		{/each}
	</div>

	<!-- Tab Navigation (hidden in duos mode) -->
	{#if !isDuosMode}
		<div class="flex w-full">
			<button
				type="button"
				onclick={() => (viewMode = "total")}
				class="flex-1 text-center pb-2.5 text-sm transition-colors
					{viewMode === 'total'
						? 'font-semibold text-text-primary border-b-2 border-accent-red'
						: 'text-text-secondary border-b border-border hover:text-text-primary'}"
			>
				{$t("leaderboard.tab_total")}
			</button>
			<button
				type="button"
				onclick={() => (viewMode = "ppg")}
				class="flex-1 text-center pb-2.5 text-sm transition-colors
					{viewMode === 'ppg'
						? 'font-semibold text-text-primary border-b-2 border-accent-red'
						: 'text-text-secondary border-b border-border hover:text-text-primary'}"
			>
				{$t("leaderboard.tab_per_game")}
			</button>
			<button
				type="button"
				onclick={() => (viewMode = "elo")}
				class="flex-1 text-center pb-2.5 text-sm transition-colors
					{viewMode === 'elo'
						? 'font-semibold text-text-primary border-b-2 border-accent-red'
						: 'text-text-secondary border-b border-border hover:text-text-primary'}"
			>
				{$t("leaderboard.tab_elo")}
			</button>
		</div>
	{/if}

	{#if loading}
		<div class="flex justify-center py-8">
			<div
				class="animate-spin h-8 w-8 border-2 border-accent-red border-t-transparent rounded-full"
			></div>
		</div>
	{:else if isDuosMode}
		<!-- Duo Leaderboard -->
		{#if duos.length === 0}
			<p class="text-text-secondary text-center py-8">{$t("duos.no_data")}</p>
		{:else}
			<div class="flex flex-col gap-2">
				{#each duos as duo, index (duo.duo_id)}
					{@const medal = getMedal(index)}
					<button
						type="button"
						onclick={() => (selectedDuo = duo)}
						class="flex items-center gap-3 bg-bg-secondary border border-border rounded-lg px-3 py-3 transition-colors text-left w-full hover:bg-bg-input active:scale-[0.98]"
					>
						<!-- Rank -->
						<div class="w-8 text-center shrink-0">
							{#if medal}
								<span class="text-lg">{medal}</span>
							{:else}
								<span class="text-sm font-bold {getRankStyle(index)}">{index + 1}</span>
							{/if}
						</div>

						<!-- Duo Avatars -->
						<div class="flex -space-x-2 shrink-0">
							{#if duo.player1.avatar_url}
								<img
									src={duo.player1.avatar_url}
									alt={duo.player1.username}
									class="w-9 h-9 rounded-full object-cover ring-1 ring-bg-secondary"
								/>
							{:else}
								<div class="w-9 h-9 rounded-full bg-bg-input ring-1 ring-bg-secondary flex items-center justify-center text-sm font-bold text-text-secondary">
									{(duo.player1.username || "?").charAt(0).toUpperCase()}
								</div>
							{/if}
							{#if duo.player2.avatar_url}
								<img
									src={duo.player2.avatar_url}
									alt={duo.player2.username}
									class="w-9 h-9 rounded-full object-cover ring-1 ring-bg-secondary"
								/>
							{:else}
								<div class="w-9 h-9 rounded-full bg-bg-input ring-1 ring-bg-secondary flex items-center justify-center text-sm font-bold text-text-secondary">
									{(duo.player2.username || "?").charAt(0).toUpperCase()}
								</div>
							{/if}
						</div>

						<!-- Names + Stats -->
						<div class="flex-1 min-w-0">
							<p class="text-sm font-medium text-text-primary truncate">
								{duo.player1.username} {$t("duos.and")} {duo.player2.username}
							</p>
							<p class="text-[10px] text-text-secondary">
								{duo.wins}{$t("leaderboard.w_short")} ·
								{duo.draws}{$t("leaderboard.d_short")} ·
								{duo.losses}{$t("leaderboard.l_short")} ·
								{duo.games} {$t("leaderboard.games_short")}
							</p>
						</div>

						<!-- Points + Win Rate -->
						<div class="text-right shrink-0">
							<span class="text-lg font-bold text-text-primary">{duo.points}</span>
							<span class="text-[10px] text-text-secondary block">{duo.win_rate}%</span>
						</div>
					</button>
				{/each}
			</div>
		{/if}
	{:else if rankedPlayers.length === 0}
		<p class="text-text-secondary text-center py-8">{$t("leaderboard.no_data")}</p>
	{:else}
		<div class="flex flex-col gap-2">
			{#each rankedPlayers as player, index (player.player_id)}
				{@const isCurrentUser = player.player_id === userId}
				{@const medal = getMedal(index)}
				{@const sleeping = isSleeping(player.last_played_at)}
				{@const badges = getPlayerBadges(player)}
				<button
					type="button"
					onclick={() => handlePlayerClick(player.player_id)}
					class="flex items-center gap-3 bg-bg-secondary border rounded-lg px-3 py-3 transition-colors text-left w-full
						{isCurrentUser ? 'border-accent-red bg-accent-red/5' : 'border-border'}
						{!isCurrentUser ? 'hover:bg-bg-input active:scale-[0.98]' : ''}"
				>
					<!-- Rank -->
					<div class="w-8 text-center shrink-0">
						{#if medal}
							<span class="text-lg">{medal}</span>
						{:else}
							<span class="text-sm font-bold {getRankStyle(index)}">{index + 1}</span>
						{/if}
					</div>

					<!-- Avatar with badges -->
					<div class="relative shrink-0">
						{#if player.avatar_url}
							<img
								src={player.avatar_url}
								alt={player.username}
								class="w-9 h-9 rounded-full object-cover ring-1 {isCurrentUser ? 'ring-accent-red' : 'ring-border'}"
							/>
						{:else}
							<div
								class="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold
									{isCurrentUser ? 'bg-accent-red/20 ring-1 ring-accent-red text-text-primary' : 'bg-bg-input ring-1 ring-border text-text-secondary'}"
							>
								{(player.username || "?").charAt(0).toUpperCase()}
							</div>
						{/if}
						{#if badges.length > 0}
							<div class="absolute -bottom-1.5 left-1/2 -translate-x-1/2 flex gap-0.5">
								{#each badges as badge, bi (bi)}
									<span
										class="text-[10px] leading-none drop-shadow-sm"
										title={badge.title}
									>
										{badge.emoji}
									</span>
								{/each}
							</div>
						{/if}
					</div>

					<!-- Name + Stats -->
					<div class="flex-1 min-w-0">
						<p class="text-sm font-medium text-text-primary truncate">
							{player.username}
							{#if isCurrentUser}
								<span class="text-[10px] text-accent-red">({$t("leaderboard.you")})</span>
							{/if}
							{#if sleeping}
								<span class="text-sm" title={$t("dashboard.streak_sleeping")}>{"\u{1F634}"}</span>
							{/if}
						</p>
						<p class="text-[10px] text-text-secondary">
							{player.wins}{$t("leaderboard.w_short")} ·
							{player.draws}{$t("leaderboard.d_short")} ·
							{player.losses}{$t("leaderboard.l_short")} ·
							{player.games} {$t("leaderboard.games_short")}
						</p>
					</div>

					<!-- Points / PPG / Elo -->
					<div class="text-right shrink-0">
						{#if viewMode === "ppg"}
							<span class="text-lg font-bold text-text-primary">{formatPpg(player.ppg)}</span>
							<span class="text-[10px] text-text-secondary block">{$t("leaderboard.ppg_label")}</span>
						{:else if viewMode === "elo"}
							<span class="text-lg font-bold text-text-primary">{player.elo || 1200}</span>
							<span class="text-[10px] text-text-secondary block">Elo</span>
						{:else}
							<span class="text-lg font-bold text-text-primary">{player.points}</span>
							<span class="text-[10px] text-text-secondary block">{$t("dashboard.points_short")}</span>
						{/if}
					</div>
				</button>
			{/each}
		</div>
	{/if}
</div>

<!-- H2H Modal -->
{#if selectedPlayerId}
	<H2HModal playerId={selectedPlayerId} onClose={() => (selectedPlayerId = null)} />
{/if}

<!-- Duo Detail Modal -->
{#if selectedDuo}
	<DuoDetailModal
		player1Id={selectedDuo.player1.player_id}
		player2Id={selectedDuo.player2.player_id}
		onClose={() => (selectedDuo = null)}
	/>
{/if}
