<script>
import { getTranslate } from "@tolgee/svelte";
import { page } from "$app/state";
import PlayerPicker from "$lib/components/compare/PlayerPicker.svelte";
import SeasonSelector from "$lib/components/season/SeasonSelector.svelte";
import { get } from "$lib/services/api.services.js";
import { selectedSeason } from "$lib/stores/season.stores.js";

const { t } = getTranslate();

// Mode toggle
let mode = $state(
	page.url.searchParams.get("mode") === "duos" ? "duos" : "players",
);

// Shared state
let players = $state([]);
let loading = $state(false);
let playersLoading = $state(true);

// Player compare state
let player1Id = $state(page.url.searchParams.get("p1") || null);
let player2Id = $state(page.url.searchParams.get("p2") || null);
let comparison = $state(null);

// Duo compare state
let duo1Player1Id = $state(page.url.searchParams.get("d1a") || null);
let duo1Player2Id = $state(page.url.searchParams.get("d1b") || null);
let duo2Player1Id = $state(page.url.searchParams.get("d2a") || null);
let duo2Player2Id = $state(page.url.searchParams.get("d2b") || null);
let duoComparison = $state(null);

// Load player list
$effect(() => {
	let aborted = false;

	(async () => {
		try {
			const res = await get("/v1/players");
			if (aborted) return;
			players = res.data || [];
		} catch (err) {
			if (aborted) return;
			console.error("Failed to load players:", err);
		} finally {
			if (!aborted) playersLoading = false;
		}
	})();

	return () => {
		aborted = true;
	};
});

// Load player comparison when both players selected
$effect(() => {
	const p1 = player1Id;
	const p2 = player2Id;
	const season = $selectedSeason;
	const m = mode;
	let aborted = false;

	if (m !== "players" || !p1 || !p2 || p1 === p2) {
		if (m === "players") comparison = null;
		return;
	}

	const url = new URL(window.location.href);
	url.searchParams.set("p1", p1);
	url.searchParams.set("p2", p2);
	url.searchParams.delete("mode");
	url.searchParams.delete("d1a");
	url.searchParams.delete("d1b");
	url.searchParams.delete("d2a");
	url.searchParams.delete("d2b");
	history.replaceState({}, "", url.pathname + url.search);

	loadComparison(p1, p2, season);

	return () => {
		aborted = true;
	};

	async function loadComparison(id1, id2, s) {
		loading = true;
		try {
			let endpoint = `/v1/compare/${id1}/${id2}`;
			if (s !== "all") endpoint += `?season=${s}`;
			const res = await get(endpoint);
			if (aborted) return;
			comparison = res.data || null;
		} catch (err) {
			if (aborted) return;
			console.error("Failed to load comparison:", err);
		} finally {
			if (!aborted) loading = false;
		}
	}
});

// Load duo comparison when all 4 players selected
$effect(() => {
	const d1a = duo1Player1Id;
	const d1b = duo1Player2Id;
	const d2a = duo2Player1Id;
	const d2b = duo2Player2Id;
	const m = mode;
	let aborted = false;

	if (
		m !== "duos" ||
		!d1a ||
		!d1b ||
		!d2a ||
		!d2b ||
		d1a === d1b ||
		d2a === d2b
	) {
		if (m === "duos") duoComparison = null;
		return;
	}

	const url = new URL(window.location.href);
	url.searchParams.set("mode", "duos");
	url.searchParams.set("d1a", d1a);
	url.searchParams.set("d1b", d1b);
	url.searchParams.set("d2a", d2a);
	url.searchParams.set("d2b", d2b);
	url.searchParams.delete("p1");
	url.searchParams.delete("p2");
	history.replaceState({}, "", url.pathname + url.search);

	loadDuoComparison(d1a, d1b, d2a, d2b);

	return () => {
		aborted = true;
	};

	async function loadDuoComparison(a1, a2, b1, b2) {
		loading = true;
		try {
			const [res1, res2] = await Promise.all([
				get(`/v1/duos/${a1}/${a2}`),
				get(`/v1/duos/${b1}/${b2}`),
			]);
			if (aborted) return;
			duoComparison = {
				duo1: res1.data || null,
				duo2: res2.data || null,
			};
		} catch (err) {
			if (aborted) return;
			console.error("Failed to load duo comparison:", err);
		} finally {
			if (!aborted) loading = false;
		}
	}
});

// Player compare derived values
const p1 = $derived(comparison?.player1);
const p2 = $derived(comparison?.player2);
const h2h = $derived(comparison?.h2h);
const s1 = $derived(p1?.stats);
const s2 = $derived(p2?.stats);

// Duo compare derived values
const d1 = $derived(duoComparison?.duo1);
const d2 = $derived(duoComparison?.duo2);

const duoWinRate1 = $derived(
	d1?.total_games > 0 ? Math.round((d1.wins / d1.total_games) * 100) : 0,
);
const duoWinRate2 = $derived(
	d2?.total_games > 0 ? Math.round((d2.wins / d2.total_games) * 100) : 0,
);

// Find H2H between duo1 and duo2 in opponent_duos
const duoH2H = $derived.by(() => {
	if (!d1?.opponent_duos || !duo2Player1Id || !duo2Player2Id) return null;
	const targetIds = [duo2Player1Id, duo2Player2Id].sort();
	return (
		d1.opponent_duos.find((opp) => {
			const oppIds = [opp.player1.player_id, opp.player2.player_id].sort();
			return oppIds[0] === targetIds[0] && oppIds[1] === targetIds[1];
		}) || null
	);
});

/**
 * Highlight class for the higher value
 * @param {number} a
 * @param {number} b
 * @param {"left"|"right"} side
 * @returns {string}
 */
function highlightClass(a, b, side) {
	if (a === b) return "text-text-primary";
	if (side === "left") return a > b ? "text-success" : "text-text-primary";
	return b > a ? "text-success" : "text-text-primary";
}

/**
 * Calculate bar width percentage for comparison bars
 * @param {number} a
 * @param {number} b
 * @returns {{ leftPct: number, rightPct: number }}
 */
function barWidths(a, b) {
	if (a === 0 && b === 0) return { leftPct: 50, rightPct: 50 };
	const max = Math.max(a, b);
	if (max === 0) return { leftPct: 50, rightPct: 50 };
	return {
		leftPct: Math.round((a / max) * 100),
		rightPct: Math.round((b / max) * 100),
	};
}

/**
 * Streak display text
 * @param {{ type: string, count: number } | null} streak
 * @returns {string}
 */
function streakDisplay(streak) {
	if (!streak) return "";
	const { type, count } = streak;
	const emoji =
		type === "win" ? "\u{1F525}" : type === "loss" ? "\u{1F976}" : "\u{1F91D}";
	return `${emoji} ${count}${type === "win" ? "W" : type === "loss" ? "L" : "D"}`;
}
</script>

<svelte:head>
	<title>RasenBürosport - {mode === "duos" ? $t("compare.duo_title") : $t("compare.title")}</title>
</svelte:head>

<div class="flex flex-col gap-4 pb-4">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<h1 class="text-xl font-bold text-text-primary">
			{mode === "duos" ? $t("compare.duo_title") : $t("compare.title")}
		</h1>
		<div class="flex items-center gap-2">
			<!-- Mode Toggle -->
			<div class="flex bg-bg-secondary border border-border rounded-lg overflow-hidden">
				<button
					type="button"
					onclick={() => { mode = "players"; }}
					class="px-3 py-1.5 text-xs font-medium transition-colors {mode === 'players' ? 'bg-accent-red text-white' : 'text-text-secondary hover:text-text-primary'}"
				>
					{$t("compare.mode_players")}
				</button>
				<button
					type="button"
					onclick={() => { mode = "duos"; }}
					class="px-3 py-1.5 text-xs font-medium transition-colors {mode === 'duos' ? 'bg-accent-red text-white' : 'text-text-secondary hover:text-text-primary'}"
				>
					{$t("compare.mode_duos")}
				</button>
			</div>
			{#if mode === "players"}
				<SeasonSelector />
			{/if}
		</div>
	</div>

	{#if mode === "players"}
		<!-- ============ PLAYER COMPARE ============ -->

		<!-- Player Pickers -->
		<div class="grid grid-cols-2 gap-3">
			<PlayerPicker
				{players}
				bind:selected={player1Id}
				excludeId={player2Id}
			/>
			<PlayerPicker
				{players}
				bind:selected={player2Id}
				excludeId={player1Id}
			/>
		</div>

		{#if !player1Id || !player2Id}
			<p class="text-sm text-text-secondary text-center py-8">
				{$t("compare.select_two")}
			</p>
		{:else if loading}
			<div class="flex justify-center py-8">
				<div class="animate-spin h-8 w-8 border-2 border-accent-red border-t-transparent rounded-full"></div>
			</div>
		{:else if comparison && s1 && s2}
			<!-- Player Header with VS -->
			<div class="flex items-center justify-center gap-4 py-2">
				<div class="flex flex-col items-center gap-1 flex-1">
					{#if p1.avatar_url}
						<img src={p1.avatar_url} alt={p1.username} class="w-14 h-14 rounded-full object-cover ring-2 ring-border" />
					{:else}
						<div class="w-14 h-14 rounded-full bg-bg-input flex items-center justify-center text-lg font-bold text-text-primary ring-2 ring-border">
							{p1.username?.charAt(0)?.toUpperCase() || "?"}
						</div>
					{/if}
					<span class="text-sm font-semibold text-text-primary truncate max-w-[120px]">{p1.username}</span>
				</div>

				<span class="text-lg font-bold text-text-secondary">{$t("compare.vs")}</span>

				<div class="flex flex-col items-center gap-1 flex-1">
					{#if p2.avatar_url}
						<img src={p2.avatar_url} alt={p2.username} class="w-14 h-14 rounded-full object-cover ring-2 ring-border" />
					{:else}
						<div class="w-14 h-14 rounded-full bg-bg-input flex items-center justify-center text-lg font-bold text-text-primary ring-2 ring-border">
							{p2.username?.charAt(0)?.toUpperCase() || "?"}
						</div>
					{/if}
					<span class="text-sm font-semibold text-text-primary truncate max-w-[120px]">{p2.username}</span>
				</div>
			</div>

			<!-- Overview Stats -->
			<div class="bg-bg-secondary border border-border rounded-lg p-4">
				<div class="flex flex-col gap-3">
					{#each [
						{ label: $t("compare.games"), v1: s1.total_games, v2: s2.total_games },
						{ label: $t("compare.wins"), v1: s1.wins, v2: s2.wins },
						{ label: $t("compare.losses"), v1: s1.losses, v2: s2.losses },
						{ label: $t("compare.win_rate"), v1: s1.win_rate, v2: s2.win_rate, suffix: "%" },
					] as stat (stat.label)}
						<div class="grid grid-cols-3 items-center">
							<span class="text-sm font-bold {highlightClass(stat.v1, stat.v2, 'left')} text-right">
								{stat.v1}{stat.suffix || ""}
							</span>
							<span class="text-xs text-text-secondary text-center">{stat.label}</span>
							<span class="text-sm font-bold {highlightClass(stat.v1, stat.v2, 'right')}">
								{stat.v2}{stat.suffix || ""}
							</span>
						</div>
					{/each}
				</div>
			</div>

			<!-- Elo Comparison -->
			<div class="bg-bg-secondary border border-border rounded-lg p-4">
				<div class="flex flex-col gap-3">
					<div class="grid grid-cols-3 items-center">
						<span class="text-sm font-bold {highlightClass(s1.current_elo, s2.current_elo, 'left')} text-right">
							{s1.current_elo}
						</span>
						<span class="text-xs text-text-secondary text-center">{$t("compare.elo_current")}</span>
						<span class="text-sm font-bold {highlightClass(s1.current_elo, s2.current_elo, 'right')}">
							{s2.current_elo}
						</span>
					</div>
					<div class="grid grid-cols-3 items-center">
						<span class="text-sm font-bold {highlightClass(s1.peak_elo, s2.peak_elo, 'left')} text-right">
							{s1.peak_elo}
						</span>
						<span class="text-xs text-text-secondary text-center">{$t("compare.elo_peak")}</span>
						<span class="text-sm font-bold {highlightClass(s1.peak_elo, s2.peak_elo, 'right')}">
							{s2.peak_elo}
						</span>
					</div>
				</div>
			</div>

			<!-- Career Stats Bars -->
			{#if s1.career_match_stats || s2.career_match_stats}
				{@const cs1 = s1.career_match_stats || {}}
				{@const cs2 = s2.career_match_stats || {}}
				{@const careerStats = [
					{ label: $t("compare.possession"), v1: cs1.avg_possession || 0, v2: cs2.avg_possession || 0, suffix: "%" },
					{ label: $t("compare.pass_accuracy"), v1: cs1.avg_pass_accuracy || 0, v2: cs2.avg_pass_accuracy || 0, suffix: "%" },
					{ label: $t("compare.xg"), v1: cs1.avg_xg_per_game || 0, v2: cs2.avg_xg_per_game || 0 },
					{ label: $t("compare.shot_accuracy"), v1: cs1.avg_shot_accuracy || 0, v2: cs2.avg_shot_accuracy || 0, suffix: "%" },
					{ label: $t("compare.duels"), v1: cs1.avg_duels_won_rate || 0, v2: cs2.avg_duels_won_rate || 0, suffix: "%" },
				]}
				<div class="bg-bg-secondary border border-border rounded-lg p-4">
					<h3 class="text-sm font-medium text-text-secondary mb-3">{$t("compare.career_stats")}</h3>
					<div class="flex flex-col gap-3">
						{#each careerStats as stat (stat.label)}
							{@const bw = barWidths(stat.v1, stat.v2)}
							<div class="flex flex-col gap-1">
								<div class="grid grid-cols-3 items-center">
									<span class="text-xs font-medium {highlightClass(stat.v1, stat.v2, 'left')} text-right">
										{typeof stat.v1 === "number" && stat.v1 % 1 !== 0 ? stat.v1.toFixed(1) : stat.v1}{stat.suffix || ""}
									</span>
									<span class="text-[10px] text-text-secondary text-center">{stat.label}</span>
									<span class="text-xs font-medium {highlightClass(stat.v1, stat.v2, 'right')}">
										{typeof stat.v2 === "number" && stat.v2 % 1 !== 0 ? stat.v2.toFixed(1) : stat.v2}{stat.suffix || ""}
									</span>
								</div>
								<div class="flex gap-0.5 h-1.5">
									<div class="flex-1 flex justify-end">
										<div
											class="h-full rounded-l-full {stat.v1 >= stat.v2 ? 'bg-accent-red' : 'bg-border'}"
											style="width: {bw.leftPct}%"
										></div>
									</div>
									<div class="flex-1">
										<div
											class="h-full rounded-r-full {stat.v2 >= stat.v1 ? 'bg-accent-red' : 'bg-border'}"
											style="width: {bw.rightPct}%"
										></div>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Goals Comparison -->
			{@const goals1 = s1.total_individual_goals || 0}
			{@const goals2 = s2.total_individual_goals || 0}
			{@const gpg1 = s1.total_games > 0 ? +(goals1 / s1.total_games).toFixed(1) : 0}
			{@const gpg2 = s2.total_games > 0 ? +(goals2 / s2.total_games).toFixed(1) : 0}
			{#if goals1 > 0 || goals2 > 0}
				<div class="bg-bg-secondary border border-border rounded-lg p-4">
					<h3 class="text-sm font-medium text-text-secondary mb-3">{$t("compare.goals_title")}</h3>
					<div class="flex flex-col gap-3">
						<div class="grid grid-cols-3 items-center">
							<span class="text-sm font-bold {highlightClass(goals1, goals2, 'left')} text-right">{goals1}</span>
							<span class="text-xs text-text-secondary text-center">{$t("compare.goals_total")}</span>
							<span class="text-sm font-bold {highlightClass(goals1, goals2, 'right')}">{goals2}</span>
						</div>
						<div class="grid grid-cols-3 items-center">
							<span class="text-sm font-bold {highlightClass(gpg1, gpg2, 'left')} text-right">{gpg1}</span>
							<span class="text-xs text-text-secondary text-center">{$t("compare.goals_per_game")}</span>
							<span class="text-sm font-bold {highlightClass(gpg1, gpg2, 'right')}">{gpg2}</span>
						</div>
					</div>
				</div>
			{/if}

			<!-- Mode Bilanz -->
			<div class="bg-bg-secondary border border-border rounded-lg p-4">
				<h3 class="text-sm font-medium text-text-secondary mb-3">{$t("compare.mode_bilanz")}</h3>
				<div class="flex flex-col gap-3">
					<div class="grid grid-cols-3 items-center">
						<span class="text-xs font-medium text-text-primary text-right">
							{s1.bilanz_1v1.wins}S / {s1.bilanz_1v1.losses}N
						</span>
						<span class="text-xs text-text-secondary text-center">1v1</span>
						<span class="text-xs font-medium text-text-primary">
							{s2.bilanz_1v1.wins}S / {s2.bilanz_1v1.losses}N
						</span>
					</div>
					<div class="grid grid-cols-3 items-center">
						<span class="text-xs font-medium text-text-primary text-right">
							{s1.bilanz_2v2.wins}S / {s1.bilanz_2v2.losses}N
						</span>
						<span class="text-xs text-text-secondary text-center">2v2</span>
						<span class="text-xs font-medium text-text-primary">
							{s2.bilanz_2v2.wins}S / {s2.bilanz_2v2.losses}N
						</span>
					</div>
				</div>
			</div>

			<!-- Form (Trend Dots) -->
			{#if (s1.form_curve?.length > 0) || (s2.form_curve?.length > 0)}
				<div class="bg-bg-secondary border border-border rounded-lg p-4">
					<h3 class="text-sm font-medium text-text-secondary mb-3">{$t("compare.form")}</h3>
					<div class="flex flex-col gap-2">
						<div class="flex items-center gap-2">
							<span class="text-xs text-text-secondary w-20 truncate text-right">{p1.username}</span>
							<div class="flex gap-1 flex-1">
								{#each (s1.form_curve || []) as game (game.game_id)}
									<div
										class="w-3 h-3 rounded-full shrink-0
											{game.result === 'W' ? 'bg-success' : game.result === 'L' ? 'bg-error' : 'bg-warning'}"
										title={game.result}
									></div>
								{/each}
							</div>
						</div>
						<div class="flex items-center gap-2">
							<span class="text-xs text-text-secondary w-20 truncate text-right">{p2.username}</span>
							<div class="flex gap-1 flex-1">
								{#each (s2.form_curve || []) as game (game.game_id)}
									<div
										class="w-3 h-3 rounded-full shrink-0
											{game.result === 'W' ? 'bg-success' : game.result === 'L' ? 'bg-error' : 'bg-warning'}"
										title={game.result}
									></div>
								{/each}
							</div>
						</div>
					</div>
				</div>
			{/if}

			<!-- H2H Section -->
			{#if h2h && h2h.total_games > 0}
				{@const p1Wins = h2h.user_wins}
				{@const p2Wins = h2h.opponent_wins}
				{@const draws = h2h.draws}
				{@const total = h2h.total_games}
				{@const p1Pct = Math.round((p1Wins / total) * 100)}
				{@const drawPct = Math.round((draws / total) * 100)}
				{@const p2Pct = 100 - p1Pct - drawPct}
				<div class="bg-bg-secondary border border-border rounded-lg p-4">
					<h3 class="text-sm font-medium text-text-secondary mb-3">{$t("compare.h2h_title")}</h3>

					<div class="flex h-2.5 rounded-full overflow-hidden mb-3">
						{#if p1Pct > 0}
							<div class="bg-success" style="width: {p1Pct}%"></div>
						{/if}
						{#if drawPct > 0}
							<div class="bg-warning" style="width: {drawPct}%"></div>
						{/if}
						{#if p2Pct > 0}
							<div class="bg-error" style="width: {p2Pct}%"></div>
						{/if}
					</div>

					<div class="grid grid-cols-4 gap-2 text-center mb-3">
						<div>
							<p class="text-lg font-bold text-text-primary">{total}</p>
							<p class="text-[10px] text-text-secondary">{$t("compare.games")}</p>
						</div>
						<div>
							<p class="text-lg font-bold text-success">{p1Wins}</p>
							<p class="text-[10px] text-text-secondary">{p1.username}</p>
						</div>
						<div>
							<p class="text-lg font-bold text-warning">{draws}</p>
							<p class="text-[10px] text-text-secondary">{$t("compare.draws")}</p>
						</div>
						<div>
							<p class="text-lg font-bold text-error">{p2Wins}</p>
							<p class="text-[10px] text-text-secondary">{p2.username}</p>
						</div>
					</div>

					{#if h2h.trend?.length > 0}
						<div class="flex gap-1 flex-wrap">
							{#each h2h.trend as game, i (i)}
								<div
									class="w-3 h-3 rounded-full shrink-0
										{game.result === 'W' ? 'bg-success' : game.result === 'L' ? 'bg-error' : 'bg-warning'}"
									title={game.result}
								></div>
							{/each}
						</div>
					{/if}

					{#if h2h.goal_stats}
						<div class="mt-3 pt-3 border-t border-border">
							<div class="grid grid-cols-3 items-center gap-2">
								<span class="text-sm font-bold {highlightClass(h2h.goal_stats.user_goals, h2h.goal_stats.opponent_goals, 'left')} text-right">
									{h2h.goal_stats.user_goals}
								</span>
								<span class="text-xs text-text-secondary text-center">{$t("compare.goals_total")}</span>
								<span class="text-sm font-bold {highlightClass(h2h.goal_stats.user_goals, h2h.goal_stats.opponent_goals, 'right')}">
									{h2h.goal_stats.opponent_goals}
								</span>
							</div>
							<div class="grid grid-cols-3 items-center gap-2 mt-1">
								<span class="text-xs font-medium {highlightClass(h2h.goal_stats.user_avg, h2h.goal_stats.opponent_avg, 'left')} text-right">
									{h2h.goal_stats.user_avg}
								</span>
								<span class="text-[10px] text-text-secondary text-center">{$t("compare.goals_avg")}</span>
								<span class="text-xs font-medium {highlightClass(h2h.goal_stats.user_avg, h2h.goal_stats.opponent_avg, 'right')}">
									{h2h.goal_stats.opponent_avg}
								</span>
							</div>
						</div>
					{/if}
				</div>
			{:else if h2h && h2h.total_games === 0}
				<div class="bg-bg-secondary border border-border rounded-lg p-4">
					<h3 class="text-sm font-medium text-text-secondary mb-2">{$t("compare.h2h_title")}</h3>
					<p class="text-sm text-text-secondary">{$t("compare.h2h_no_games")}</p>
				</div>
			{/if}
		{/if}

	{:else}
		<!-- ============ DUO COMPARE ============ -->

		<!-- Duo Pickers -->
		<div class="grid grid-cols-2 gap-3">
			<div class="flex flex-col gap-2">
				<span class="text-xs font-medium text-text-secondary">{$t("compare.duo_1")}</span>
				<PlayerPicker
					{players}
					bind:selected={duo1Player1Id}
					excludeId={duo1Player2Id}
				/>
				<PlayerPicker
					{players}
					bind:selected={duo1Player2Id}
					excludeId={duo1Player1Id}
				/>
			</div>
			<div class="flex flex-col gap-2">
				<span class="text-xs font-medium text-text-secondary">{$t("compare.duo_2")}</span>
				<PlayerPicker
					{players}
					bind:selected={duo2Player1Id}
					excludeId={duo2Player2Id}
				/>
				<PlayerPicker
					{players}
					bind:selected={duo2Player2Id}
					excludeId={duo2Player1Id}
				/>
			</div>
		</div>

		{#if !duo1Player1Id || !duo1Player2Id || !duo2Player1Id || !duo2Player2Id}
			<p class="text-sm text-text-secondary text-center py-8">
				{$t("compare.select_four")}
			</p>
		{:else if loading}
			<div class="flex justify-center py-8">
				<div class="animate-spin h-8 w-8 border-2 border-accent-red border-t-transparent rounded-full"></div>
			</div>
		{:else if d1 && d2}
			<!-- Duo Header with VS -->
			<div class="flex items-center justify-center gap-3 py-2">
				<!-- Duo 1 -->
				<div class="flex flex-col items-center gap-1 flex-1">
					<div class="flex -space-x-3">
						{#if d1.player1.avatar_url}
							<img src={d1.player1.avatar_url} alt={d1.player1.username} class="w-11 h-11 rounded-full object-cover ring-2 ring-bg-primary" />
						{:else}
							<div class="w-11 h-11 rounded-full bg-bg-input flex items-center justify-center text-sm font-bold text-text-primary ring-2 ring-bg-primary">
								{(d1.player1.username || "?").charAt(0).toUpperCase()}
							</div>
						{/if}
						{#if d1.player2.avatar_url}
							<img src={d1.player2.avatar_url} alt={d1.player2.username} class="w-11 h-11 rounded-full object-cover ring-2 ring-bg-primary" />
						{:else}
							<div class="w-11 h-11 rounded-full bg-bg-input flex items-center justify-center text-sm font-bold text-text-primary ring-2 ring-bg-primary">
								{(d1.player2.username || "?").charAt(0).toUpperCase()}
							</div>
						{/if}
					</div>
					<span class="text-xs font-semibold text-text-primary truncate max-w-[130px] text-center">
						{d1.player1.username} & {d1.player2.username}
					</span>
				</div>

				<span class="text-lg font-bold text-text-secondary">{$t("compare.vs")}</span>

				<!-- Duo 2 -->
				<div class="flex flex-col items-center gap-1 flex-1">
					<div class="flex -space-x-3">
						{#if d2.player1.avatar_url}
							<img src={d2.player1.avatar_url} alt={d2.player1.username} class="w-11 h-11 rounded-full object-cover ring-2 ring-bg-primary" />
						{:else}
							<div class="w-11 h-11 rounded-full bg-bg-input flex items-center justify-center text-sm font-bold text-text-primary ring-2 ring-bg-primary">
								{(d2.player1.username || "?").charAt(0).toUpperCase()}
							</div>
						{/if}
						{#if d2.player2.avatar_url}
							<img src={d2.player2.avatar_url} alt={d2.player2.username} class="w-11 h-11 rounded-full object-cover ring-2 ring-bg-primary" />
						{:else}
							<div class="w-11 h-11 rounded-full bg-bg-input flex items-center justify-center text-sm font-bold text-text-primary ring-2 ring-bg-primary">
								{(d2.player2.username || "?").charAt(0).toUpperCase()}
							</div>
						{/if}
					</div>
					<span class="text-xs font-semibold text-text-primary truncate max-w-[130px] text-center">
						{d2.player1.username} & {d2.player2.username}
					</span>
				</div>
			</div>

			<!-- Duo Overview Stats -->
			<div class="bg-bg-secondary border border-border rounded-lg p-4">
				<div class="flex flex-col gap-3">
					{#each [
						{ label: $t("compare.games"), v1: d1.total_games, v2: d2.total_games },
						{ label: $t("compare.wins"), v1: d1.wins, v2: d2.wins },
						{ label: $t("compare.draws"), v1: d1.draws, v2: d2.draws },
						{ label: $t("compare.losses"), v1: d1.losses, v2: d2.losses },
						{ label: $t("compare.win_rate"), v1: duoWinRate1, v2: duoWinRate2, suffix: "%" },
					] as stat (stat.label)}
						<div class="grid grid-cols-3 items-center">
							<span class="text-sm font-bold {highlightClass(stat.v1, stat.v2, 'left')} text-right">
								{stat.v1}{stat.suffix || ""}
							</span>
							<span class="text-xs text-text-secondary text-center">{stat.label}</span>
							<span class="text-sm font-bold {highlightClass(stat.v1, stat.v2, 'right')}">
								{stat.v2}{stat.suffix || ""}
							</span>
						</div>
					{/each}
				</div>
			</div>

			<!-- Duo Streak -->
			{#if d1.streak || d2.streak}
				<div class="bg-bg-secondary border border-border rounded-lg p-4">
					<h3 class="text-sm font-medium text-text-secondary mb-3">{$t("compare.streak")}</h3>
					<div class="grid grid-cols-3 items-center">
						<span class="text-sm font-bold text-text-primary text-right">
							{streakDisplay(d1.streak)}
						</span>
						<span class="text-xs text-text-secondary text-center">{$t("compare.streak")}</span>
						<span class="text-sm font-bold text-text-primary">
							{streakDisplay(d2.streak)}
						</span>
					</div>
				</div>
			{/if}

			<!-- Duo Career Stats Bars -->
			{#if d1.avg_match_stats || d2.avg_match_stats}
				{@const ms1 = d1.avg_match_stats || {}}
				{@const ms2 = d2.avg_match_stats || {}}
				{@const duoCareerStats = [
					{ label: $t("compare.possession"), v1: ms1.avg_possession || 0, v2: ms2.avg_possession || 0, suffix: "%" },
					{ label: $t("compare.pass_accuracy"), v1: ms1.avg_pass_accuracy || 0, v2: ms2.avg_pass_accuracy || 0, suffix: "%" },
					{ label: $t("compare.xg"), v1: ms1.avg_xg_per_game || 0, v2: ms2.avg_xg_per_game || 0 },
					{ label: $t("compare.shot_accuracy"), v1: ms1.avg_shot_accuracy || 0, v2: ms2.avg_shot_accuracy || 0, suffix: "%" },
				]}
				<div class="bg-bg-secondary border border-border rounded-lg p-4">
					<h3 class="text-sm font-medium text-text-secondary mb-3">{$t("compare.avg_match_stats")}</h3>
					<div class="flex flex-col gap-3">
						{#each duoCareerStats as stat (stat.label)}
							{@const bw = barWidths(stat.v1, stat.v2)}
							<div class="flex flex-col gap-1">
								<div class="grid grid-cols-3 items-center">
									<span class="text-xs font-medium {highlightClass(stat.v1, stat.v2, 'left')} text-right">
										{typeof stat.v1 === "number" && stat.v1 % 1 !== 0 ? stat.v1.toFixed(1) : stat.v1}{stat.suffix || ""}
									</span>
									<span class="text-[10px] text-text-secondary text-center">{stat.label}</span>
									<span class="text-xs font-medium {highlightClass(stat.v1, stat.v2, 'right')}">
										{typeof stat.v2 === "number" && stat.v2 % 1 !== 0 ? stat.v2.toFixed(1) : stat.v2}{stat.suffix || ""}
									</span>
								</div>
								<div class="flex gap-0.5 h-1.5">
									<div class="flex-1 flex justify-end">
										<div
											class="h-full rounded-l-full {stat.v1 >= stat.v2 ? 'bg-accent-red' : 'bg-border'}"
											style="width: {bw.leftPct}%"
										></div>
									</div>
									<div class="flex-1">
										<div
											class="h-full rounded-r-full {stat.v2 >= stat.v1 ? 'bg-accent-red' : 'bg-border'}"
											style="width: {bw.rightPct}%"
										></div>
									</div>
								</div>
							</div>
						{/each}
					</div>
					{#if ms1.games_with_stats || ms2.games_with_stats}
						<p class="text-[10px] text-text-secondary mt-2 text-center">
							{$t("compare.based_on", { count: Math.max(ms1.games_with_stats || 0, ms2.games_with_stats || 0) })}
						</p>
					{/if}
				</div>
			{/if}

			<!-- Duo Form (Trend Dots) -->
			{#if (d1.trend?.length > 0) || (d2.trend?.length > 0)}
				<div class="bg-bg-secondary border border-border rounded-lg p-4">
					<h3 class="text-sm font-medium text-text-secondary mb-3">{$t("compare.form")}</h3>
					<div class="flex flex-col gap-2">
						<div class="flex items-center gap-2">
							<span class="text-xs text-text-secondary w-20 truncate text-right">
								{$t("compare.duo_1")}
							</span>
							<div class="flex gap-1 flex-1">
								{#each (d1.trend || []).slice(0, 15) as entry, i (i)}
									<div
										class="w-3 h-3 rounded-full shrink-0
											{entry.result === 'W' ? 'bg-success' : entry.result === 'L' ? 'bg-error' : 'bg-warning'}"
										title={entry.result}
									></div>
								{/each}
							</div>
						</div>
						<div class="flex items-center gap-2">
							<span class="text-xs text-text-secondary w-20 truncate text-right">
								{$t("compare.duo_2")}
							</span>
							<div class="flex gap-1 flex-1">
								{#each (d2.trend || []).slice(0, 15) as entry, i (i)}
									<div
										class="w-3 h-3 rounded-full shrink-0
											{entry.result === 'W' ? 'bg-success' : entry.result === 'L' ? 'bg-error' : 'bg-warning'}"
										title={entry.result}
									></div>
								{/each}
							</div>
						</div>
					</div>
				</div>
			{/if}

			<!-- Duo vs Duo H2H -->
			{#if duoH2H}
				{@const h2hTotal = duoH2H.games}
				{@const h2hWinPct = h2hTotal > 0 ? Math.round((duoH2H.wins / h2hTotal) * 100) : 0}
				{@const h2hDrawPct = h2hTotal > 0 ? Math.round((duoH2H.draws / h2hTotal) * 100) : 0}
				{@const h2hLossPct = 100 - h2hWinPct - h2hDrawPct}
				<div class="bg-bg-secondary border border-border rounded-lg p-4">
					<h3 class="text-sm font-medium text-text-secondary mb-3">{$t("compare.duo_h2h")}</h3>

					<div class="flex h-2.5 rounded-full overflow-hidden mb-3">
						{#if h2hWinPct > 0}
							<div class="bg-success" style="width: {h2hWinPct}%"></div>
						{/if}
						{#if h2hDrawPct > 0}
							<div class="bg-warning" style="width: {h2hDrawPct}%"></div>
						{/if}
						{#if h2hLossPct > 0}
							<div class="bg-error" style="width: {h2hLossPct}%"></div>
						{/if}
					</div>

					<div class="grid grid-cols-4 gap-2 text-center">
						<div>
							<p class="text-lg font-bold text-text-primary">{h2hTotal}</p>
							<p class="text-[10px] text-text-secondary">{$t("compare.games")}</p>
						</div>
						<div>
							<p class="text-lg font-bold text-success">{duoH2H.wins}</p>
							<p class="text-[10px] text-text-secondary">{$t("compare.duo_1")}</p>
						</div>
						<div>
							<p class="text-lg font-bold text-warning">{duoH2H.draws}</p>
							<p class="text-[10px] text-text-secondary">{$t("compare.draws")}</p>
						</div>
						<div>
							<p class="text-lg font-bold text-error">{duoH2H.losses}</p>
							<p class="text-[10px] text-text-secondary">{$t("compare.duo_2")}</p>
						</div>
					</div>
				</div>
			{:else if d1.total_games > 0 && d2.total_games > 0}
				<div class="bg-bg-secondary border border-border rounded-lg p-4">
					<h3 class="text-sm font-medium text-text-secondary mb-2">{$t("compare.duo_h2h")}</h3>
					<p class="text-sm text-text-secondary">{$t("compare.duo_h2h_no_games")}</p>
				</div>
			{/if}

			<!-- No data hint for duos that haven't played -->
			{#if d1.total_games === 0}
				<p class="text-xs text-text-secondary text-center">
					{$t("compare.duo_1")}: {$t("compare.no_duo_data")}
				</p>
			{/if}
			{#if d2.total_games === 0}
				<p class="text-xs text-text-secondary text-center">
					{$t("compare.duo_2")}: {$t("compare.no_duo_data")}
				</p>
			{/if}
		{/if}
	{/if}
</div>
