<script>
import { getTranslate } from "@tolgee/svelte";
import Button from "$lib/components/ui/Button.svelte";
import RandomTeamPicker from "./RandomTeamPicker.svelte";
import TeamAutocomplete from "./TeamAutocomplete.svelte";

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

let showRandomPicker = $state(false);

/** Handle random team picker confirmation */
function handleRandomConfirm(home, away) {
	homeTeam = home;
	awayTeam = away;
	showRandomPicker = false;
}

/** Auto-derived game mode label */
const modeLabel = $derived(`${homePlayers.length}v${awayPlayers.length}`);

/** Both teams must be selected to proceed */
const canProceed = $derived(
	homeTeam.trim().length > 0 && awayTeam.trim().length > 0,
);
</script>

<div class="flex flex-col gap-5">
	<!-- Mode Badge -->
	<div class="flex justify-center">
		<span class="bg-accent-red/20 text-accent-red text-xs font-bold px-3 py-1 rounded-full">
			{modeLabel}
		</span>
	</div>

	<!-- Random Teams Button -->
	<div class="flex justify-center">
		<button
			type="button"
			onclick={() => { showRandomPicker = true; }}
			class="flex items-center gap-1.5 text-xs font-medium text-accent-red hover:text-accent-red-hover transition-colors"
		>
			<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22" />
				<path d="m18 2 4 4-4 4" />
				<path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2" />
				<path d="M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8" />
				<path d="m18 14 4 4-4 4" />
			</svg>
			{$t("new_game.random_teams")}
		</button>
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

{#if showRandomPicker}
	<RandomTeamPicker
		onClose={() => { showRandomPicker = false; }}
		onConfirm={handleRandomConfirm}
	/>
{/if}
