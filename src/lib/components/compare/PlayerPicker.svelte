<script>
import { getTranslate } from "@tolgee/svelte";

let {
	players = [],
	selected = $bindable(null),
	excludeId = null,
	label = "",
} = $props();

const { t } = getTranslate();

let open = $state(false);
let search = $state("");

const filteredPlayers = $derived.by(() => {
	let list = players;
	if (excludeId) {
		list = list.filter((p) => p.id !== excludeId);
	}
	if (search.trim()) {
		const q = search.trim().toLowerCase();
		list = list.filter((p) => p.username?.toLowerCase().includes(q));
	}
	return list;
});

const selectedPlayer = $derived(
	selected ? players.find((p) => p.id === selected) : null,
);

function select(playerId) {
	selected = playerId;
	open = false;
	search = "";
}

function handleBackdropClick(e) {
	if (e.target === e.currentTarget) {
		open = false;
		search = "";
	}
}

function handleKeydown(e) {
	if (e.key === "Escape") {
		open = false;
		search = "";
	}
}
</script>

<svelte:window onkeydown={open ? handleKeydown : undefined} />

<div class="flex flex-col gap-1">
	{#if label}
		<span class="text-xs text-text-secondary font-medium">{label}</span>
	{/if}

	<button
		type="button"
		onclick={() => (open = true)}
		class="flex items-center gap-2.5 bg-bg-secondary border border-border rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-bg-input"
	>
		{#if selectedPlayer}
			{#if selectedPlayer.avatar_url}
				<img
					src={selectedPlayer.avatar_url}
					alt={selectedPlayer.username}
					class="w-8 h-8 rounded-full object-cover ring-1 ring-border shrink-0"
				/>
			{:else}
				<div
					class="w-8 h-8 rounded-full bg-bg-input flex items-center justify-center text-sm font-bold text-text-primary ring-1 ring-border shrink-0"
				>
					{selectedPlayer.username?.charAt(0)?.toUpperCase() || "?"}
				</div>
			{/if}
			<span class="text-sm font-medium text-text-primary truncate">{selectedPlayer.username}</span>
		{:else}
			<div
				class="w-8 h-8 rounded-full bg-bg-input flex items-center justify-center text-text-secondary ring-1 ring-border shrink-0"
			>
				<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
				</svg>
			</div>
			<span class="text-sm text-text-secondary">{$t("compare.select_player")}</span>
		{/if}
	</button>
</div>

{#if open}
	<!-- Dropdown Overlay -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
		onclick={handleBackdropClick}
	>
		<div class="bg-bg-primary w-full max-w-lg rounded-t-2xl border-t border-border max-h-[70vh] flex flex-col">
			<!-- Search -->
			<div class="p-3 border-b border-border">
				<input
					type="text"
					bind:value={search}
					placeholder={$t("compare.search_placeholder")}
					class="w-full bg-bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-1 focus:ring-accent-red"
				/>
			</div>

			<!-- Player List -->
			<div class="overflow-y-auto flex-1">
				{#each filteredPlayers as player (player.id)}
					<button
						type="button"
						onclick={() => select(player.id)}
						class="flex items-center gap-3 w-full px-4 py-3 text-left transition-colors hover:bg-bg-secondary
							{player.id === selected ? 'bg-accent-red/5' : ''}"
					>
						{#if player.avatar_url}
							<img
								src={player.avatar_url}
								alt={player.username}
								class="w-9 h-9 rounded-full object-cover ring-1 ring-border shrink-0"
							/>
						{:else}
							<div
								class="w-9 h-9 rounded-full bg-bg-input flex items-center justify-center text-sm font-bold text-text-secondary ring-1 ring-border shrink-0"
							>
								{player.username?.charAt(0)?.toUpperCase() || "?"}
							</div>
						{/if}
						<span class="text-sm font-medium text-text-primary truncate">{player.username}</span>
						{#if player.id === selected}
							<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-accent-red ml-auto shrink-0" viewBox="0 0 20 20" fill="currentColor">
								<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
							</svg>
						{/if}
					</button>
				{/each}
				{#if filteredPlayers.length === 0}
					<p class="text-sm text-text-secondary text-center py-6">{$t("leaderboard.no_data")}</p>
				{/if}
			</div>
		</div>
	</div>
{/if}
