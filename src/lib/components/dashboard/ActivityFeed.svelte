<script>
	import { getTranslate } from "@tolgee/svelte";

	let { games = [] } = $props();

	const { t } = getTranslate();

	/**
	 * Formats a timestamp as relative time (e.g. "vor 2 Std.")
	 * @param {string} isoDate
	 * @returns {string}
	 */
	function getRelativeTime(isoDate) {
		const diffMs = Date.now() - new Date(isoDate).getTime();
		const diffMinutes = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);

		if (diffMinutes < 60) {
			return $t("dashboard.activity_ago", {
				time: $t("dashboard.activity_minutes", { count: Math.max(1, diffMinutes) }),
			});
		}
		if (diffHours < 24) {
			return $t("dashboard.activity_ago", {
				time: $t("dashboard.activity_hours", { count: diffHours }),
			});
		}
		return $t("dashboard.activity_ago", {
			time: $t("dashboard.activity_days", { count: diffDays }),
		});
	}

	/** Get player initial from profile */
	function getInitial(player) {
		const name = player.profiles?.username;
		return name?.charAt(0)?.toUpperCase() || "?";
	}

	/** Get players for a given side */
	function getSidePlayers(game, side) {
		return (game.game_players || []).filter((p) => p.team === side);
	}

	/** Get result type suffix (n.V. / n.E.) */
	function getResultSuffix(game) {
		if (game.result_type === "penalty") return $t("game_detail.penalty_short");
		if (game.result_type === "extra_time") return $t("game_detail.extra_time_short");
		return "";
	}
</script>

<section>
	<h2 class="text-lg font-bold mb-3">{$t("dashboard.activity_title")}</h2>

	{#if games.length === 0}
		<p class="text-text-secondary text-sm text-center py-4">{$t("dashboard.activity_no_games")}</p>
	{:else}
		<div class="flex flex-col gap-2">
			{#each games as game (game.id)}
				<a
					href="/app/games/{game.id}"
					class="flex items-center gap-3 bg-bg-secondary border border-border rounded-lg p-3 transition-colors hover:bg-bg-input active:scale-[0.98]"
				>
					<!-- Game content: same layout as GameCard without result indicator -->
					<div class="flex-1 flex items-center justify-center gap-2 min-w-0">
						<!-- Home avatars (fixed width for alignment) -->
						<div class="w-14 flex items-center justify-end -space-x-1.5 shrink-0">
							{#each getSidePlayers(game, "home") as player (player.player_id)}
								{#if player.profiles?.avatar_url}
									<img
										src={player.profiles.avatar_url}
										alt={player.profiles?.username || "?"}
										class="w-8 h-8 rounded-full object-cover ring-2 ring-bg-secondary"
									/>
								{:else}
									<div
										class="w-8 h-8 rounded-full bg-accent-red/20 ring-2 ring-bg-secondary flex items-center justify-center text-[10px] font-bold text-text-primary"
										title={player.profiles?.username || "?"}
									>
										{getInitial(player)}
									</div>
								{/if}
							{/each}
						</div>

						<!-- Score center (fixed width) -->
						<div class="w-14 flex flex-col items-center shrink-0">
							<span class="text-lg font-bold text-text-primary leading-none">
								{game.score_home}:{game.score_away}
							</span>
							{#if getResultSuffix(game)}
								<span class="text-[10px] font-medium text-accent-red leading-none">{getResultSuffix(game)}</span>
							{/if}
							<span class="text-[10px] text-text-secondary">{game.mode}</span>
						</div>

						<!-- Away avatars (fixed width for alignment) -->
						<div class="w-14 flex items-center justify-start -space-x-1.5 shrink-0">
							{#each getSidePlayers(game, "away") as player (player.player_id)}
								{#if player.profiles?.avatar_url}
									<img
										src={player.profiles.avatar_url}
										alt={player.profiles?.username || "?"}
										class="w-8 h-8 rounded-full object-cover ring-2 ring-bg-secondary"
									/>
								{:else}
									<div
										class="w-8 h-8 rounded-full bg-blue-500/20 ring-2 ring-bg-secondary flex items-center justify-center text-[10px] font-bold text-text-primary"
										title={player.profiles?.username || "?"}
									>
										{getInitial(player)}
									</div>
								{/if}
							{/each}
						</div>
					</div>

					<!-- Relative time -->
					<span class="text-[10px] text-text-secondary shrink-0 text-right leading-tight w-14">
						{getRelativeTime(game.played_at)}
					</span>
				</a>
			{/each}
		</div>
	{/if}
</section>
