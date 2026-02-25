<script>
	import { getTranslate } from "@tolgee/svelte";
	import PlayerPicker from "./PlayerPicker.svelte";
	import TeamPicker from "./TeamPicker.svelte";
	import Button from "$lib/components/ui/Button.svelte";

	let {
		mode = $bindable("1v1"),
		homePlayers = $bindable([""]),
		awayPlayers = $bindable([""]),
		homeTeam = $bindable(""),
		awayTeam = $bindable(""),
		allPlayers = [],
		allTeams = [],
		onNext,
	} = $props();

	const { t } = getTranslate();

	/** All currently selected player IDs (to exclude from other dropdowns) */
	const selectedPlayerIds = $derived(
		[...homePlayers, ...awayPlayers].filter(Boolean),
	);

	const isValid = $derived(() => {
		const expectedCount = mode === "1v1" ? 1 : 2;
		const homeValid = homePlayers.filter(Boolean).length === expectedCount;
		const awayValid = awayPlayers.filter(Boolean).length === expectedCount;
		return homeValid && awayValid;
	});

	function handleModeChange(newMode) {
		mode = newMode;
		if (newMode === "1v1") {
			homePlayers = [homePlayers[0] || ""];
			awayPlayers = [awayPlayers[0] || ""];
		} else {
			if (homePlayers.length < 2) homePlayers = [...homePlayers, ""];
			if (awayPlayers.length < 2) awayPlayers = [...awayPlayers, ""];
		}
	}
</script>

<div class="flex flex-col gap-5">
	<!-- Mode Toggle -->
	<div class="flex rounded-lg overflow-hidden border border-border">
		<button
			type="button"
			onclick={() => handleModeChange("1v1")}
			class="flex-1 py-2.5 text-sm font-medium transition-colors {mode === '1v1' ? 'bg-accent-red text-white' : 'bg-bg-secondary text-text-secondary'}"
		>
			{$t("new_game.mode_1v1")}
		</button>
		<button
			type="button"
			onclick={() => handleModeChange("2v2")}
			class="flex-1 py-2.5 text-sm font-medium transition-colors {mode === '2v2' ? 'bg-accent-red text-white' : 'bg-bg-secondary text-text-secondary'}"
		>
			{$t("new_game.mode_2v2")}
		</button>
	</div>

	<!-- Home Team -->
	<div class="bg-bg-secondary border border-border rounded-lg p-4">
		<h3 class="text-sm font-medium text-text-primary mb-3">
			{$t("new_game.home")}
		</h3>
		<div class="flex flex-col gap-2">
			{#each homePlayers as _, i}
				<PlayerPicker
					players={allPlayers}
					bind:selectedId={homePlayers[i]}
					excludeIds={selectedPlayerIds}
				/>
			{/each}
			<TeamPicker teams={allTeams} bind:selectedId={homeTeam} />
		</div>
	</div>

	<!-- Away Team -->
	<div class="bg-bg-secondary border border-border rounded-lg p-4">
		<h3 class="text-sm font-medium text-text-primary mb-3">
			{$t("new_game.away")}
		</h3>
		<div class="flex flex-col gap-2">
			{#each awayPlayers as _, i}
				<PlayerPicker
					players={allPlayers}
					bind:selectedId={awayPlayers[i]}
					excludeIds={selectedPlayerIds}
				/>
			{/each}
			<TeamPicker teams={allTeams} bind:selectedId={awayTeam} />
		</div>
	</div>

	<!-- Next Button -->
	<Button variant="primary" onclick={onNext} disabled={!isValid()}>
		{$t("new_game.next")}
	</Button>
</div>
