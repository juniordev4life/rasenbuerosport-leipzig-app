<script>
import { getTranslate } from "@tolgee/svelte";
import { untrack } from "svelte";
import { goto, replaceState } from "$app/navigation";
import UserIcon from "$lib/components/icons/UserIcon.svelte";
import UsersIcon from "$lib/components/icons/UsersIcon.svelte";
import AwardsStrip from "$lib/components/leaderboard/AwardsStrip.svelte";
import DuoRow from "$lib/components/leaderboard/DuoRow.svelte";
import PlayerRow from "$lib/components/leaderboard/PlayerRow.svelte";
import RanglisteHero from "$lib/components/leaderboard/RanglisteHero.svelte";
import SeasonSwitch from "$lib/components/leaderboard/SeasonSwitch.svelte";
import SeasonTalkrundeCard from "$lib/components/leaderboard/SeasonTalkrundeCard.svelte";
import InfoTip from "$lib/components/ui/InfoTip.svelte";
import Section from "$lib/components/ui/Section.svelte";
import SegmentedControl from "$lib/components/ui/SegmentedControl.svelte";
import { tolgee } from "$lib/config/i18n.config.js";
import { ROUTES } from "$lib/constants/routes.constants.js";
import {
	getLeagueSeasons,
	getSeasonAwards,
	getSeasonRating,
	getSeasonRecap,
} from "$lib/services/seasons.services.js";
import { user } from "$lib/stores/auth.stores.js";
import { selectedLeagueSeason } from "$lib/stores/leagueSeason.stores.js";
import {
	buildDuoId,
	findSeasonLeader,
	firstUnqualifiedIndex,
	sortPlayers,
} from "$lib/utils/leaderboard.utils.js";

const { t } = getTranslate();

let currentLanguage = $state(tolgee.getLanguage());

$effect(() => {
	const update = () => {
		currentLanguage = tolgee.getLanguage();
	};
	tolgee.on("language", update);
});

const currentLocale = $derived(currentLanguage === "de" ? "de-DE" : "en-US");

let seasons = $state([]);
let selectedSeasonId = $state(initialParam("season", "current"));
let skillTab = $state(initialParam("tab", "players", ["players", "duos"]));
let sort = $state(initialParam("sort", "current", ["current", "form"]));

let rating = $state(null);
let awards = $state([]);
let hasRecap = $state(false);

let loading = $state(true);
let error = $state(false);
/** Bumped by {@link retry} to force the load effect below to re-run
 *  after a failed fetch, even though the season didn't change. */
let reloadToken = $state(0);

const userId = $derived($user?.uid ?? null);

function initialParam(key, fallback, allowed) {
	if (typeof window === "undefined") return fallback;
	const v = new URL(window.location.href).searchParams.get(key);
	if (!v) return fallback;
	return allowed ? (allowed.includes(v) ? v : fallback) : v;
}

function syncUrl() {
	if (typeof window === "undefined") return;
	const url = new URL(window.location.href);
	const params = {
		season: selectedSeasonId,
		tab: skillTab,
		sort,
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
	const _t = skillTab;
	const _so = sort;
	void _s;
	void _t;
	void _so;
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
	void reloadToken;
	let aborted = false;
	(async () => {
		loading = true;
		error = false;
		let meta = null;
		try {
			const res = await getSeasonRating(seasonId);
			if (aborted) return;
			rating = res;
			meta = res.season;
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

const seasonMeta = $derived(rating?.season ?? null);
const isCurrentSeason = $derived(seasonMeta ? seasonMeta.is_current : true);

// Season games a player or duo needs to be listed. 5 mirrors the API for
// responses from before it sent ranking_min_games.
const minGames = $derived(rating?.season?.ranking_min_games ?? 5);

const sortedPlayers = $derived(sortPlayers(rating?.players ?? [], sort));
const heroPlayer = $derived(findSeasonLeader(rating?.players ?? []));
const dividerIndex = $derived(
	sort === "current" ? firstUnqualifiedIndex(sortedPlayers) : -1,
);

const recapHref = $derived(seasonMeta ? `/app/recap/${seasonMeta.id}` : null);

const showLeader = $derived(
	!loading && !error && skillTab === "players" && Boolean(heroPlayer),
);

/** "Spieler · FC27" / "Duos · FC26" above the list. */
const listTitle = $derived(
	[
		$t(
			skillTab === "players"
				? "leaderboard.tab_players"
				: "leaderboard.mode_duos",
		),
		seasonMeta?.game_version,
	]
		.filter(Boolean)
		.join(" · "),
);

const recordHeader = $derived(
	`${$t("leaderboard.w_short")}/${$t("leaderboard.d_short")}/${$t("leaderboard.l_short")}`,
);

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

<!-- Phone: one column — the hero band (title, switches, leader), the list,
     then the season-end extras. Desktop: the hero becomes a wide card
     (switches left, leader right) above a full-width table. -->
<div class="rl stack pb-4 lg:pb-8">
	<header class="hero bleed rl-hero" class:with-leader={showLeader}>
		<div class="rl-controls">
			<div class="rl-titlebar">
				<div class="rl-heading">
					<h1 class="page-title rl-title">{$t("leaderboard.title")}</h1>
					<InfoTip titleKey="info_tips.elo.title" bodyKey="info_tips.elo.body" size={18} />
				</div>
				<a href={ROUTES.COMPARE} class="btn btn-sm btn-accent rl-compare">
					{$t("leaderboard.compare")}
				</a>
			</div>

			<SeasonSwitch {seasons} value={selectedSeasonId} onChange={(v) => (selectedSeasonId = v)} />

			<div class="rl-toggles">
				<SegmentedControl
					options={[
						{ value: "players", label: $t("leaderboard.tab_players") },
						{ value: "duos", label: $t("leaderboard.mode_duos") },
					]}
					value={skillTab}
					onChange={(v) => (skillTab = v)}
					ariaLabel={$t("leaderboard.view_switch")}
					tone="brand"
				/>
				{#if skillTab === "players"}
					<SegmentedControl
						options={[
							{ value: "current", label: $t("leaderboard.sort_current") },
							{ value: "form", label: $t("leaderboard.sort_form") },
						]}
						value={sort}
						onChange={(v) => (sort = v)}
						ariaLabel={$t("leaderboard.sort")}
						tone="brand"
					/>
				{/if}
			</div>
		</div>

		{#if showLeader}
			<RanglisteHero
				player={heroPlayer}
				season={{ isCurrent: isCurrentSeason, gameVersion: seasonMeta?.game_version ?? "" }}
			/>
		{/if}
	</header>

	<div class="rl-main">
		{#if loading}
			<div class="flex justify-center py-12">
				<span class="spinner" role="status" aria-label={$t("common.loading")}></span>
			</div>
		{:else if error}
			<div class="card notice" role="alert">
				<p>{$t("leaderboard.error_generic")}</p>
				<button type="button" class="btn btn-primary btn-sm" onclick={retry}>
					{$t("leaderboard.retry")}
				</button>
			</div>
		{:else if skillTab === "players"}
			<Section title={listTitle}>
				{#snippet icon()}<UserIcon size={22} strokeWidth={2} />{/snippet}
				{#if sortedPlayers.length === 0}
					<p class="card notice">{$t("leaderboard.no_data", { minGames })}</p>
				{:else}
					<div class="card rows rl-table rl-players">
						<div class="label rl-head rl-head-players" aria-hidden="true">
							<span>#</span>
							<span></span>
							<span>{$t("leaderboard.tab_players")}</span>
							<span class="rl-wide">{$t("leaderboard.games_short")}</span>
							<span class="rl-wide">{recordHeader}</span>
							<span class="rl-wide">{$t("leaderboard.goals_short")}</span>
							<span>{$t("leaderboard.sort_form")}</span>
							<span class="rl-end">{$t("player_profile.rating")}</span>
						</div>
						{#each sortedPlayers as p, i (p.player_id)}
							{#if i === dividerIndex}
								<p class="label rl-divider">
									{$t("leaderboard.not_qualified_divider", {
										minGames: rating?.season?.min_games ?? 0,
									})}
								</p>
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
			</Section>
		{:else}
			<Section title={listTitle}>
				{#snippet icon()}<UsersIcon size={22} strokeWidth={2} />{/snippet}
				{#if (rating?.duos ?? []).length === 0}
					<p class="card notice">{$t("leaderboard.no_duos", { minGames })}</p>
				{:else}
					<div class="card rows rl-table rl-duos">
						<div class="label rl-head rl-head-duos" aria-hidden="true">
							<span>#</span>
							<span></span>
							<span>{$t("leaderboard.mode_duos")}</span>
							<span class="rl-wide">{$t("leaderboard.games_short")}</span>
							<span class="rl-wide">{recordHeader}</span>
							<span class="rl-wide">{$t("leaderboard.duo_total_games_short")}</span>
							<span class="rl-end">{$t("player_profile.rating")}</span>
						</div>
						{#each rating.duos as duo (duo.duo_id)}
							<DuoRow rank={duo.rank} {duo} onClick={handleDuoClick} />
						{/each}
					</div>
				{/if}
			</Section>
		{/if}
	</div>

	{#if !loading && !error && !isCurrentSeason}
		<div class="rl-extras">
			<AwardsStrip {awards} locale={currentLocale} />
			{#if seasonMeta?.talkrunde?.audio_url}
				<SeasonTalkrundeCard
					audioUrl={seasonMeta.talkrunde.audio_url}
					gameVersion={seasonMeta.game_version ?? ""}
				/>
			{/if}
			{#if hasRecap && recapHref}
				<a href={recapHref} class="btn btn-primary btn-lg rl-recap">
					{$t("leaderboard.recap_cta", { version: seasonMeta?.game_version ?? "" })}
				</a>
			{/if}
		</div>
	{/if}
</div>

<style>
/* ── Hero: red band in A (sits flush under the header), text on the
 *    pitch in B ─────────────────────────────────────────────────────── */
.rl-hero {
	display: flex;
	flex-direction: column;
	gap: 22px;
	padding-top: 20px;
	padding-bottom: 26px;
}

.rl-controls {
	display: flex;
	flex-direction: column;
	gap: 16px;
	min-width: 0;
}

.rl-titlebar {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
}

.rl-heading {
	display: flex;
	align-items: center;
	gap: 8px;
	min-width: 0;
}

.rl-title {
	margin: 0;
	font-size: 44px;
	text-shadow: var(--on-page-shadow);
}

.rl-compare {
	flex-shrink: 0;
}

.rl-toggles {
	display: flex;
	flex-wrap: wrap;
	justify-content: space-between;
	gap: 12px 24px;
}

/* A: the second row of tabs has no baseline (only the season tabs do). */
.rl-toggles :global(.seg) {
	border-bottom-color: transparent;
}

:global([data-variant="b"]) .rl-hero {
	gap: 14px;
	padding: 0;
}

:global([data-variant="b"]) .rl-controls {
	gap: 10px;
}

:global([data-variant="b"]) .rl-title {
	font-size: 40px;
	line-height: 1.1;
}

:global([data-variant="b"]) .rl-toggles {
	display: grid;
	grid-auto-flow: column;
	grid-auto-columns: minmax(0, 1fr);
	gap: 10px;
}

/* ── List ───────────────────────────────────────────────────────────── */
/* Columns and gap shared by the header row and the rows (PlayerRow,
 * DuoRow), so they line up. */
.rl-table {
	--col-gap: 8px;
}

.rl-players {
	--cols: 26px 40px minmax(0, 1fr) 44px 52px;
}

.rl-duos {
	--cols: 26px 60px minmax(0, 1fr) 52px;
}

.rl-head {
	display: none;
	grid-template-columns: var(--cols);
	align-items: center;
	column-gap: var(--col-gap);
	padding: 10px 12px;
	color: var(--color-muted);
}

.rl-head > span::first-letter {
	text-transform: uppercase;
}

.rl-head > span:first-child {
	text-align: center;
}

.rl-wide {
	display: none;
	text-align: right;
}

.rl-end {
	text-align: right;
}

/* B shows the header row on phones too (#, Spieler, Form, Elo). */
:global([data-variant="b"]) .rl-head-players {
	display: grid;
}

:global([data-variant="b"]) .rl-head {
	padding: 0 0 8px;
	font-size: 11px;
}

/* "unter N Spielen · nicht gewertet", between hairlines. */
.rl-divider {
	display: flex;
	align-items: center;
	gap: 10px;
	margin: 0;
	padding: 10px 12px;
	color: var(--color-muted);
	white-space: nowrap;
}

.rl-divider::before,
.rl-divider::after {
	content: "";
	flex: 1;
	height: 1px;
	background: var(--color-line);
}

:global([data-variant="b"]) .rl-divider {
	padding-inline: 0;
}

/* ── Season-end extras ──────────────────────────────────────────────── */
.rl-extras {
	display: contents;
}

.rl-recap {
	width: 100%;
}

/* ── Desktop: a wide hero card above a full-width table ─────────────── */
@media (min-width: 1024px) {
	.rl-hero {
		margin: 0;
		padding: 24px 28px;
		border-radius: var(--radius-card);
	}

	.rl-hero.with-leader {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		align-items: center;
		column-gap: 48px;
	}

	/* Season tabs and the actions share the first row; the page title is
	 * in the top bar on desktop. */
	.rl-controls {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		grid-template-areas:
			"seasons actions"
			"toggles toggles";
		align-items: start;
		gap: 18px 16px;
	}

	.rl-controls > :global(.seasons) {
		grid-area: seasons;
	}

	.rl-titlebar {
		grid-area: actions;
	}

	.rl-toggles {
		grid-area: toggles;
	}

	.rl-title {
		display: none;
	}

	.rl-table {
		--col-gap: 12px;
	}

	.rl-players {
		--cols: 36px 40px minmax(0, 1fr) 56px 96px 56px 96px 80px;
	}

	.rl-duos {
		--cols: 36px 60px minmax(0, 1fr) 56px 96px 64px 80px;
	}

	.rl-head {
		display: grid;
	}

	.rl-wide {
		display: block;
	}

	.rl-extras {
		display: flex;
		flex-direction: column;
		gap: var(--stack-gap);
	}

	.rl-recap {
		align-self: flex-start;
		width: auto;
	}
}
</style>
