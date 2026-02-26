<script>
	import { page } from "$app/state";
	import { goto } from "$app/navigation";
	import { getTranslate } from "@tolgee/svelte";
	import { get } from "$lib/services/api.services.js";
	import { user } from "$lib/stores/auth.stores.js";
	import { getTeamByName, getCountryFlag } from "$lib/constants/teams.constants.js";

	const { t } = getTranslate();

	let game = $state(null);
	let loading = $state(true);
	let error = $state(false);

	const gameId = $derived(page.params.id);

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
		isDraw ? "text-warning" : isWin ? "text-success" : userTeam ? "text-error" : "text-text-secondary",
	);

	/** Get team info (flag + league) from team name */
	function getTeamInfo(teamName) {
		if (!teamName) return null;
		const team = getTeamByName(teamName);
		if (!team) return { name: teamName, flag: "", league: "" };
		return {
			name: team.name,
			flag: getCountryFlag(team.country),
			league: team.league,
		};
	}

	/** Get the team name used by a side */
	function getSideTeamName(players) {
		for (const p of players) {
			if (p.team_name) return p.team_name;
		}
		return null;
	}

	const homeTeamName = $derived(getSideTeamName(homePlayers));
	const awayTeamName = $derived(getSideTeamName(awayPlayers));
	const homeTeamInfo = $derived(getTeamInfo(homeTeamName));
	const awayTeamInfo = $derived(getTeamInfo(awayTeamName));

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
			const periodChanged =
				i > 0 && timeline[i - 1].period !== entry.period;
			return {
				...entry,
				side: isHomeGoal ? "home" : "away",
				periodChanged,
			};
		});
		return entries.toReversed();
	});
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
					{#if homeTeamInfo}
						<span class="text-sm text-text-secondary">
							{homeTeamInfo.flag} {homeTeamInfo.name}
						</span>
					{/if}
					<span class="text-5xl font-bold {resultColor}">{game.score_home}</span>
				</div>

				<span class="text-3xl font-bold text-text-secondary">:</span>

				<div class="flex flex-col items-center gap-1">
					{#if awayTeamInfo}
						<span class="text-sm text-text-secondary">
							{awayTeamInfo.flag} {awayTeamInfo.name}
						</span>
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
						<div class="relative z-10 flex items-center w-full py-1.5">
							<!-- Home side (left) -->
							<div class="flex-1 flex items-center justify-end gap-2 pr-4">
								{#if entry.side === "home"}
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
						</div>
					{/each}
				</div>
			</div>
		</div>
	{/if}
</div>
