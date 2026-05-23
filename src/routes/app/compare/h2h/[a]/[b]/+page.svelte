<script>
import { getTranslate } from "@tolgee/svelte";
import { goto } from "$app/navigation";
import { page } from "$app/state";
import EloDeltaChart from "$lib/components/compare/EloDeltaChart.svelte";
import H2HEmptyState from "$lib/components/compare/H2HEmptyState.svelte";
import H2HHero from "$lib/components/compare/H2HHero.svelte";
import H2HMatchList from "$lib/components/compare/H2HMatchList.svelte";
import OverlaidSpiderSection from "$lib/components/compare/OverlaidSpiderSection.svelte";
import StatComparisonSection from "$lib/components/compare/StatComparisonSection.svelte";
import { get } from "$lib/services/api.services.js";
import { getPlayerProfile } from "$lib/services/playerProfile.services.js";
import { buildEloHistory } from "$lib/utils/eloHistory.utils.js";

const { t } = getTranslate();

const playerAId = $derived(page.params.a);
const playerBId = $derived(page.params.b);

let comparison = $state(null);
let profileA = $state(null);
let profileB = $state(null);
let games = $state([]);
let loading = $state(true);
let errorMsg = $state(null);

$effect(() => {
	const a = playerAId;
	const b = playerBId;
	if (!a || !b) return;
	if (a === b) {
		goto("/app/compare");
		return;
	}
	let aborted = false;
	loading = true;
	errorMsg = null;
	(async () => {
		try {
			const [cmpRes, profA, profB, gamesRes] = await Promise.all([
				get(`/v1/compare/${a}/${b}`),
				getPlayerProfile(a).catch(() => null),
				getPlayerProfile(b).catch(() => null),
				get("/v1/games?limit=200"),
			]);
			if (aborted) return;
			comparison = cmpRes.data ?? null;
			profileA = profA;
			profileB = profB;
			games = gamesRes.data ?? [];
		} catch (err) {
			if (aborted) return;
			errorMsg = err?.message || $t("compare.load_error");
		} finally {
			if (!aborted) loading = false;
		}
	})();
	return () => {
		aborted = true;
	};
});

const eloHistory = $derived(buildEloHistory(games, { mode: "all" }));
const entryA = $derived(eloHistory.get(playerAId) ?? null);
const entryB = $derived(eloHistory.get(playerBId) ?? null);

const h2h = $derived(comparison?.h2h ?? null);
const matchCount = $derived(h2h?.total_games ?? 0);

const playerANames = $derived(comparison?.player1?.username ?? "?");
const playerBNames = $derived(comparison?.player2?.username ?? "?");

/**
 * Direct H2H games chronologically ordered (oldest → newest). Pulled
 * from the same games window so we can derive per-match ELO deltas.
 */
const h2hGames = $derived.by(() => {
	if (!playerAId || !playerBId || games.length === 0) return [];
	const filtered = games.filter((g) => {
		const ps = g.game_players ?? [];
		const a = ps.find((p) => p.player_id === playerAId);
		const b = ps.find((p) => p.player_id === playerBId);
		if (!a || !b) return false;
		return a.team !== b.team;
	});
	return [...filtered].reverse();
});

const eloDeltaPoints = $derived.by(() => {
	if (h2hGames.length === 0) return [];
	return h2hGames.map((g) => {
		const snap = g.elo_snapshot;
		if (!snap) return 0;
		const all = [...(snap.teamA ?? []), ...(snap.teamB ?? [])];
		const a = all.find((e) => e.playerId === playerAId);
		const b = all.find((e) => e.playerId === playerBId);
		if (!a || !b) return 0;
		return (a.ratingAfter ?? 0) - (b.ratingAfter ?? 0);
	});
});

const matchListRows = $derived.by(() => {
	if (h2hGames.length === 0) return [];
	const rows = [];
	for (let i = h2hGames.length - 1; i >= 0; i -= 1) {
		const g = h2hGames[i];
		const ps = g.game_players ?? [];
		const a = ps.find((p) => p.player_id === playerAId);
		const b = ps.find((p) => p.player_id === playerBId);
		if (!a || !b) continue;
		const home = g.score_home ?? 0;
		const away = g.score_away ?? 0;
		const scoreA = a.team === "home" ? home : away;
		const scoreB = b.team === "home" ? home : away;
		const snap = g.elo_snapshot;
		let eloDeltaA = null;
		let eloDeltaB = null;
		if (snap) {
			const all = [...(snap.teamA ?? []), ...(snap.teamB ?? [])];
			eloDeltaA = all.find((e) => e.playerId === playerAId)?.delta ?? null;
			eloDeltaB = all.find((e) => e.playerId === playerBId)?.delta ?? null;
		}
		rows.push({
			id: g.id,
			date: g.played_at
				? new Date(g.played_at).toLocaleDateString("de-DE", {
						day: "2-digit",
						month: "short",
					})
				: "",
			scoreA,
			scoreB,
			eloDeltaA,
			eloDeltaB,
		});
		if (rows.length >= 5) break;
	}
	return rows;
});

const heroPlayerA = $derived({
	id: playerAId,
	username: playerANames,
	avatarUrl: comparison?.player1?.avatar_url ?? null,
	initials: (playerANames ?? "?").charAt(0).toUpperCase(),
	archetype: archetypeLabelFor(profileA),
	elo: entryA?.currentRating ?? null,
	rank: null,
});

const heroPlayerB = $derived({
	id: playerBId,
	username: playerBNames,
	avatarUrl: comparison?.player2?.avatar_url ?? null,
	initials: (playerBNames ?? "?").charAt(0).toUpperCase(),
	archetype: archetypeLabelFor(profileB),
	elo: entryB?.currentRating ?? null,
	rank: null,
});

function archetypeLabelFor(profile) {
	if (!profile?.archetype) return null;
	return profile.archetype.label ?? null;
}

const winsA = $derived(h2h?.user_wins ?? 0);
const winsB = $derived(h2h?.opponent_wins ?? 0);
const draws = $derived(h2h?.draws ?? 0);

const streakLeader = $derived.by(() => {
	if (!h2h?.streak || (h2h.streak.count ?? 0) < 2) return null;
	if (h2h.streak.type === "win") return playerANames;
	if (h2h.streak.type === "loss") return playerBNames;
	return null;
});
const streakCount = $derived(h2h?.streak?.count ?? null);

const marcelQuote = $derived.by(() => {
	if (matchCount === 0) return $t("compare.marcel_empty");
	if (matchCount === draws + Math.abs(winsA - winsB)) {
		// noop guard
	}
	if (Math.abs(winsA - winsB) >= 3 && matchCount >= 5) {
		if (winsA > winsB) {
			return $t("compare.marcel_dominance_a", {
				a: playerANames,
				b: playerBNames,
				winsA,
				winsB,
			});
		}
		return $t("compare.marcel_dominance_b", {
			a: playerANames,
			b: playerBNames,
			winsA,
			winsB,
		});
	}
	if (winsA === winsB) {
		return $t("compare.marcel_tied", { winsA, winsB });
	}
	if (Math.abs(winsA - winsB) === 1) {
		return $t("compare.marcel_close", { winsA, winsB });
	}
	const leader = winsA > winsB ? playerANames : playerBNames;
	return $t("compare.marcel_lead", { leader, winsA, winsB });
});

const statRows = $derived.by(() => {
	if (matchCount === 0) return [];
	const goalStats = h2h?.goal_stats ?? null;
	const sA = comparison?.player1?.stats ?? {};
	const sB = comparison?.player2?.stats ?? {};

	const rows = [];
	if (goalStats) {
		rows.push({
			label: $t("compare.stats.goals_per_game"),
			valueA: goalStats.user_avg ?? 0,
			valueB: goalStats.opponent_avg ?? 0,
			format: (n) => Number(n).toFixed(2).replace(".", ","),
		});
	}
	rows.push({
		label: $t("compare.stats.win_rate"),
		valueA: sA.win_rate ?? 0,
		valueB: sB.win_rate ?? 0,
		format: (n) => `${Math.round(n)}%`,
	});
	rows.push({
		label: $t("compare.stats.total_wins"),
		valueA: sA.wins ?? 0,
		valueB: sB.wins ?? 0,
	});
	rows.push({
		label: $t("compare.stats.assists_per_game"),
		valueA: sA.assists_per_game ?? 0,
		valueB: sB.assists_per_game ?? 0,
		format: (n) => Number(n).toFixed(2).replace(".", ","),
	});
	rows.push({
		label: $t("compare.stats.total_games"),
		valueA: sA.total_games ?? 0,
		valueB: sB.total_games ?? 0,
	});
	return rows;
});

function goBack() {
	goto("/app/compare");
}
</script>

<svelte:head>
	<title>RasenBürosport - {$t("compare.h2h_title")}</title>
</svelte:head>

<div class="mx-auto max-w-3xl px-3 pb-4 pt-0">
	<button
		type="button"
		onclick={goBack}
		class="flex items-center gap-1 text-text-secondary text-sm hover:text-text-primary transition-colors mb-1"
	>
		<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<path d="M15 19l-7-7 7-7" />
		</svg>
		{$t("common.back")}
	</button>

	{#if loading}
		<div class="flex justify-center py-12">
			<div class="animate-spin h-8 w-8 border-2 border-warning border-t-transparent rounded-full"></div>
		</div>
	{:else if errorMsg}
		<div class="bg-bg-secondary border border-error/60 rounded-2xl p-6 text-center text-error">
			{errorMsg}
		</div>
	{:else if matchCount === 0}
		<H2HEmptyState
			playerAName={playerANames}
			playerBName={playerBNames}
			onBack={goBack}
		/>
	{:else}
		<div class="flex flex-col gap-3 pb-4">
			<H2HHero
				playerA={heroPlayerA}
				playerB={heroPlayerB}
				{winsA}
				{winsB}
				{draws}
				{streakLeader}
				{streakCount}
				{marcelQuote}
			/>

			<EloDeltaChart
				points={eloDeltaPoints}
				playerAName={playerANames}
				playerBName={playerBNames}
			/>

			<OverlaidSpiderSection
				axesA={profileA?.axes ?? null}
				axesB={profileB?.axes ?? null}
				playerAName={playerANames}
				playerBName={playerBNames}
			/>

			<StatComparisonSection
				rows={statRows}
				playerAName={playerANames}
				playerBName={playerBNames}
			/>

			<H2HMatchList
				matches={matchListRows}
				playerAName={playerANames}
				playerBName={playerBNames}
			/>
		</div>
	{/if}
</div>
