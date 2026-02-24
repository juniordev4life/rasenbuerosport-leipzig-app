<script>
	import { getTranslate } from "@tolgee/svelte";

	let { game } = $props();

	const { t } = getTranslate();

	const homePlayers = $derived(
		game.game_players?.filter((p) => p.team === "home") || [],
	);
	const awayPlayers = $derived(
		game.game_players?.filter((p) => p.team === "away") || [],
	);

	const isWin = $derived(game.score_home > game.score_away);
	const isDraw = $derived(game.score_home === game.score_away);

	const resultText = $derived(
		isDraw
			? $t("dashboard.draw")
			: isWin
				? $t("dashboard.win")
				: $t("dashboard.loss"),
	);

	const resultColor = $derived(
		isDraw
			? "text-warning"
			: isWin
				? "text-success"
				: "text-error",
	);

	const opponentNames = $derived(
		awayPlayers.map((p) => p.profiles?.username || "?").join(", "),
	);

	const formattedDate = $derived(
		new Date(game.played_at).toLocaleDateString("de-DE", {
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
		}),
	);
</script>

<div
	class="flex items-center gap-3 bg-bg-secondary border border-border rounded-lg p-3"
>
	<div
		class="w-10 h-10 rounded-full bg-bg-input flex items-center justify-center shrink-0"
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="h-5 w-5 text-text-secondary"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
			stroke-width="2"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
			/>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
			/>
		</svg>
	</div>

	<div class="flex-1 min-w-0">
		<p class="text-sm font-medium text-text-primary truncate">
			{$t("common.vs")} {opponentNames} ({game.mode}) - {game.score_home}:{game.score_away}
			<span class={resultColor}>{resultText}</span>
		</p>
		<p class="text-xs text-text-secondary">{formattedDate}</p>
	</div>
</div>
