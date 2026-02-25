<script>
	import { getTranslate } from "@tolgee/svelte";
	import ScoreCounter from "./ScoreCounter.svelte";
	import Button from "$lib/components/ui/Button.svelte";

	let {
		scoreHome = $bindable(0),
		scoreAway = $bindable(0),
		homeTeamName = "",
		awayTeamName = "",
		homePlayerNames = [],
		awayPlayerNames = [],
		onNext,
		onBack,
	} = $props();

	const { t } = getTranslate();
</script>

<div class="flex flex-col gap-6">
	<h2 class="text-lg font-bold text-text-primary text-center">
		{$t("new_game.score_title")}
	</h2>

	<div class="flex items-center justify-center gap-6">
		<!-- Home Side -->
		<div class="flex flex-col items-center gap-2">
			{#if homeTeamName}
				<p class="text-xs text-text-secondary font-medium">{homeTeamName}</p>
			{/if}
			<ScoreCounter bind:value={scoreHome} />
			<div class="text-center">
				{#each homePlayerNames as name}
					<p class="text-xs text-text-secondary">{name}</p>
				{/each}
			</div>
		</div>

		<!-- Separator -->
		<span class="text-3xl font-bold text-text-secondary mt-4">:</span>

		<!-- Away Side -->
		<div class="flex flex-col items-center gap-2">
			{#if awayTeamName}
				<p class="text-xs text-text-secondary font-medium">{awayTeamName}</p>
			{/if}
			<ScoreCounter bind:value={scoreAway} />
			<div class="text-center">
				{#each awayPlayerNames as name}
					<p class="text-xs text-text-secondary">{name}</p>
				{/each}
			</div>
		</div>
	</div>

	<!-- Navigation -->
	<div class="flex gap-3">
		<Button variant="secondary" onclick={onBack} class="flex-1">
			{$t("new_game.back")}
		</Button>
		<Button variant="primary" onclick={onNext} class="flex-1">
			{$t("new_game.next")}
		</Button>
	</div>
</div>
