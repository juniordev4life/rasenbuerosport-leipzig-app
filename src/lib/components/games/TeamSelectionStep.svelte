<script>
	import { getTranslate } from "@tolgee/svelte";
	import TeamAutocomplete from "./TeamAutocomplete.svelte";
	import Button from "$lib/components/ui/Button.svelte";

	/**
	 * TeamSelectionStep - Step 2 of new game wizard
	 * Shows assigned players and team autocomplete fields
	 */
	let {
		homePlayers = [],
		awayPlayers = [],
		allPlayers = [],
		homeTeam = $bindable(""),
		awayTeam = $bindable(""),
		onNext,
		onBack,
	} = $props();

	const { t } = getTranslate();

	const GUEST_ID = "__guest__";

	/** Get player display name from ID */
	function getPlayerName(playerId) {
		if (playerId.startsWith(GUEST_ID)) return $t("new_game.guest");
		return allPlayers.find((p) => p.id === playerId)?.username || "?";
	}

	/** Get player initial from ID */
	function getPlayerInitial(playerId) {
		if (playerId.startsWith(GUEST_ID)) return "?";
		const name = allPlayers.find((p) => p.id === playerId)?.username;
		return name?.charAt(0)?.toUpperCase() || "?";
	}

	/** Get player avatar URL from ID */
	function getPlayerAvatar(playerId) {
		if (playerId.startsWith(GUEST_ID)) return null;
		return allPlayers.find((p) => p.id === playerId)?.avatar_url || null;
	}

	/** Auto-derived game mode label */
	const modeLabel = $derived(`${homePlayers.length}v${awayPlayers.length}`);

	/** Both teams must be selected to proceed */
	const canProceed = $derived(homeTeam.trim().length > 0 && awayTeam.trim().length > 0);
</script>

<div class="flex flex-col gap-5">
	<!-- Mode Badge -->
	<div class="flex justify-center">
		<span class="bg-accent-red/20 text-accent-red text-xs font-bold px-3 py-1 rounded-full">
			{modeLabel}
		</span>
	</div>

	<!-- Teams Section -->
	<div class="grid grid-cols-2 gap-3">
		<!-- Home Team -->
		<div class="flex flex-col gap-2">
			<h3 class="text-xs font-bold text-accent-red text-center uppercase tracking-wider">
				{$t("new_game.home")}
			</h3>

			<!-- Player Avatars -->
			<div class="flex justify-center gap-2">
				{#each homePlayers as playerId (playerId)}
					<div class="flex flex-col items-center gap-1">
						{#if getPlayerAvatar(playerId)}
							<img
								src={getPlayerAvatar(playerId)}
								alt={getPlayerName(playerId)}
								class="w-10 h-10 rounded-full object-cover ring-2 ring-accent-red"
							/>
						{:else}
							<div class="w-10 h-10 rounded-full bg-accent-red/20 ring-2 ring-accent-red flex items-center justify-center text-sm font-bold text-text-primary">
								{getPlayerInitial(playerId)}
							</div>
						{/if}
						<span class="text-[10px] text-text-primary text-center truncate max-w-[56px]">
							{getPlayerName(playerId)}
						</span>
					</div>
				{/each}
			</div>

			<!-- Team Autocomplete -->
			<TeamAutocomplete bind:value={homeTeam} />
		</div>

		<!-- Away Team -->
		<div class="flex flex-col gap-2">
			<h3 class="text-xs font-bold text-blue-500 text-center uppercase tracking-wider">
				{$t("new_game.away")}
			</h3>

			<!-- Player Avatars -->
			<div class="flex justify-center gap-2">
				{#each awayPlayers as playerId (playerId)}
					<div class="flex flex-col items-center gap-1">
						{#if getPlayerAvatar(playerId)}
							<img
								src={getPlayerAvatar(playerId)}
								alt={getPlayerName(playerId)}
								class="w-10 h-10 rounded-full object-cover ring-2 ring-blue-500"
							/>
						{:else}
							<div class="w-10 h-10 rounded-full bg-blue-500/20 ring-2 ring-blue-500 flex items-center justify-center text-sm font-bold text-text-primary">
								{getPlayerInitial(playerId)}
							</div>
						{/if}
						<span class="text-[10px] text-text-primary text-center truncate max-w-[56px]">
							{getPlayerName(playerId)}
						</span>
					</div>
				{/each}
			</div>

			<!-- Team Autocomplete -->
			<TeamAutocomplete bind:value={awayTeam} />
		</div>
	</div>

	<!-- Navigation -->
	<div class="flex gap-3">
		<Button variant="secondary" onclick={onBack} class="flex-1">
			{$t("new_game.back")}
		</Button>
		<Button variant="primary" onclick={onNext} class="flex-1" disabled={!canProceed}>
			{$t("new_game.next")}
		</Button>
	</div>
</div>
