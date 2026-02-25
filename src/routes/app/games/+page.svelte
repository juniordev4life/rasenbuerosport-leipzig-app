<script>
	import { getTranslate } from "@tolgee/svelte";
	import { get } from "$lib/services/api.services.js";
	import GameCard from "$lib/components/dashboard/GameCard.svelte";
	import Button from "$lib/components/ui/Button.svelte";

	const { t } = getTranslate();

	const PAGE_SIZE = 10;

	let games = $state([]);
	let loading = $state(true);
	let loadingMore = $state(false);
	let hasMore = $state(true);
	let offset = $state(0);

	$effect(() => {
		loadGames();
	});

	async function loadGames() {
		try {
			const res = await get(`/v1/games?limit=${PAGE_SIZE}&offset=0`);
			games = res.data || [];
			offset = games.length;
			hasMore = games.length >= PAGE_SIZE;
		} catch (err) {
			console.error("Failed to load games:", err);
		} finally {
			loading = false;
		}
	}

	async function loadMore() {
		loadingMore = true;
		try {
			const res = await get(`/v1/games?limit=${PAGE_SIZE}&offset=${offset}`);
			const newGames = res.data || [];
			games = [...games, ...newGames];
			offset += newGames.length;
			hasMore = newGames.length >= PAGE_SIZE;
		} catch (err) {
			console.error("Failed to load more games:", err);
		} finally {
			loadingMore = false;
		}
	}
</script>

<svelte:head>
	<title>RasenBürosport - {$t("games.title")}</title>
</svelte:head>

<div class="flex flex-col gap-4">
	<h1 class="text-xl font-bold text-text-primary">{$t("games.title")}</h1>

	{#if loading}
		<div class="flex justify-center py-8">
			<div
				class="animate-spin h-8 w-8 border-2 border-accent-red border-t-transparent rounded-full"
			></div>
		</div>
	{:else if games.length === 0}
		<p class="text-text-secondary text-center py-8">
			{$t("games.no_games")}
		</p>
	{:else}
		<div class="flex flex-col gap-3">
			{#each games as game (game.id)}
				<GameCard {game} />
			{/each}
		</div>

		{#if hasMore}
			<Button variant="ghost" onclick={loadMore} loading={loadingMore}>
				{$t("games.load_more")}
			</Button>
		{:else}
			<p class="text-text-secondary text-sm text-center py-2">
				{$t("games.no_more")}
			</p>
		{/if}
	{/if}
</div>
