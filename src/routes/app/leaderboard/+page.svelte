<script>
	import { getTranslate } from "@tolgee/svelte";
	import { get } from "$lib/services/api.services.js";
	import { user } from "$lib/stores/auth.stores.js";
	import H2HModal from "$lib/components/leaderboard/H2HModal.svelte";

	const { t } = getTranslate();

	let players = $state([]);
	let loading = $state(true);
	let selectedPlayerId = $state(null);
	let viewMode = $state("total");

	const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;
	const MIN_GAMES_PPG = 3;

	$effect(() => {
		loadLeaderboard();
	});

	async function loadLeaderboard() {
		try {
			const res = await get("/v1/leaderboard?limit=50");
			players = res.data || [];
		} catch (err) {
			console.error("Failed to load leaderboard:", err);
		} finally {
			loading = false;
		}
	}

	/** Sorted & filtered players based on view mode */
	const rankedPlayers = $derived.by(() => {
		if (viewMode === "ppg") {
			return players
				.filter((p) => p.games >= MIN_GAMES_PPG)
				.map((p) => ({ ...p, ppg: p.points / p.games }))
				.sort((a, b) => b.ppg - a.ppg);
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
	 * @returns {Array<{emoji: string, title: string, position: string}>}
	 */
	function getPlayerBadges(player) {
		const badges = [];

		if (player.current_streak?.type === "win") {
			badges.push({ emoji: "\u{1F525}", title: `${player.current_streak.count} Siege in Folge` });
		} else if (player.current_streak?.type === "loss") {
			badges.push({ emoji: "\u{1F976}", title: `${player.current_streak.count} Niederlagen in Folge` });
		}

		for (const badge of player.badges || []) {
			if (badge.type === "wall") {
				badges.push({ emoji: "\u{1F9F1}", title: `${badge.count} Spiele zu Null` });
			}
			if (badge.type === "scorer") {
				badges.push({ emoji: "\u26BD", title: `${badge.count} Spiele mit 3+ Toren` });
			}
		}

		return badges;
	}
</script>

<svelte:head>
	<title>RasenBürosport - {$t("leaderboard.title")}</title>
</svelte:head>

<div class="flex flex-col gap-4">
	<h1 class="text-xl font-bold text-text-primary">{$t("leaderboard.title")}</h1>

	<!-- Tab Navigation -->
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
	</div>

	{#if loading}
		<div class="flex justify-center py-8">
			<div
				class="animate-spin h-8 w-8 border-2 border-accent-red border-t-transparent rounded-full"
			></div>
		</div>
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

					<!-- Points / PPG -->
					<div class="text-right shrink-0">
						{#if viewMode === "ppg"}
							<span class="text-lg font-bold text-text-primary">{formatPpg(player.ppg)}</span>
							<span class="text-[10px] text-text-secondary block">{$t("leaderboard.ppg_label")}</span>
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
