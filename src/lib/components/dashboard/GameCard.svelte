<script>
import { getTranslate } from "@tolgee/svelte";
import TeamLogo from "$lib/components/ui/TeamLogo.svelte";
import { getTeamByName } from "$lib/services/teams.services.js";
import { user } from "$lib/stores/auth.stores.js";

let { game } = $props();

const { t } = getTranslate();

const homePlayers = $derived(
	game.game_players?.filter((p) => p.team === "home") || [],
);
const awayPlayers = $derived(
	game.game_players?.filter((p) => p.team === "away") || [],
);

const homeTeamName = $derived(homePlayers.find((p) => p.team_name)?.team_name);
const awayTeamName = $derived(awayPlayers.find((p) => p.team_name)?.team_name);

/** @type {import('$lib/services/teams.services.js').TeamData|null} */
let homeTeamData = $state(null);
/** @type {import('$lib/services/teams.services.js').TeamData|null} */
let awayTeamData = $state(null);

$effect(() => {
	if (homeTeamName)
		getTeamByName(homeTeamName).then((t) => {
			homeTeamData = t || null;
		});
});
$effect(() => {
	if (awayTeamName)
		getTeamByName(awayTeamName).then((t) => {
			awayTeamData = t || null;
		});
});

const userId = $derived($user?.id);

const userTeam = $derived(
	game.game_players?.find((p) => p.player_id === userId)?.team || "home",
);

const isWin = $derived(
	userTeam === "home"
		? game.score_home > game.score_away
		: game.score_away > game.score_home,
);
const isDraw = $derived(game.score_home === game.score_away);

const resultBgColor = $derived(
	isDraw ? "bg-warning" : isWin ? "bg-success" : "bg-error",
);

const resultLetter = $derived(
	isDraw
		? $t("dashboard.draw").charAt(0)
		: isWin
			? $t("dashboard.win").charAt(0)
			: $t("dashboard.loss").charAt(0),
);

/** Get player initial from profile */
function getInitial(player) {
	const name = player.profiles?.username;
	return name?.charAt(0)?.toUpperCase() || "?";
}

/** Result type suffix (n.V. / n.E.) */
const resultSuffix = $derived(
	game.result_type === "penalty"
		? $t("game_detail.penalty_short")
		: game.result_type === "extra_time"
			? $t("game_detail.extra_time_short")
			: "",
);

const formattedDate = $derived(
	new Date(game.played_at).toLocaleDateString("de-DE", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	}),
);
</script>

<a
	href="/app/games/{game.id}"
	class="flex items-center gap-3 bg-bg-secondary border border-border rounded-lg p-3 transition-colors hover:bg-bg-input active:scale-[0.98]"
>
	<!-- Result indicator -->
	<div
		class="w-8 h-8 rounded-full {resultBgColor} flex items-center justify-center shrink-0"
	>
		<span class="text-[10px] font-bold text-white">{resultLetter}</span>
	</div>

	<!-- Game content -->
	<div class="flex-1 flex items-center justify-center gap-2 min-w-0">
		<!-- Home side -->
		<div class="w-16 flex flex-col items-end gap-1 shrink-0">
			{#if homeTeamData?.logo_url}
				<TeamLogo logoUrl={homeTeamData.logo_url} teamName={homeTeamData.name} size="sm" />
			{/if}
			<div class="flex items-center justify-end -space-x-1.5">
				{#each homePlayers as player (player.player_id)}
					{#if player.profiles?.avatar_url}
						<img
							src={player.profiles.avatar_url}
							alt={player.profiles?.username || "?"}
							class="w-7 h-7 rounded-full object-cover ring-2 ring-bg-secondary"
						/>
					{:else}
						<div
							class="w-7 h-7 rounded-full bg-accent-red/20 ring-2 ring-bg-secondary flex items-center justify-center text-[10px] font-bold text-text-primary"
							title={player.profiles?.username || "?"}
						>
							{getInitial(player)}
						</div>
					{/if}
				{/each}
			</div>
		</div>

		<!-- Score center (fixed width) -->
		<div class="w-14 flex flex-col items-center shrink-0">
			<span class="text-lg font-bold text-text-primary leading-none">
				{game.score_home}:{game.score_away}
			</span>
			{#if resultSuffix}
				<span class="text-[10px] font-medium text-accent-red leading-none">{resultSuffix}</span>
			{/if}
			<span class="text-[10px] text-text-secondary">{game.mode}</span>
		</div>

		<!-- Away side -->
		<div class="w-16 flex flex-col items-start gap-1 shrink-0">
			{#if awayTeamData?.logo_url}
				<TeamLogo logoUrl={awayTeamData.logo_url} teamName={awayTeamData.name} size="sm" />
			{/if}
			<div class="flex items-center justify-start -space-x-1.5">
				{#each awayPlayers as player (player.player_id)}
					{#if player.profiles?.avatar_url}
						<img
							src={player.profiles.avatar_url}
							alt={player.profiles?.username || "?"}
							class="w-7 h-7 rounded-full object-cover ring-2 ring-bg-secondary"
						/>
					{:else}
						<div
							class="w-7 h-7 rounded-full bg-blue-500/20 ring-2 ring-bg-secondary flex items-center justify-center text-[10px] font-bold text-text-primary"
							title={player.profiles?.username || "?"}
						>
							{getInitial(player)}
						</div>
					{/if}
				{/each}
			</div>
		</div>
	</div>

	<!-- Date -->
	<span class="text-[10px] text-text-secondary shrink-0 text-right leading-tight w-14">
		{formattedDate}
	</span>
</a>
