<script>
import { getTranslate } from "@tolgee/svelte";
import { get } from "$lib/services/api.services.js";

const { t } = getTranslate();

/** @type {Array<{id: string, week_start: string, week_end: string, generated_at: string, payload: object}>} */
let wraps = $state([]);
let currentIndex = $state(0);
let loading = $state(true);
let error = $state(false);

const current = $derived(wraps[currentIndex] || null);
const hasPrev = $derived(currentIndex < wraps.length - 1);
const hasNext = $derived(currentIndex > 0);

$effect(() => {
	loadWraps();
});

async function loadWraps() {
	loading = true;
	error = false;
	try {
		const res = await get("/v1/wrapped");
		wraps = res.data || [];
		currentIndex = 0;
	} catch (err) {
		console.error("Failed to load wrapped:", err);
		error = true;
	} finally {
		loading = false;
	}
}

function showPrev() {
	if (hasPrev) currentIndex += 1;
}

function showNext() {
	if (hasNext) currentIndex -= 1;
}

/**
 * Format an ISO date (YYYY-MM-DD) as a localized short date
 * @param {string} iso
 */
function formatDate(iso) {
	if (!iso) return "";
	return new Date(iso).toLocaleDateString("de-DE", {
		day: "2-digit",
		month: "short",
	});
}
</script>

<div class="flex flex-col gap-4 pb-24">
	<header class="text-center pt-6">
		<p class="text-xs uppercase tracking-widest text-text-secondary">
			{$t("wrapped.subtitle")}
		</p>
		<h1 class="text-3xl font-bold text-text-primary mt-1">
			{$t("wrapped.title")}
		</h1>
	</header>

	{#if loading}
		<div class="text-center text-text-secondary py-12">{$t("common.loading")}</div>
	{:else if error || wraps.length === 0}
		<div class="bg-bg-secondary border border-border rounded-2xl p-8 text-center mx-4">
			<p class="text-4xl mb-3">📭</p>
			<p class="text-sm text-text-primary font-medium mb-1">{$t("wrapped.empty_title")}</p>
			<p class="text-xs text-text-secondary">{$t("wrapped.empty_subtitle")}</p>
		</div>
	{:else if current}
		{@const p = current.payload}

		<!-- Week navigation -->
		<div class="flex items-center justify-between gap-2 px-4">
			<button
				type="button"
				onclick={showPrev}
				disabled={!hasPrev}
				class="flex items-center justify-center w-10 h-10 rounded-full bg-bg-secondary border border-border text-text-primary disabled:opacity-30 disabled:cursor-not-allowed hover:bg-bg-input transition-colors"
				aria-label={$t("wrapped.prev_week")}
			>
				<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<polyline points="15 18 9 12 15 6"></polyline>
				</svg>
			</button>

			<div class="flex-1 text-center">
				<p class="text-sm font-medium text-text-primary">
					{formatDate(current.week_start)} – {formatDate(current.week_end)}
				</p>
				{#if currentIndex === 0}
					<p class="text-[10px] uppercase tracking-widest text-accent-red font-bold mt-0.5">
						{$t("wrapped.latest_label")}
					</p>
				{:else}
					<p class="text-[10px] text-text-secondary mt-0.5">
						{$t("wrapped.archive_position", { current: currentIndex + 1, total: wraps.length })}
					</p>
				{/if}
			</div>

			<button
				type="button"
				onclick={showNext}
				disabled={!hasNext}
				class="flex items-center justify-center w-10 h-10 rounded-full bg-bg-secondary border border-border text-text-primary disabled:opacity-30 disabled:cursor-not-allowed hover:bg-bg-input transition-colors"
				aria-label={$t("wrapped.next_week")}
			>
				<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<polyline points="9 18 15 12 9 6"></polyline>
				</svg>
			</button>
		</div>

		<!-- Hero stat: total games + goals -->
		<div class="bg-gradient-to-br from-accent-red to-accent-red/60 rounded-2xl p-6 mx-4 text-white">
			<p class="text-xs uppercase tracking-widest opacity-80">{$t("wrapped.this_week")}</p>
			<div class="grid grid-cols-2 gap-4 mt-3">
				<div>
					<p class="text-5xl font-black">{p.total_games}</p>
					<p class="text-xs uppercase tracking-wider opacity-90">{$t("wrapped.games")}</p>
				</div>
				<div>
					<p class="text-5xl font-black">{p.total_goals}</p>
					<p class="text-xs uppercase tracking-wider opacity-90">{$t("wrapped.goals")}</p>
				</div>
			</div>
		</div>

		<!-- MVP -->
		{#if p.mvp}
			<div class="bg-bg-secondary border border-border rounded-2xl p-5 mx-4">
				<p class="text-[10px] uppercase tracking-widest text-warning font-bold mb-2">
					🏆 {$t("wrapped.mvp_title")}
				</p>
				<div class="flex items-center gap-3">
					{#if p.mvp.avatar_url}
						<img src={p.mvp.avatar_url} alt={p.mvp.username} class="w-14 h-14 rounded-full object-cover ring-2 ring-warning" />
					{:else}
						<div class="w-14 h-14 rounded-full bg-warning/20 ring-2 ring-warning flex items-center justify-center text-xl font-bold text-text-primary">
							{(p.mvp.username || "?").charAt(0).toUpperCase()}
						</div>
					{/if}
					<div class="flex-1 min-w-0">
						<p class="text-lg font-bold text-text-primary truncate">{p.mvp.username}</p>
						<p class="text-xs text-text-secondary">{$t("wrapped.mvp_subtitle", { count: p.mvp.wins })}</p>
					</div>
				</div>
			</div>
		{/if}

		<!-- Topscorer -->
		{#if p.topscorer}
			<div class="bg-bg-secondary border border-border rounded-2xl p-5 mx-4">
				<p class="text-[10px] uppercase tracking-widest text-accent-red font-bold mb-2">
					⚽ {$t("wrapped.topscorer_title")}
				</p>
				<div class="flex items-center gap-3">
					{#if p.topscorer.avatar_url}
						<img src={p.topscorer.avatar_url} alt={p.topscorer.username} class="w-14 h-14 rounded-full object-cover ring-2 ring-accent-red" />
					{:else}
						<div class="w-14 h-14 rounded-full bg-accent-red/20 ring-2 ring-accent-red flex items-center justify-center text-xl font-bold text-text-primary">
							{(p.topscorer.username || "?").charAt(0).toUpperCase()}
						</div>
					{/if}
					<div class="flex-1 min-w-0">
						<p class="text-lg font-bold text-text-primary truncate">{p.topscorer.username}</p>
						<p class="text-xs text-text-secondary">{$t("wrapped.topscorer_subtitle", { count: p.topscorer.goals })}</p>
					</div>
				</div>
			</div>
		{/if}

		<!-- Most Active -->
		{#if p.most_active}
			<div class="bg-bg-secondary border border-border rounded-2xl p-5 mx-4">
				<p class="text-[10px] uppercase tracking-widest text-blue-500 font-bold mb-2">
					🏃 {$t("wrapped.most_active_title")}
				</p>
				<div class="flex items-center gap-3">
					{#if p.most_active.avatar_url}
						<img src={p.most_active.avatar_url} alt={p.most_active.username} class="w-14 h-14 rounded-full object-cover ring-2 ring-blue-500" />
					{:else}
						<div class="w-14 h-14 rounded-full bg-blue-500/20 ring-2 ring-blue-500 flex items-center justify-center text-xl font-bold text-text-primary">
							{(p.most_active.username || "?").charAt(0).toUpperCase()}
						</div>
					{/if}
					<div class="flex-1 min-w-0">
						<p class="text-lg font-bold text-text-primary truncate">{p.most_active.username}</p>
						<p class="text-xs text-text-secondary">{$t("wrapped.most_active_subtitle", { count: p.most_active.games_played })}</p>
					</div>
				</div>
			</div>
		{/if}

		<!-- Top Duo -->
		{#if p.top_duo && p.top_duo.players.length === 2}
			<div class="bg-bg-secondary border border-border rounded-2xl p-5 mx-4">
				<p class="text-[10px] uppercase tracking-widest text-success font-bold mb-3">
					🤝 {$t("wrapped.top_duo_title")}
				</p>
				<div class="flex items-center gap-3">
					<div class="flex -space-x-3">
						{#each p.top_duo.players as player (player.id)}
							{#if player.avatar_url}
								<img src={player.avatar_url} alt={player.username} class="w-12 h-12 rounded-full object-cover ring-2 ring-success" />
							{:else}
								<div class="w-12 h-12 rounded-full bg-success/20 ring-2 ring-success flex items-center justify-center text-base font-bold text-text-primary">
									{(player.username || "?").charAt(0).toUpperCase()}
								</div>
							{/if}
						{/each}
					</div>
					<div class="flex-1 min-w-0">
						<p class="text-sm font-bold text-text-primary truncate">
							{p.top_duo.players[0].username} & {p.top_duo.players[1].username}
						</p>
						<p class="text-xs text-text-secondary">
							{$t("wrapped.top_duo_subtitle", {
								wins: p.top_duo.wins,
								games: p.top_duo.games,
								rate: Math.round(p.top_duo.win_rate * 100),
							})}
						</p>
					</div>
				</div>
			</div>
		{/if}
	{/if}
</div>
