<script>
	import { getTranslate } from "@tolgee/svelte";
	import { user } from "$lib/stores/auth.stores.js";

	let { game } = $props();

	const { t } = getTranslate();

	const homePlayers = $derived(
		game.game_players?.filter((p) => p.team === "home") || [],
	);
	const awayPlayers = $derived(
		game.game_players?.filter((p) => p.team === "away") || [],
	);

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

	const resultText = $derived(
		isDraw
			? $t("dashboard.draw")
			: isWin
				? $t("dashboard.win")
				: $t("dashboard.loss"),
	);

	const resultBgColor = $derived(
		isDraw ? "bg-warning" : isWin ? "bg-success" : "bg-error",
	);

	const homeNames = $derived(
		homePlayers.map((p) => p.profiles?.username || "?").join(", "),
	);

	const awayNames = $derived(
		awayPlayers.map((p) => p.profiles?.username || "?").join(", "),
	);

	const formattedDate = $derived(
		new Date(game.played_at).toLocaleDateString("de-DE", {
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		}),
	);
</script>

<div
	class="flex items-center gap-3 bg-bg-secondary border border-border rounded-lg p-3"
>
	<!-- Result indicator circle -->
	<div
		class="w-10 h-10 rounded-full {resultBgColor} flex items-center justify-center shrink-0"
	>
		<span class="text-xs font-bold text-white">{resultText.charAt(0)}</span>
	</div>

	<div class="flex-1 min-w-0">
		<div class="flex items-center justify-between">
			<p class="text-sm font-medium text-text-primary truncate">
				{homeNames}
				<span class="text-text-secondary">{$t("common.vs")}</span>
				{awayNames}
			</p>
		</div>
		<div class="flex items-center gap-2 mt-1">
			<span class="text-lg font-bold text-text-primary">
				{game.score_home}:{game.score_away}
			</span>
			<span class="text-xs text-text-secondary">({game.mode})</span>
		</div>
		<p class="text-xs text-text-secondary mt-0.5">{formattedDate}</p>
	</div>
</div>
