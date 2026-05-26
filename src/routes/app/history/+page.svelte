<script>
import { getTranslate } from "@tolgee/svelte";
import { untrack } from "svelte";
import { replaceState } from "$app/navigation";
import DateGroupHeader from "$lib/components/historie/DateGroupHeader.svelte";
import EmptyState from "$lib/components/historie/EmptyState.svelte";
import FilterChip from "$lib/components/historie/FilterChip.svelte";
import FilterSheet from "$lib/components/historie/FilterSheet.svelte";
import LoadMoreCard from "$lib/components/historie/LoadMoreCard.svelte";
import MatchCard from "$lib/components/historie/MatchCard.svelte";
import { get } from "$lib/services/api.services.js";
import { user } from "$lib/stores/auth.stores.js";
import {
	computeGroupEloDelta,
	groupMatchesByDate,
} from "$lib/utils/dateGrouping.utils.js";

const { t } = getTranslate();

const PAGE_SIZE = 20;

let games = $state([]);
let offset = $state(0);
let loading = $state(true);
let loadingMore = $state(false);
let hasMore = $state(true);

let activeSheet = $state(null);

let who = $state(initial("who", "all"));
let zeit = $state(initial("zeit", "thisweek"));
let erg = $state(initial("erg", "all"));

const userId = $derived($user?.uid ?? null);

function initial(key, fallback) {
	if (typeof window === "undefined") return fallback;
	return new URL(window.location.href).searchParams.get(key) ?? fallback;
}

$effect(() => {
	untrack(() => {
		if (typeof window === "undefined") return;
		const url = new URL(window.location.href);
		setOrDelete(url, "who", who, "all");
		setOrDelete(url, "zeit", zeit, "thisweek");
		setOrDelete(url, "erg", erg, "all");
		if (url.search !== window.location.search) replaceState(url, {});
	});
	void who;
	void zeit;
	void erg;
});

function setOrDelete(url, key, value, fallback) {
	if (value === fallback) url.searchParams.delete(key);
	else url.searchParams.set(key, value);
}

function buildGamesUrl(currentOffset) {
	const params = new URLSearchParams({
		limit: String(PAGE_SIZE),
		offset: String(currentOffset),
		mine: String(who === "me"),
	});
	return `/v1/games?${params.toString()}`;
}

$effect(() => {
	const _ = `${who}|${zeit}|${erg}`;
	void _;
	games = [];
	offset = 0;
	hasMore = true;
	loading = true;
	let aborted = false;
	(async () => {
		try {
			const res = await get(buildGamesUrl(0));
			if (aborted) return;
			games = res.data ?? [];
			offset = games.length;
			hasMore = games.length >= PAGE_SIZE;
		} catch (err) {
			console.error("Historie load failed:", err);
		} finally {
			if (!aborted) loading = false;
		}
	})();
	return () => {
		aborted = true;
	};
});

async function loadMore() {
	if (loadingMore || !hasMore) return;
	loadingMore = true;
	try {
		const res = await get(buildGamesUrl(offset));
		const next = res.data ?? [];
		games = [...games, ...next];
		offset += next.length;
		hasMore = next.length >= PAGE_SIZE;
	} catch (err) {
		console.error("Historie load-more failed:", err);
	} finally {
		loadingMore = false;
	}
}

const filtered = $derived.by(() => {
	const now = new Date();
	let from = null;
	let to = null;
	const startOfDay = (d) => {
		const n = new Date(d);
		n.setHours(0, 0, 0, 0);
		return n.getTime();
	};
	const today = startOfDay(now);
	if (zeit === "today") from = today;
	else if (zeit === "thisweek") {
		const d = new Date(now);
		const dayNum = (d.getDay() + 6) % 7;
		d.setDate(d.getDate() - dayNum);
		d.setHours(0, 0, 0, 0);
		from = d.getTime();
	} else if (zeit === "thismonth") {
		const d = new Date(now);
		d.setDate(1);
		d.setHours(0, 0, 0, 0);
		from = d.getTime();
	}

	return (games ?? []).filter((g) => {
		const ts = new Date(g.played_at).getTime();
		if (!Number.isFinite(ts)) return false;
		if (from != null && ts < from) return false;
		if (to != null && ts > to) return false;

		if (who === "me") {
			if (!userId) return false;
			const involved = (g.game_players ?? []).some(
				(p) => p.player_id === userId,
			);
			if (!involved) return false;
		}

		if (erg !== "all") {
			const home = g.score_home ?? 0;
			const away = g.score_away ?? 0;
			const isDraw = home === away;
			const myEntry =
				who === "me" && userId
					? (g.game_players ?? []).find((p) => p.player_id === userId)
					: null;
			const winSide = isDraw ? null : home > away ? "home" : "away";
			if (erg === "wins") {
				if (who === "me") {
					if (!myEntry || myEntry.team !== winSide) return false;
				} else if (winSide !== "home") return false;
			} else if (erg === "losses") {
				if (who === "me") {
					if (!myEntry || isDraw || myEntry.team === winSide) return false;
				} else if (winSide !== "away") return false;
			} else if (erg === "zunull") {
				if (home !== 0 && away !== 0) return false;
			}
		}
		return true;
	});
});

const groups = $derived(groupMatchesByDate(filtered));

const totalCount = $derived(filtered.length);

const filterDescription = $derived.by(() => {
	const parts = [];
	parts.push($t(`historie.who.${who}`));
	parts.push($t(`historie.zeit.${zeit}`));
	if (erg !== "all") parts.push($t(`historie.erg.${erg}`));
	return parts.join(" · ");
});

function openSheet(key) {
	activeSheet = key;
}
function closeSheet() {
	activeSheet = null;
}

function resetFilters() {
	who = "all";
	zeit = "thisweek";
	erg = "all";
}

const whoOptions = $derived([
	{ value: "all", label: $t("historie.who.all") },
	{ value: "me", label: $t("historie.who.me") },
]);
const zeitOptions = $derived([
	{ value: "all", label: $t("historie.zeit.all") },
	{ value: "today", label: $t("historie.zeit.today") },
	{ value: "thisweek", label: $t("historie.zeit.thisweek") },
	{ value: "thismonth", label: $t("historie.zeit.thismonth") },
]);
const ergOptions = $derived([
	{ value: "all", label: $t("historie.erg.all") },
	{ value: "wins", label: $t("historie.erg.wins") },
	{ value: "losses", label: $t("historie.erg.losses") },
	{ value: "zunull", label: $t("historie.erg.zunull") },
]);
</script>

<svelte:head>
	<title>RasenBürosport - {$t("historie.title")}</title>
</svelte:head>

<div class="page">
	<header class="head">
		<h1 class="title">{$t("historie.title")}</h1>
		<div class="subtitle">
			<strong>{totalCount} {$t("historie.matches")}</strong>
			<span class="divider">·</span>
			<span>{filterDescription}</span>
		</div>
	</header>

	<div class="chip-row">
		<FilterChip
			label={$t(`historie.who.${who}`)}
			active={who !== "all"}
			onClick={() => openSheet("who")}
		/>
		<FilterChip
			label={$t(`historie.zeit.${zeit}`)}
			active={zeit !== "thisweek"}
			onClick={() => openSheet("zeit")}
		/>
		<FilterChip
			label={$t(`historie.erg.${erg}`)}
			active={erg !== "all"}
			onClick={() => openSheet("erg")}
		/>
	</div>

	{#if loading}
		<div class="loading">
			<div class="spinner"></div>
		</div>
	{:else if totalCount === 0}
		<EmptyState {who} {zeit} {erg} onReset={resetFilters} />
	{:else}
		{#each groups as group (group.key)}
			{@const eloDelta = who === "me" ? computeGroupEloDelta(group.matches, userId) : null}
			<DateGroupHeader
				label={group.label}
				matchCount={group.matches.length}
				{eloDelta}
				matchesLabel={$t("historie.matches")}
			/>
			<div class="list">
				{#each group.matches as game (game.id)}
					<MatchCard {game} currentUserId={userId} />
				{/each}
			</div>
		{/each}

		{#if hasMore}
			<LoadMoreCard
				remaining={null}
				loading={loadingMore}
				onClick={loadMore}
			/>
		{/if}
	{/if}
</div>

{#if activeSheet === "who"}
	<FilterSheet
		title={$t("historie.filter_who_title")}
		options={whoOptions}
		value={who}
		onSelect={(v) => (who = v)}
		onClose={closeSheet}
	/>
{:else if activeSheet === "zeit"}
	<FilterSheet
		title={$t("historie.filter_zeit_title")}
		options={zeitOptions}
		value={zeit}
		onSelect={(v) => (zeit = v)}
		onClose={closeSheet}
	/>
{:else if activeSheet === "erg"}
	<FilterSheet
		title={$t("historie.filter_erg_title")}
		options={ergOptions}
		value={erg}
		onSelect={(v) => (erg = v)}
		onClose={closeSheet}
	/>
{/if}

<style>
.page { padding: 0 4px 32px; }
.head { margin: 0 2px 10px; }
.title {
	font-size: 24px;
	font-weight: 800;
	letter-spacing: -0.02em;
	margin: 0 0 4px;
	color: #FFFFFF;
}
.subtitle {
	font-size: 12px;
	color: #6B7280;
	display: flex; align-items: center; gap: 6px;
	flex-wrap: wrap;
}
.subtitle strong { color: #E5E7EB; font-weight: 700; }
.divider { color: #4B5563; }
.chip-row {
	display: flex; gap: 7px;
	margin-bottom: 14px;
	overflow-x: auto;
	scrollbar-width: none;
	padding: 2px 0;
}
.chip-row::-webkit-scrollbar { display: none; }
.list { display: flex; flex-direction: column; gap: 7px; }
.loading {
	display: flex; justify-content: center;
	padding: 48px 0;
}
.spinner {
	width: 28px; height: 28px;
	border: 2px solid #E24B4A;
	border-top-color: transparent;
	border-radius: 50%;
	animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
