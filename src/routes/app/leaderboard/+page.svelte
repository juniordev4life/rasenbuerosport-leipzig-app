<script>
import { getTranslate } from "@tolgee/svelte";
import { untrack } from "svelte";
import { goto, replaceState } from "$app/navigation";
import DuoRow from "$lib/components/leaderboard/DuoRow.svelte";
import ModeSwitch from "$lib/components/leaderboard/ModeSwitch.svelte";
import PlayerRow from "$lib/components/leaderboard/PlayerRow.svelte";
import RanglisteHero from "$lib/components/leaderboard/RanglisteHero.svelte";
import SubSwitches from "$lib/components/leaderboard/SubSwitches.svelte";
import InfoTip from "$lib/components/ui/InfoTip.svelte";
import { get } from "$lib/services/api.services.js";
import { user } from "$lib/stores/auth.stores.js";
import { buildEloHistory } from "$lib/utils/eloHistory.utils.js";

const { t } = getTranslate();

const DUO_TOP_N = 3;
const GAMES_WINDOW = 200;

let games = $state([]);
let duos = $state([]);
let loading = $state(true);

let teamSize = $state(initialTeamSize());
let sort = $state(initialSort());

const userId = $derived($user?.uid ?? null);

function initialTeamSize() {
	if (typeof window === "undefined") return "2v2";
	const v = new URL(window.location.href).searchParams.get("type");
	return v === "1v1" ? "1v1" : "2v2";
}
function initialSort() {
	if (typeof window === "undefined") return "current";
	const v = new URL(window.location.href).searchParams.get("sort");
	return v === "form" ? "form" : "current";
}

function syncUrl() {
	if (typeof window === "undefined") return;
	const url = new URL(window.location.href);
	const desired = `mode=skill&type=${teamSize}&sort=${sort}`;
	const current = `mode=${url.searchParams.get("mode") ?? ""}&type=${url.searchParams.get("type") ?? ""}&sort=${url.searchParams.get("sort") ?? ""}`;
	if (desired === current) return;
	url.searchParams.set("mode", "skill");
	url.searchParams.set("type", teamSize);
	url.searchParams.set("sort", sort);
	replaceState(url, {});
}

$effect(() => {
	let aborted = false;
	(async () => {
		try {
			const [gamesRes, duosRes] = await Promise.all([
				get(`/v1/games?limit=${GAMES_WINDOW}`),
				get("/v1/duos?limit=20"),
			]);
			if (aborted) return;
			games = gamesRes.data || [];
			duos = duosRes.data || [];
		} catch (err) {
			console.error("Rangliste load failed:", err);
		} finally {
			if (!aborted) loading = false;
		}
	})();
	return () => {
		aborted = true;
	};
});

$effect(() => {
	const _ts = teamSize;
	const _s = sort;
	void _ts;
	void _s;
	untrack(() => syncUrl());
});

const eloHistory = $derived.by(() =>
	buildEloHistory(games, { mode: teamSize }),
);

const ranked = $derived.by(() => {
	const rows = [];
	for (const entry of eloHistory.values()) {
		if (entry.games < 1) continue;
		rows.push({
			id: entry.playerId,
			username: entry.username ?? "?",
			avatarUrl: entry.avatarUrl,
			initials: (entry.username ?? "?").charAt(0).toUpperCase(),
			currentRating: entry.currentRating,
			ratings: entry.ratings,
			formDelta: entry.formDelta,
			weekDelta: entry.weekDelta,
			wins: entry.wins,
			draws: entry.draws,
			losses: entry.losses,
			games: entry.games,
			currentStreak: entry.currentStreak,
		});
	}
	rows.sort((a, b) => {
		if (sort === "form") {
			return (b.formDelta ?? -Infinity) - (a.formDelta ?? -Infinity);
		}
		return (b.currentRating ?? -Infinity) - (a.currentRating ?? -Infinity);
	});
	return rows;
});

const hero = $derived(ranked[0] ?? null);

const filteredDuos = $derived(
	teamSize === "2v2"
		? duos.filter((d) => (d.mode ?? "2v2") === "2v2").slice(0, DUO_TOP_N)
		: [],
);

// Desktop renders the duo ranking in a right rail; only when there is one.
const hasDuoRail = $derived(teamSize === "2v2" && filteredDuos.length > 0);

function handlePlayerClick(id) {
	if (!id) return;
	goto(`/app/profile/${id}`);
}

function handleDuoClick(duo) {
	const ids = [duo.player1.player_id, duo.player2.player_id].sort();
	goto(`/app/duo/${ids[0]}_${ids[1]}`);
}
</script>

<svelte:head>
	<title>RasenBürosport - {$t("leaderboard.title")}</title>
</svelte:head>

<div class="flex flex-col gap-3 pb-4">
	<header class="flex items-end justify-between pt-1 lg:justify-end">
		<div class="flex items-center gap-1.5 lg:hidden">
			<h1 class="text-2xl font-extrabold tracking-tight text-text-primary">
				{$t("leaderboard.title")}
			</h1>
			<InfoTip
				titleKey="info_tips.elo.title"
				bodyKey="info_tips.elo.body"
				size={16}
			/>
		</div>
		<button
			type="button"
			onclick={() => goto("/app/compare")}
			class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full border border-warning/40 text-warning bg-warning/5 hover:bg-warning/10 transition-colors"
		>
			<span>⇄</span>
			{$t("leaderboard.compare")}
		</button>
	</header>

	<ModeSwitch value="skill" onChange={() => {}} />

	<SubSwitches
		{teamSize}
		{sort}
		onTeamSize={(v) => (teamSize = v)}
		onSort={(v) => (sort = v)}
	/>

	{#if loading}
		<div class="flex justify-center py-12">
			<div class="animate-spin h-8 w-8 border-2 border-accent-red border-t-transparent rounded-full"></div>
		</div>
	{:else if ranked.length === 0}
		<p class="text-text-secondary text-center py-8">{$t("leaderboard.no_data")}</p>
	{:else}
		{#if hero}
			<RanglisteHero player={hero} />
		{/if}

		<!-- Desktop: solo ranking in the primary column, duo ranking + an
		     ELO explainer in the right rail. `contents` keeps the mobile
		     single-column order untouched. -->
		<div class="contents lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-6 lg:items-start">
			<div class="contents lg:block lg:min-w-0">
				<div class="section-header">
					<h3 class="section-title">{$t("leaderboard.solo_section")} · {teamSize}</h3>
				</div>

				<div class="list">
					{#each ranked as p, i (p.id)}
						<PlayerRow
							rank={i + 1}
							player={p}
							{sort}
							isCurrentUser={p.id === userId}
							dimmed={i === 0}
							onClick={handlePlayerClick}
						/>
					{/each}
				</div>
			</div>

			<div class="contents lg:flex lg:flex-col lg:gap-3">
				<div class="hidden lg:block rounded-xl border border-border bg-bg-card p-4">
					<div class="text-[11px] font-bold uppercase tracking-[0.1em] text-text-secondary mb-1.5">
						{$t("info_tips.elo.title")}
					</div>
					<p class="text-[12px] leading-relaxed text-text-secondary">
						{$t("info_tips.elo.body")}
					</p>
				</div>

				{#if hasDuoRail}
					<div class="contents lg:block">
						<div class="section-header">
							<h3 class="section-title">{"⚡"} {$t("leaderboard.duo_section")} · 2v2</h3>
						</div>
						<div class="list">
							{#each filteredDuos as duo, i (duo.duo_id)}
								<DuoRow rank={i + 1} {duo} onClick={handleDuoClick} />
							{/each}
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
.section-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin: 14px 0 6px;
	padding: 0 2px;
}
.section-title {
	font-size: 11px;
	font-weight: 700;
	color: #9CA3AF;
	text-transform: uppercase;
	letter-spacing: 0.1em;
	margin: 0;
}
.list { display: flex; flex-direction: column; }
</style>
