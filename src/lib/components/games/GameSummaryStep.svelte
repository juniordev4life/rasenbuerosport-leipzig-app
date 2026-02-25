<script>
	import { getTranslate } from "@tolgee/svelte";
	import StarRating from "./StarRating.svelte";
	import Button from "$lib/components/ui/Button.svelte";

	let {
		mode = "1v1",
		scoreHome = 0,
		scoreAway = 0,
		homeTeamName = "",
		awayTeamName = "",
		homePlayerNames = [],
		awayPlayerNames = [],
		ratings = $bindable({}),
		allPlayerIds = [],
		saving = false,
		onSave,
		onBack,
	} = $props();

	const { t } = getTranslate();

	const allNames = $derived([...homePlayerNames, ...awayPlayerNames]);
</script>

<div class="flex flex-col gap-5">
	<h2 class="text-lg font-bold text-text-primary text-center">
		{$t("new_game.summary_title")}
	</h2>

	<!-- Game Info Summary -->
	<div class="bg-bg-secondary border border-border rounded-lg p-4">
		<div class="flex items-center justify-between mb-3">
			<span class="text-xs text-text-secondary font-medium">{mode}</span>
		</div>

		<div class="flex items-center justify-center gap-4">
			<div class="text-center">
				{#if homeTeamName}
					<p class="text-xs text-text-secondary mb-1">{homeTeamName}</p>
				{/if}
				{#each homePlayerNames as name}
					<p class="text-sm text-text-primary">{name}</p>
				{/each}
			</div>

			<div class="text-center">
				<span class="text-2xl font-bold text-text-primary">
					{scoreHome} : {scoreAway}
				</span>
			</div>

			<div class="text-center">
				{#if awayTeamName}
					<p class="text-xs text-text-secondary mb-1">{awayTeamName}</p>
				{/if}
				{#each awayPlayerNames as name}
					<p class="text-sm text-text-primary">{name}</p>
				{/each}
			</div>
		</div>
	</div>

	<!-- Player Ratings -->
	<div class="bg-bg-secondary border border-border rounded-lg p-4">
		<h3 class="text-sm font-medium text-text-secondary mb-3">
			{$t("new_game.rating_label")}
		</h3>
		<div class="flex flex-col gap-3">
			{#each allPlayerIds as playerId, i}
				<div class="flex items-center justify-between">
					<span class="text-sm text-text-primary">{allNames[i] || "?"}</span>
					<StarRating bind:value={ratings[playerId]} />
				</div>
			{/each}
		</div>
	</div>

	<!-- Navigation -->
	<div class="flex gap-3">
		<Button variant="secondary" onclick={onBack} class="flex-1">
			{$t("new_game.back")}
		</Button>
		<Button variant="primary" onclick={onSave} loading={saving} class="flex-1">
			{saving ? $t("new_game.saving") : $t("new_game.save")}
		</Button>
	</div>
</div>
