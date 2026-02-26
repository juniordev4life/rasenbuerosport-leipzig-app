<script>
	import { getTranslate } from "@tolgee/svelte";
	import { get } from "$lib/services/api.services.js";
	import GameCard from "$lib/components/dashboard/GameCard.svelte";

	/**
	 * H2HModal - Bottom-sheet overlay showing head-to-head stats
	 * @param {string} playerId - Opponent player ID
	 * @param {Function} onClose - Close handler
	 */
	let { playerId, onClose } = $props();

	const { t } = getTranslate();

	let data = $state(null);
	let loading = $state(true);

	$effect(() => {
		if (playerId) loadH2H();
	});

	async function loadH2H() {
		loading = true;
		try {
			const res = await get(`/v1/stats/${playerId}`);
			data = res.data;
		} catch (err) {
			console.error("Failed to load H2H:", err);
		} finally {
			loading = false;
		}
	}

	/** Calculate visual bar percentages */
	const userPct = $derived(
		data?.total_games > 0
			? Math.round((data.user_wins / data.total_games) * 100)
			: 0,
	);
	const opponentPct = $derived(
		data?.total_games > 0
			? Math.round((data.opponent_wins / data.total_games) * 100)
			: 0,
	);
	const drawPct = $derived(100 - userPct - opponentPct);
</script>

<!-- Backdrop -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="fixed inset-0 bg-black/60 z-50 flex items-end justify-center"
	onmousedown={(e) => { if (e.target === e.currentTarget) onClose(); }}
	onkeydown={(e) => e.key === "Escape" && onClose()}
>
	<!-- Modal Sheet -->
	<div class="bg-bg-primary border-t border-border rounded-t-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto p-5">
		{#if loading}
			<div class="flex justify-center py-8">
				<div class="animate-spin h-8 w-8 border-2 border-accent-red border-t-transparent rounded-full"></div>
			</div>
		{:else if data}
			<!-- Opponent Header -->
			<div class="flex items-center gap-3 mb-5">
				{#if data.opponent.avatar_url}
					<img
						src={data.opponent.avatar_url}
						alt={data.opponent.username}
						class="w-12 h-12 rounded-full object-cover ring-2 ring-border"
					/>
				{:else}
					<div class="w-12 h-12 rounded-full bg-bg-secondary ring-2 ring-border flex items-center justify-center text-lg font-bold text-text-secondary">
						{(data.opponent.username || "?").charAt(0).toUpperCase()}
					</div>
				{/if}
				<div>
					<h2 class="text-lg font-bold text-text-primary">{$t("h2h.title")}</h2>
					<p class="text-sm text-text-secondary">{data.opponent.username}</p>
				</div>
			</div>

			<!-- Record Bar -->
			{#if data.total_games > 0}
				<div class="flex h-3 rounded-full overflow-hidden mb-4">
					{#if userPct > 0}
						<div class="bg-success" style="width: {userPct}%"></div>
					{/if}
					{#if drawPct > 0}
						<div class="bg-warning" style="width: {drawPct}%"></div>
					{/if}
					{#if opponentPct > 0}
						<div class="bg-error" style="width: {opponentPct}%"></div>
					{/if}
				</div>
			{/if}

			<!-- Stats Grid -->
			<div class="grid grid-cols-4 gap-2 mb-5">
				<div class="bg-bg-secondary border border-border rounded-lg p-3 text-center">
					<span class="text-xl font-bold text-text-primary">{data.total_games}</span>
					<p class="text-[10px] text-text-secondary mt-0.5">{$t("h2h.total_games")}</p>
				</div>
				<div class="bg-bg-secondary border border-border rounded-lg p-3 text-center">
					<span class="text-xl font-bold text-success">{data.user_wins}</span>
					<p class="text-[10px] text-text-secondary mt-0.5">{$t("h2h.your_wins")}</p>
				</div>
				<div class="bg-bg-secondary border border-border rounded-lg p-3 text-center">
					<span class="text-xl font-bold text-warning">{data.draws}</span>
					<p class="text-[10px] text-text-secondary mt-0.5">{$t("h2h.draws")}</p>
				</div>
				<div class="bg-bg-secondary border border-border rounded-lg p-3 text-center">
					<span class="text-xl font-bold text-error">{data.opponent_wins}</span>
					<p class="text-[10px] text-text-secondary mt-0.5">{$t("h2h.their_wins")}</p>
				</div>
			</div>

			<!-- Recent Games -->
			{#if data.recent_games?.length > 0}
				<h3 class="text-sm font-bold text-text-primary mb-2">{$t("h2h.recent_games")}</h3>
				<div class="flex flex-col gap-2">
					{#each data.recent_games as game (game.id)}
						<GameCard {game} />
					{/each}
				</div>
			{:else}
				<p class="text-text-secondary text-sm text-center">{$t("h2h.no_games")}</p>
			{/if}

			<!-- Close Button -->
			<button
				type="button"
				onclick={onClose}
				class="w-full mt-5 py-2.5 text-sm font-medium text-text-secondary border border-border rounded-lg hover:bg-bg-secondary transition-colors"
			>
				{$t("h2h.close")}
			</button>
		{/if}
	</div>
</div>
