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

/** Apply a filter from the desktop rail — same state the mobile sheet writes. */
function setFilter(key, value) {
	if (key === "who") who = value;
	else if (key === "zeit") zeit = value;
	else if (key === "erg") erg = value;
}

const filterGroups = $derived([
	{
		key: "who",
		titleKey: "historie.filter_who_title",
		options: whoOptions,
		current: who,
	},
	{
		key: "zeit",
		titleKey: "historie.filter_zeit_title",
		options: zeitOptions,
		current: zeit,
	},
	{
		key: "erg",
		titleKey: "historie.filter_erg_title",
		options: ergOptions,
		current: erg,
	},
]);
</script>

<svelte:head>
	<title>RasenBürosport - {$t("historie.title")}</title>
</svelte:head>

<div class="historie">
	<div class="stack min-w-0">
		<!-- Hero: red band in A, plain text on the pitch in B. On desktop the
		     filter rail on the right takes over its count and filters. -->
		<header class="hero bleed head">
			<div class="title-row">
				<h1 class="page-title title">{$t("historie.title")}</h1>
				<p class="summary">
					<strong class="count">{totalCount} {$t("historie.matches")}</strong>
					<span class="desc">
						<span aria-hidden="true">·</span>
						{filterDescription}
					</span>
				</p>
			</div>

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
		</header>

		{#if loading}
			<div class="loading">
				<span class="spinner" role="status" aria-label={$t("common.loading")}></span>
			</div>
		{:else if totalCount === 0}
			<EmptyState {who} {zeit} {erg} onReset={resetFilters} />
		{:else}
			{#each groups as group (group.key)}
				{@const eloDelta = who === "me" ? computeGroupEloDelta(group.matches, userId) : null}
				<section class="group">
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
				</section>
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

	<!-- Persistent filter rail (desktop only); reuses the same setters as
	     the mobile filter sheet, so there is no duplicated filter logic. -->
	<aside class="rail">
		<div class="card rail-card">
			<div class="rail-count">
				<span class="num count-num">{totalCount}</span>
				<span class="label count-label">{$t("historie.matches")}</span>
			</div>
			{#each filterGroups as group (group.key)}
				<div class="rail-group" role="group" aria-labelledby="rail-{group.key}">
					<span id="rail-{group.key}" class="label rail-label">
						{$t(group.titleKey)}
					</span>
					<div class="rail-options">
						{#each group.options as opt (opt.value)}
							<button
								type="button"
								class="rail-opt"
								aria-pressed={group.current === opt.value}
								onclick={() => setFilter(group.key, opt.value)}
							>
								{opt.label}
							</button>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	</aside>
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
.historie {
	padding-bottom: 8px;
}

/* ── Hero (A: red band flush under the header) ─────────────────────── */
.head {
	display: flex;
	flex-direction: column;
	gap: 18px;
	padding-top: 20px;
	padding-bottom: 24px;
}

.title-row {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.title {
	margin: 0;
	font-size: 44px;
	text-shadow: var(--on-page-shadow);
}

.summary {
	display: flex;
	flex-wrap: wrap;
	align-items: baseline;
	gap: 6px;
	margin: 0;
	font-size: 15px;
	line-height: 1.3;
}

.count {
	font-weight: 700;
	white-space: nowrap;
}

.desc {
	display: inline-flex;
	flex-wrap: wrap;
	gap: 6px;
}

/* The pills scroll sideways edge to edge when they do not fit. */
.chip-row {
	display: flex;
	gap: 8px;
	margin-inline: calc(var(--page-gutter, 1rem) * -1);
	padding: 2px var(--page-gutter, 1rem);
	overflow-x: auto;
	scrollbar-width: none;
}

.chip-row::-webkit-scrollbar {
	display: none;
}

/* ── List ──────────────────────────────────────────────────────────── */
.loading {
	display: flex;
	justify-content: center;
	padding: 48px 0;
}

.group {
	display: flex;
	flex-direction: column;
	gap: 10px;
}

/* One column on phones, two or three side by side on desktop; cards in a
 * row share their height. */
.list {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(min(100%, 340px), 1fr));
	gap: 10px;
}

/* ── Desktop filter rail ───────────────────────────────────────────── */
.rail {
	display: none;
}

.rail-card {
	display: flex;
	flex-direction: column;
	gap: 20px;
	padding: 20px;
}

.rail-count {
	display: flex;
	align-items: baseline;
	gap: 8px;
}

.count-num {
	font-size: 48px;
	color: var(--color-brand);
}

.count-label,
.rail-label {
	color: var(--color-muted);
}

.rail-group {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.rail-options {
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
}

.rail-opt {
	min-height: 34px;
	padding: 0 12px;
	border: 0;
	border-radius: var(--radius-control);
	background: var(--color-sunken);
	color: var(--color-ink);
	font-family: var(--font-sans);
	font-size: 13px;
	font-weight: 600;
	cursor: pointer;
	transition:
		background-color 120ms,
		color 120ms;
}

.rail-opt:hover {
	background: var(--color-line);
}

.rail-opt[aria-pressed="true"] {
	background: var(--color-brand);
	color: var(--color-on-brand);
}

.rail-opt[aria-pressed="true"]:hover {
	background: var(--color-brand-strong);
}

@media (min-width: 1024px) {
	.historie {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 300px;
		align-items: start;
		gap: 32px;
		padding-bottom: 32px;
	}

	.head {
		display: none;
	}

	.rail {
		display: block;
		position: sticky;
		top: 92px;
	}
}

/* ── Design B: white title on the pitch, count as a pill ───────────── */
:global([data-variant="b"]) .head {
	gap: 12px;
	padding-top: 4px;
	padding-bottom: 0;
}

:global([data-variant="b"]) .title-row {
	flex-direction: row;
	flex-wrap: wrap;
	align-items: center;
	gap: 12px;
}

:global([data-variant="b"]) .title {
	font-size: 40px;
}

:global([data-variant="b"]) .count {
	padding: 4px 12px;
	border-radius: 999px;
	background: var(--color-surface);
	color: var(--color-ink);
	box-shadow: var(--shadow-control);
	font-size: 13px;
}

/* The pills below already name the active filters. */
:global([data-variant="b"]) .desc {
	display: none;
}

:global([data-variant="b"]) .count-num {
	color: var(--color-ink);
}

:global([data-variant="b"]) .rail-opt[aria-pressed="true"] {
	background: var(--color-navy);
	color: var(--color-on-navy);
}

@media (min-width: 1024px) {
	/* B's top bar scrolls away with the page. */
	:global([data-variant="b"]) .rail {
		top: 24px;
	}
}
</style>
