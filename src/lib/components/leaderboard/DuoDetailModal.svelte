<script>
import { getTranslate } from "@tolgee/svelte";
import GameCard from "$lib/components/dashboard/GameCard.svelte";
import { get } from "$lib/services/api.services.js";

/**
 * DuoDetailModal - Bottom-sheet overlay showing duo stats
 * @param {string} player1Id - First player ID
 * @param {string} player2Id - Second player ID
 * @param {Function} onClose - Close handler
 */
let { player1Id, player2Id, onClose } = $props();

const { t } = getTranslate();

let data = $state(null);
let loading = $state(true);

$effect(() => {
	if (player1Id && player2Id) loadDuoDetail();
});

async function loadDuoDetail() {
	loading = true;
	try {
		const res = await get(`/v1/duos/${player1Id}/${player2Id}`);
		data = res.data;
	} catch (err) {
		console.error("Failed to load duo detail:", err);
	} finally {
		loading = false;
	}
}

/** Visual bar percentages */
const winPct = $derived(
	data?.total_games > 0
		? Math.round((data.wins / data.total_games) * 100)
		: 0,
);
const lossPct = $derived(
	data?.total_games > 0
		? Math.round((data.losses / data.total_games) * 100)
		: 0,
);
const drawPct = $derived(100 - winPct - lossPct);

/** Streak display text */
const streakText = $derived.by(() => {
	if (!data?.streak) return null;
	const { type, count } = data.streak;
	if (count === 1) {
		if (type === "win") return $t("duos.streak_win_single");
		if (type === "loss") return $t("duos.streak_loss_single");
		return $t("duos.streak_draw");
	}
	if (type === "win") return $t("duos.streak_win", { count });
	if (type === "loss") return $t("duos.streak_loss", { count });
	return $t("duos.streak_draw");
});

const streakEmoji = $derived(
	data?.streak?.type === "win" ? "\u{1F525}" : data?.streak?.type === "loss" ? "\u{1F976}" : "\u{1F91D}",
);
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
			<!-- Duo Header -->
			<div class="flex items-center justify-center gap-3 mb-5">
				<div class="flex -space-x-3">
					{#if data.player1.avatar_url}
						<img
							src={data.player1.avatar_url}
							alt={data.player1.username}
							class="w-12 h-12 rounded-full object-cover ring-2 ring-bg-primary"
						/>
					{:else}
						<div class="w-12 h-12 rounded-full bg-bg-secondary ring-2 ring-bg-primary flex items-center justify-center text-lg font-bold text-text-secondary">
							{(data.player1.username || "?").charAt(0).toUpperCase()}
						</div>
					{/if}
					{#if data.player2.avatar_url}
						<img
							src={data.player2.avatar_url}
							alt={data.player2.username}
							class="w-12 h-12 rounded-full object-cover ring-2 ring-bg-primary"
						/>
					{:else}
						<div class="w-12 h-12 rounded-full bg-bg-secondary ring-2 ring-bg-primary flex items-center justify-center text-lg font-bold text-text-secondary">
							{(data.player2.username || "?").charAt(0).toUpperCase()}
						</div>
					{/if}
				</div>
				<div>
					<h2 class="text-lg font-bold text-text-primary">{$t("duos.title")}</h2>
					<p class="text-sm text-text-secondary">{data.player1.username} {$t("duos.and")} {data.player2.username}</p>
				</div>
			</div>

			<!-- Record Bar -->
			{#if data.total_games > 0}
				<div class="flex h-3 rounded-full overflow-hidden mb-4">
					{#if winPct > 0}
						<div class="bg-success" style="width: {winPct}%"></div>
					{/if}
					{#if drawPct > 0}
						<div class="bg-warning" style="width: {drawPct}%"></div>
					{/if}
					{#if lossPct > 0}
						<div class="bg-error" style="width: {lossPct}%"></div>
					{/if}
				</div>
			{/if}

			<!-- Streak -->
			{#if streakText}
				<p class="text-xs text-center text-text-secondary mb-4">
					<span>{streakEmoji}</span>
					<span class="font-medium">{streakText}</span>
				</p>
			{/if}

			<!-- Stats Grid -->
			<div class="grid grid-cols-4 gap-2 mb-5">
				<div class="bg-bg-secondary border border-border rounded-lg p-3 text-center">
					<span class="text-xl font-bold text-text-primary">{data.total_games}</span>
					<p class="text-[10px] text-text-secondary mt-0.5">{$t("duos.total_games")}</p>
				</div>
				<div class="bg-bg-secondary border border-border rounded-lg p-3 text-center">
					<span class="text-xl font-bold text-success">{data.wins}</span>
					<p class="text-[10px] text-text-secondary mt-0.5">{$t("duos.wins")}</p>
				</div>
				<div class="bg-bg-secondary border border-border rounded-lg p-3 text-center">
					<span class="text-xl font-bold text-warning">{data.draws}</span>
					<p class="text-[10px] text-text-secondary mt-0.5">{$t("duos.draws")}</p>
				</div>
				<div class="bg-bg-secondary border border-border rounded-lg p-3 text-center">
					<span class="text-xl font-bold text-error">{data.losses}</span>
					<p class="text-[10px] text-text-secondary mt-0.5">{$t("duos.losses")}</p>
				</div>
			</div>

			<!-- Trend Dots -->
			{#if data.trend?.length > 0}
				<div class="mb-5">
					<h3 class="text-xs font-medium text-text-secondary mb-2">{$t("duos.trend_title")}</h3>
					<div class="flex gap-1.5 flex-wrap">
						{#each data.trend as entry, i (i)}
							<span
								class="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white
									{entry.result === 'W' ? 'bg-success' : entry.result === 'D' ? 'bg-warning' : 'bg-error'}"
								title={new Date(entry.played_at).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })}
							>
								{entry.result}
							</span>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Average Match Stats -->
			{#if data.avg_match_stats}
				<div class="mb-5">
					<h3 class="text-xs font-medium text-text-secondary mb-2">
						{$t("duos.avg_stats_title")}
						<span class="text-[10px] font-normal">({data.avg_match_stats.games_with_stats} {$t("duos.total_games")})</span>
					</h3>
					<div class="grid grid-cols-2 gap-2">
						<div class="bg-bg-secondary border border-border rounded-lg p-3 text-center">
							<span class="text-lg font-bold text-text-primary">{data.avg_match_stats.avg_possession}%</span>
							<p class="text-[10px] text-text-secondary mt-0.5">{$t("duos.possession")}</p>
						</div>
						<div class="bg-bg-secondary border border-border rounded-lg p-3 text-center">
							<span class="text-lg font-bold text-text-primary">{data.avg_match_stats.avg_pass_accuracy}%</span>
							<p class="text-[10px] text-text-secondary mt-0.5">{$t("duos.pass_accuracy")}</p>
						</div>
						{#if data.avg_match_stats.avg_xg_per_game != null}
							<div class="bg-bg-secondary border border-border rounded-lg p-3 text-center">
								<span class="text-lg font-bold text-text-primary">{data.avg_match_stats.avg_xg_per_game}</span>
								<p class="text-[10px] text-text-secondary mt-0.5">{$t("duos.xg")}</p>
							</div>
						{/if}
						<div class="bg-bg-secondary border border-border rounded-lg p-3 text-center">
							<span class="text-lg font-bold text-text-primary">{data.avg_match_stats.avg_shot_accuracy}%</span>
							<p class="text-[10px] text-text-secondary mt-0.5">{$t("duos.shot_accuracy")}</p>
						</div>
					</div>
				</div>
			{/if}

			<!-- Duo vs Duo H2H -->
			{#if data.opponent_duos?.length > 0}
				<div class="mb-5">
					<h3 class="text-xs font-medium text-text-secondary mb-2">{$t("duos.opponent_duos_title")}</h3>
					<div class="flex flex-col gap-1.5">
						{#each data.opponent_duos as opp (opp.player1.player_id + opp.player2.player_id)}
							<div class="flex items-center justify-between bg-bg-secondary border border-border rounded-lg px-3 py-2">
								<div class="flex items-center gap-2 min-w-0">
									<div class="flex -space-x-2 shrink-0">
										{#if opp.player1.avatar_url}
											<img src={opp.player1.avatar_url} alt="" class="w-6 h-6 rounded-full object-cover ring-1 ring-bg-primary" />
										{:else}
											<div class="w-6 h-6 rounded-full bg-bg-input ring-1 ring-bg-primary flex items-center justify-center text-[10px] font-bold text-text-secondary">
												{(opp.player1.username || "?").charAt(0).toUpperCase()}
											</div>
										{/if}
										{#if opp.player2.avatar_url}
											<img src={opp.player2.avatar_url} alt="" class="w-6 h-6 rounded-full object-cover ring-1 ring-bg-primary" />
										{:else}
											<div class="w-6 h-6 rounded-full bg-bg-input ring-1 ring-bg-primary flex items-center justify-center text-[10px] font-bold text-text-secondary">
												{(opp.player2.username || "?").charAt(0).toUpperCase()}
											</div>
										{/if}
									</div>
									<span class="text-xs font-medium text-text-primary truncate">
										{opp.player1.username} {$t("duos.and")} {opp.player2.username}
									</span>
								</div>
								<div class="flex items-center gap-2 shrink-0">
									<span class="text-[10px] text-text-secondary">
										{opp.wins}W · {opp.draws}D · {opp.losses}L
									</span>
									<span class="text-xs font-medium text-text-primary">{opp.games}</span>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Recent Games -->
			{#if data.recent_games?.length > 0}
				<h3 class="text-sm font-bold text-text-primary mb-2">{$t("duos.recent_games")}</h3>
				<div class="flex flex-col gap-2">
					{#each data.recent_games as game (game.id)}
						<GameCard {game} />
					{/each}
				</div>
			{:else}
				<p class="text-text-secondary text-sm text-center">{$t("duos.no_games")}</p>
			{/if}

			<!-- Close Button -->
			<button
				type="button"
				onclick={onClose}
				class="w-full mt-5 py-2.5 text-sm font-medium text-text-secondary border border-border rounded-lg hover:bg-bg-secondary transition-colors"
			>
				{$t("duos.close")}
			</button>
		{/if}
	</div>
</div>
