<script>
import { getTranslate } from "@tolgee/svelte";
import ActiveChallengesCard from "$lib/components/challenges/ActiveChallengesCard.svelte";
import FrankCard from "$lib/components/home/FrankCard.svelte";
import QuickStats from "$lib/components/home/QuickStats.svelte";
import RecentHighlightsCard from "$lib/components/home/RecentHighlightsCard.svelte";
import RecentMatchesList from "$lib/components/home/RecentMatchesList.svelte";
import SectionHeader from "$lib/components/home/SectionHeader.svelte";
import SeriesList from "$lib/components/home/SeriesList.svelte";
import TalkrundeCard from "$lib/components/home/TalkrundeCard.svelte";
import Top3List from "$lib/components/home/Top3List.svelte";
import CheckIcon from "$lib/components/icons/CheckIcon.svelte";
import ClockIcon from "$lib/components/icons/ClockIcon.svelte";
import HistoryIcon from "$lib/components/icons/HistoryIcon.svelte";
import LightningIcon from "$lib/components/icons/LightningIcon.svelte";
import MicIcon from "$lib/components/icons/MicIcon.svelte";
import PlayIcon from "$lib/components/icons/PlayIcon.svelte";
import TrophyIcon from "$lib/components/icons/TrophyIcon.svelte";
import { ROUTES } from "$lib/constants/routes.constants.js";
import { get } from "$lib/services/api.services.js";
import { getLatestTalkshowEpisode } from "$lib/services/talkshow.services.js";
import { user } from "$lib/stores/auth.stores.js";
import {
	isOnboardingDone,
	ONBOARDING_KEYS,
	runOnboardingTour,
} from "$lib/utils/onboarding.utils.js";
import { detectUserSeries } from "$lib/utils/series.utils.js";

const { t } = getTranslate();

let games = $state([]);
let leaderboard = $state([]);
let talkshowEpisode = $state(null);
let loading = $state(true);

const userId = $derived($user?.uid ?? null);
const userName = $derived($user?.user_metadata?.username ?? "Spieler");

$effect(() => {
	let aborted = false;
	(async () => {
		try {
			const [gamesRes, lbRes, episode] = await Promise.all([
				get("/v1/games?limit=20"),
				get("/v1/leaderboard?limit=10"),
				// Talkshow is non-critical for the dashboard — if the
				// endpoint is slow or the episode doesn't exist yet, the
				// card just falls back to its empty-state placeholder.
				getLatestTalkshowEpisode().catch((err) => {
					console.warn("Talkshow load failed:", err);
					return null;
				}),
			]);
			if (aborted) return;
			games = gamesRes.data || [];
			leaderboard = lbRes.data || [];
			talkshowEpisode = episode;
		} catch (err) {
			console.error("Home load failed:", err);
		} finally {
			if (!aborted) loading = false;
		}
	})();
	return () => {
		aborted = true;
	};
});

// One-shot dashboard onboarding — fires after the cards mount so the
// tour anchors are real DOM nodes. Two rAFs let Svelte commit the
// `loading = false` branch first.
let tourTriggered = false;
$effect(() => {
	if (loading || tourTriggered) return;
	if (isOnboardingDone(ONBOARDING_KEYS.DASHBOARD)) return;
	tourTriggered = true;
	requestAnimationFrame(() => {
		requestAnimationFrame(() => {
			runOnboardingTour(ONBOARDING_KEYS.DASHBOARD);
		});
	});
});

/** ISO week number (Mon–Sun) for the German UI. */
function isoWeek(date) {
	const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
	const dayNum = (d.getDay() + 6) % 7;
	d.setDate(d.getDate() - dayNum + 3);
	const firstThursday = new Date(d.getFullYear(), 0, 4);
	const diff = d - firstThursday;
	return 1 + Math.round(diff / (7 * 24 * 60 * 60 * 1000));
}

const today = new Date();
const kalenderwoche = isoWeek(today);

/** Monday 00:00 of the current ISO week. */
function startOfIsoWeek(date) {
	const d = new Date(date);
	const dayNum = (d.getDay() + 6) % 7;
	d.setDate(d.getDate() - dayNum);
	d.setHours(0, 0, 0, 0);
	return d;
}

/** Games the logged-in user took part in. */
const myGames = $derived(
	userId
		? games.filter((g) => g.game_players?.some((p) => p.player_id === userId))
		: [],
);

const weekStart = startOfIsoWeek(today);
const myWeekGames = $derived(
	myGames.filter((g) => new Date(g.played_at) >= weekStart),
);

const weekStats = $derived.by(() => {
	let wins = 0;
	let losses = 0;
	let eloDelta = 0;
	for (const game of myWeekGames) {
		const player = game.game_players?.find((p) => p.player_id === userId);
		if (!player) continue;
		const homeScore = game.score_home ?? 0;
		const awayScore = game.score_away ?? 0;
		if (homeScore === awayScore) continue;
		const winnerSide = homeScore > awayScore ? "home" : "away";
		if (player.team === winnerSide) wins += 1;
		else losses += 1;
		const snap = game.elo_snapshot;
		if (snap) {
			const entry = [...(snap.teamA ?? []), ...(snap.teamB ?? [])].find(
				(e) => e.playerId === userId,
			);
			if (entry?.delta != null) eloDelta += entry.delta;
		}
	}
	return {
		wins,
		losses,
		matches: myWeekGames.length,
		eloDelta: Math.round(eloDelta),
	};
});

/**
 * Current ELO comes from the most recent `elo_snapshot.ratingAfter`
 * for the user — the leaderboard endpoint returns points, not ELO,
 * so we read it back from the games window instead.
 */
const myCurrentElo = $derived.by(() => {
	for (const game of myGames) {
		const snap = game.elo_snapshot;
		if (!snap) continue;
		const entry = [...(snap.teamA ?? []), ...(snap.teamB ?? [])].find(
			(e) => e.playerId === userId,
		);
		if (entry?.ratingAfter != null) return entry.ratingAfter;
	}
	return null;
});

/** Look up another player's latest ELO from the same games window. */
function latestEloFor(id) {
	for (const game of games) {
		const snap = game.elo_snapshot;
		if (!snap) continue;
		const entry = [...(snap.teamA ?? []), ...(snap.teamB ?? [])].find(
			(e) => e.playerId === id,
		);
		if (entry?.ratingAfter != null) return entry.ratingAfter;
	}
	return null;
}

const lastFiveResults = $derived.by(() => {
	const out = [];
	for (const game of myGames.slice(0, 5)) {
		const player = game.game_players?.find((p) => p.player_id === userId);
		if (!player) continue;
		const homeScore = game.score_home ?? 0;
		const awayScore = game.score_away ?? 0;
		if (homeScore === awayScore) {
			out.push("D");
			continue;
		}
		const winnerSide = homeScore > awayScore ? "home" : "away";
		out.push(player.team === winnerSide ? "W" : "L");
	}
	return out;
});

const series = $derived(detectUserSeries(myGames, userId, userName));

/**
 * Project the latest talkshow episode into the shape TalkrundeCard
 * consumes. `isFresh` is true when the episode is younger than
 * 7 days — drives the "Neu" ribbon on the card. Returns null when
 * no episode has been generated yet so the card falls back to its
 * placeholder copy.
 */
const talkrunde = $derived.by(() => {
	if (!talkshowEpisode) return null;
	const start = new Date(`${talkshowEpisode.week_start}T00:00:00`);
	const end = new Date(`${talkshowEpisode.week_end}T00:00:00`);
	const dayMonth = { day: "2-digit", month: "long" };
	const dayMonthYear = { day: "2-digit", month: "long", year: "numeric" };
	const rangeLabel = `${start.toLocaleDateString("de-DE", dayMonth)} – ${end.toLocaleDateString("de-DE", dayMonthYear)}`;

	const generatedAt = new Date(talkshowEpisode.generated_at);
	const ageMs = Date.now() - generatedAt.getTime();
	const FRESH_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
	const isFresh = ageMs < FRESH_WINDOW_MS;

	return {
		title: $t("home.talkrunde.active_title"),
		subtitle: rangeLabel,
		audioUrl: talkshowEpisode.audio_url ?? null,
		isFresh,
	};
});

function formatMatchDate(iso) {
	const d = new Date(iso);
	return d.toLocaleDateString("de-DE", { day: "2-digit", month: "short" });
}

const recentMatches = $derived(
	myGames.slice(0, 3).map((game) => {
		const player = game.game_players?.find((p) => p.player_id === userId);
		const opponents =
			game.game_players
				?.filter((p) => p.team !== player?.team)
				.map((p) => p.profiles?.username ?? "?")
				.join(" & ") ?? "?";
		const homeScore = game.score_home ?? 0;
		const awayScore = game.score_away ?? 0;
		const isDraw = homeScore === awayScore;
		const winnerSide = !isDraw && (homeScore > awayScore ? "home" : "away");
		// `null` when the logged-in user wasn't in the match — the pill
		// is meaningful only relative to them, so the list should hide
		// it rather than show the home-team perspective.
		const result = !player
			? null
			: isDraw
				? "draw"
				: player.team === winnerSide
					? "win"
					: "loss";
		const snap = game.elo_snapshot;
		const eloEntry = snap
			? [...(snap.teamA ?? []), ...(snap.teamB ?? [])].find(
					(e) => e.playerId === userId,
				)
			: null;
		return {
			id: game.id,
			opponent: opponents,
			dateLabel: formatMatchDate(game.played_at),
			mode: game.mode ?? "—",
			result,
			score: `${homeScore}:${awayScore}`,
			eloDelta: eloEntry?.delta ?? null,
		};
	}),
);

// The /v1/leaderboard endpoint sorts by points, not ELO. For the
// dashboard top-3 we want the actual ELO podium — so resolve each
// player's latest ELO from the games window and sort by that.
// Players whose ELO can't be resolved drop to the back.
const top3 = $derived(
	leaderboard
		.map((row) => ({
			id: row.player_id,
			name: row.username ?? "?",
			elo: latestEloFor(row.player_id),
			avatarUrl: row.avatar_url ?? null,
		}))
		.sort((a, b) => (b.elo ?? -Infinity) - (a.elo ?? -Infinity))
		.slice(0, 3),
);
</script>

<svelte:head>
	<title>RasenBürosport</title>
</svelte:head>

<div class="flex flex-col pb-2 lg:pb-8">
	{#if loading}
		<div class="flex justify-center py-12">
			<div class="animate-spin h-8 w-8 border-2 border-accent-red border-t-transparent rounded-full"></div>
		</div>
	{:else}
		<!-- `contents` keeps the mobile single-column stack byte-for-byte;
		     at `lg` the wrapper becomes the bento grid. -->
		<div class="contents lg:grid lg:grid-cols-12 lg:auto-rows-min lg:gap-4 lg:items-start">
			<div data-onboarding="dashboard-week" class="lg:col-span-5">
				<FrankCard
					{userName}
					wins={weekStats.wins}
					losses={weekStats.losses}
					matches={weekStats.matches}
					eloDelta={weekStats.eloDelta}
					{kalenderwoche}
				/>
			</div>

			<!-- Desktop-only: browse recent highlight reels on the laptop. -->
			<div class="hidden lg:flex lg:flex-col lg:col-span-7">
				<SectionHeader title={$t("home.sections.highlights")}>
					{#snippet icon()}<PlayIcon size={11} />{/snippet}
				</SectionHeader>
				<RecentHighlightsCard {games} />
			</div>

			<div class="lg:col-span-6 lg:flex lg:flex-col">
				<SectionHeader title={$t("home.sections.challenges")}>
					{#snippet icon()}<CheckIcon size={11} strokeWidth={1.8} />{/snippet}
				</SectionHeader>
				<ActiveChallengesCard />
			</div>

			<div class="lg:col-span-6 lg:flex lg:flex-col">
				<SectionHeader
					title={$t("home.sections.talkrunde")}
					href={ROUTES.WRAPPED}
					actionLabel={$t("home.sections.talkrunde_action")}
				>
					{#snippet icon()}<MicIcon size={11} strokeWidth={1.8} />{/snippet}
				</SectionHeader>
				<TalkrundeCard {talkrunde} />
			</div>

			{#if series.length > 0}
				<div class="lg:col-span-12 lg:flex lg:flex-col">
					<SectionHeader title={$t("home.sections.series")}>
						{#snippet icon()}<LightningIcon size={11} strokeWidth={1.8} />{/snippet}
					</SectionHeader>
					<SeriesList {series} />
				</div>
			{/if}

			<div class="lg:col-span-4 lg:flex lg:flex-col">
				<SectionHeader
					title={$t("home.sections.quick_stats")}
					href={ROUTES.PROFILE}
					actionLabel={$t("home.sections.action_profile")}
				>
					{#snippet icon()}<ClockIcon size={11} strokeWidth={1.8} />{/snippet}
				</SectionHeader>
				<div data-onboarding="dashboard-quickstats">
					<QuickStats
						elo={myCurrentElo}
						eloDelta={weekStats.eloDelta}
						lastFive={lastFiveResults}
					/>
				</div>
			</div>

			<div class="lg:col-span-4 lg:flex lg:flex-col">
				<SectionHeader
					title={$t("home.sections.recent_matches")}
					href={ROUTES.GAMES}
					actionLabel={$t("home.sections.action_all")}
				>
					{#snippet icon()}<HistoryIcon size={11} strokeWidth={1.8} />{/snippet}
				</SectionHeader>
				<div data-onboarding="dashboard-recent">
					<RecentMatchesList matches={recentMatches} />
				</div>
			</div>

			<div class="lg:col-span-4 lg:flex lg:flex-col">
				<SectionHeader
					title={$t("home.sections.top3")}
					href={ROUTES.LEADERBOARD}
					actionLabel={$t("home.sections.action_ranking")}
				>
					{#snippet icon()}<TrophyIcon size={11} strokeWidth={1.8} />{/snippet}
				</SectionHeader>
				<div data-onboarding="dashboard-top3">
					<Top3List {top3} />
				</div>
			</div>
		</div>
	{/if}
</div>
