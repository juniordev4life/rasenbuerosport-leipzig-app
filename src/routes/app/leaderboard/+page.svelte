<script>
import { getTranslate } from "@tolgee/svelte";
import { untrack } from "svelte";
import { goto, replaceState } from "$app/navigation";
import AwardsStrip from "$lib/components/leaderboard/AwardsStrip.svelte";
import DuoRow from "$lib/components/leaderboard/DuoRow.svelte";
import LeagueTable from "$lib/components/leaderboard/LeagueTable.svelte";
import ModeSwitch from "$lib/components/leaderboard/ModeSwitch.svelte";
import PlayerRow from "$lib/components/leaderboard/PlayerRow.svelte";
import RanglisteHero from "$lib/components/leaderboard/RanglisteHero.svelte";
import SeasonSwitch from "$lib/components/leaderboard/SeasonSwitch.svelte";
import SeasonTalkrundeCard from "$lib/components/leaderboard/SeasonTalkrundeCard.svelte";
import SegmentedToggle from "$lib/components/leaderboard/SegmentedToggle.svelte";
import InfoTip from "$lib/components/ui/InfoTip.svelte";
import {
	getLeagueSeasons,
	getSeasonAwards,
	getSeasonRating,
	getSeasonRecap,
	getSeasonTable,
} from "$lib/services/seasons.services.js";
import { user } from "$lib/stores/auth.stores.js";
import { selectedLeagueSeason } from "$lib/stores/leagueSeason.stores.js";
import {
	buildDuoId,
	findSeasonLeader,
	firstUnqualifiedIndex,
	sortPlayers,
	sortTableRows,
} from "$lib/utils/leaderboard.utils.js";

const { t } = getTranslate();

let seasons = $state([]);
let selectedSeasonId = $state(initialParam("season", "current"));
let view = $state(initialView());
let skillTab = $state(initialParam("tab", "players", ["players", "duos"]));
let sort = $state(initialParam("sort", "current", ["current", "form"]));
let tableMode = $state(initialParam("table", "total", ["total", "per_game"]));

let rating = $state(null);
let table = $state(null);
let awards = $state([]);
let hasRecap = $state(false);

let loading = $state(true);
let error = $state(false);
/** Bumped by {@link retry} to force the load effect below to re-run
 *  after a failed fetch, even though season/view didn't change. */
let reloadToken = $state(0);

const userId = $derived($user?.uid ?? null);

function initialParam(key, fallback, allowed) {
	if (typeof window === "undefined") return fallback;
	const v = new URL(window.location.href).searchParams.get(key);
	if (!v) return fallback;
	return allowed ? (allowed.includes(v) ? v : fallback) : v;
}

function initialView() {
	if (typeof window === "undefined") return "skill";
	const v = new URL(window.location.href).searchParams.get("mode");
	return v === "league" ? "league" : "skill";
}

function syncUrl() {
	if (typeof window === "undefined") return;
	const url = new URL(window.location.href);
	const params = {
		season: selectedSeasonId,
		mode: view,
		tab: skillTab,
		sort,
		table: tableMode,
	};
	const desired = new URLSearchParams(params).toString();
	const current = new URLSearchParams(
		Object.fromEntries(
			Object.keys(params).map((key) => [key, url.searchParams.get(key) ?? ""]),
		),
	).toString();
	if (desired === current) return;
	for (const [key, value] of Object.entries(params)) {
		url.searchParams.set(key, value);
	}
	replaceState(url, {});
}

$effect(() => {
	const _s = selectedSeasonId;
	const _v = view;
	const _t = skillTab;
	const _so = sort;
	const _tm = tableMode;
	void _s;
	void _v;
	void _t;
	void _so;
	void _tm;
	untrack(() => syncUrl());
	selectedLeagueSeason.set(selectedSeasonId);
});

$effect(() => {
	(async () => {
		try {
			seasons = await getLeagueSeasons();
		} catch (err) {
			console.error("Failed to load league seasons:", err);
		}
	})();
});

/** Load the awards + "do I have a recap" extras for a closed season. */
async function loadSeasonExtras(meta) {
	if (!meta || meta.is_current) {
		awards = [];
		hasRecap = false;
		return;
	}
	try {
		const [awardsRes, recapRes] = await Promise.all([
			getSeasonAwards(meta.id),
			getSeasonRecap(meta.id),
		]);
		awards = awardsRes.awards ?? [];
		hasRecap = recapRes != null;
	} catch (err) {
		console.error("Failed to load season extras:", err);
		awards = [];
		hasRecap = false;
	}
}

$effect(() => {
	const seasonId = selectedSeasonId;
	const currentView = view;
	void reloadToken;
	let aborted = false;
	(async () => {
		loading = true;
		error = false;
		let meta = null;
		try {
			if (currentView === "skill") {
				const res = await getSeasonRating(seasonId);
				if (aborted) return;
				rating = res;
				meta = res.season;
			} else {
				const res = await getSeasonTable(seasonId);
				if (aborted) return;
				table = res;
				meta = res.season;
			}
		} catch (err) {
			if (aborted) return;
			console.error("Rangliste load failed:", err);
			error = true;
			loading = false;
			return;
		}
		loading = false;
		await loadSeasonExtras(meta);
	})();
	return () => {
		aborted = true;
	};
});

/** Force the load effect to re-run after a failed fetch. */
function retry() {
	reloadToken += 1;
}

const seasonMeta = $derived(rating?.season ?? table?.season ?? null);
const isCurrentSeason = $derived(seasonMeta ? seasonMeta.is_current : true);

const sortedPlayers = $derived(sortPlayers(rating?.players ?? [], sort));
const heroPlayer = $derived(findSeasonLeader(rating?.players ?? []));
const dividerIndex = $derived(
	sort === "current" ? firstUnqualifiedIndex(sortedPlayers) : -1,
);

const sortedTableRows = $derived(sortTableRows(table?.rows ?? [], tableMode));

const recapHref = $derived(seasonMeta ? `/app/recap/${seasonMeta.id}` : null);

function handlePlayerClick(id) {
	if (id) goto(`/app/profile/${id}`);
}

function handleDuoClick(duo) {
	const ids = duo.players?.map((p) => p.player_id) ?? [];
	if (ids.length !== 2) return;
	goto(`/app/duo/${buildDuoId(ids[0], ids[1])}`);
}
</script>

<svelte:head>
	<title>RasenBürosport - {$t("leaderboard.title")}</title>
</svelte:head>

<div class="mx-auto max-w-lg lg:max-w-xl flex flex-col gap-3 pb-4">
	<header class="flex items-end justify-between pt-1">
		<div class="flex items-center gap-1.5">
			<h1 class="text-2xl font-extrabold tracking-tight text-text-primary">
				{$t("leaderboard.title")}
			</h1>
			<InfoTip titleKey="info_tips.elo.title" bodyKey="info_tips.elo.body" size={16} />
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

	<SeasonSwitch {seasons} value={selectedSeasonId} onChange={(v) => (selectedSeasonId = v)} />

	<ModeSwitch value={view} onChange={(v) => (view = v)} seasonIsCurrent={isCurrentSeason} />

	{#if loading}
		<div class="flex justify-center py-12">
			<div
				class="animate-spin h-8 w-8 border-2 border-accent-red border-t-transparent rounded-full"
			></div>
		</div>
	{:else if error}
		<div class="flex flex-col items-center gap-3 py-12 text-center">
			<p class="text-text-secondary">{$t("leaderboard.error_generic")}</p>
			<button
				type="button"
				onclick={retry}
				class="px-4 py-2 rounded-full text-xs font-bold bg-accent-red text-white hover:bg-accent-red-hover transition-colors"
			>
				{$t("leaderboard.retry")}
			</button>
		</div>
	{:else if view === "skill"}
		<SegmentedToggle
			options={[
				{ value: "players", label: $t("leaderboard.tab_players") },
				{ value: "duos", label: $t("leaderboard.mode_duos") },
			]}
			value={skillTab}
			onChange={(v) => (skillTab = v)}
			ariaLabel={$t("leaderboard.view_switch")}
		/>

		{#if skillTab === "players"}
			<SegmentedToggle
				options={[
					{ value: "current", label: $t("leaderboard.sort_current") },
					{ value: "form", label: $t("leaderboard.sort_form") },
				]}
				value={sort}
				onChange={(v) => (sort = v)}
				ariaLabel={$t("leaderboard.sort")}
			/>

			{#if heroPlayer}
				<RanglisteHero
					player={heroPlayer}
					season={{ isCurrent: isCurrentSeason, gameVersion: seasonMeta?.game_version ?? "" }}
				/>
			{/if}

			{#if sortedPlayers.length === 0}
				<p class="text-text-secondary text-center py-8">{$t("leaderboard.no_data")}</p>
			{:else}
				<div class="flex flex-col">
					{#each sortedPlayers as p, i (p.player_id)}
						{#if i === dividerIndex}
							<div class="flex items-center gap-2 my-2 px-1">
								<span class="h-px flex-1 bg-border"></span>
								<span class="text-[10px] font-bold uppercase tracking-wide text-text-muted whitespace-nowrap">
									{$t("leaderboard.not_qualified_divider", {
										minGames: rating?.season?.min_games ?? 0,
									})}
								</span>
								<span class="h-px flex-1 bg-border"></span>
							</div>
						{/if}
						<PlayerRow
							rank={p.rank}
							player={p}
							{sort}
							isCurrentUser={p.player_id === userId}
							dimmed={p.player_id === heroPlayer?.player_id}
							onClick={handlePlayerClick}
						/>
					{/each}
				</div>
			{/if}
		{:else if (rating?.duos ?? []).length === 0}
			<p class="text-text-secondary text-center py-8">{$t("leaderboard.no_duos")}</p>
		{:else}
			<div class="flex flex-col">
				{#each rating.duos as duo (duo.duo_id)}
					<DuoRow rank={duo.rank} {duo} onClick={handleDuoClick} />
				{/each}
			</div>
		{/if}
	{:else}
		<SegmentedToggle
			options={[
				{ value: "total", label: $t("leaderboard.tab_total") },
				{ value: "per_game", label: $t("leaderboard.tab_per_game") },
			]}
			value={tableMode}
			onChange={(v) => (tableMode = v)}
			ariaLabel={$t("leaderboard.mode_league")}
		/>

		{#if sortedTableRows.length === 0}
			<p class="text-text-secondary text-center py-8">
				{$t("leaderboard.league_empty", { version: seasonMeta?.game_version ?? "" })}
			</p>
		{:else}
			<LeagueTable rows={sortedTableRows} mode={tableMode} currentUserId={userId} />
			<p class="text-[11px] text-text-muted text-center">{$t("leaderboard.league_legend")}</p>
		{/if}
	{/if}

	{#if !loading && !error && !isCurrentSeason}
		<AwardsStrip {awards} />
		{#if seasonMeta?.talkrunde?.audio_url}
			<SeasonTalkrundeCard
				audioUrl={seasonMeta.talkrunde.audio_url}
				gameVersion={seasonMeta.game_version ?? ""}
			/>
		{/if}
		{#if hasRecap && recapHref}
			<a
				href={recapHref}
				class="flex items-center justify-center gap-2 rounded-full bg-accent-red text-white text-sm font-bold px-4 py-2.5 hover:bg-accent-red-hover transition-colors"
			>
				{$t("leaderboard.recap_cta", { version: seasonMeta?.game_version ?? "" })}
			</a>
		{/if}
	{/if}
</div>
