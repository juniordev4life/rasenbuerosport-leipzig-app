<script>
import { getTranslate } from "@tolgee/svelte";
import { goto } from "$app/navigation";
import AxisInfoModal from "$lib/components/playerProfile/AxisInfoModal.svelte";
import { get } from "$lib/services/api.services.js";
import {
	getPlayerCareerStats,
	getPlayerProfile,
} from "$lib/services/playerProfile.services.js";
import { buildEloHistory } from "$lib/utils/eloHistory.utils.js";
import {
	isOnboardingDone,
	ONBOARDING_KEYS,
	runOnboardingTour,
} from "$lib/utils/onboarding.utils.js";
import { relationCardWinRatePercent } from "$lib/utils/winRate.utils.js";
import AwardsSection from "./AwardsSection.svelte";
import FormSection from "./FormSection.svelte";
import LifetimeStatsSection from "./LifetimeStatsSection.svelte";
import ProfileHero from "./ProfileHero.svelte";
import ProfileSpiderSection from "./ProfileSpiderSection.svelte";
import RelationsSection from "./RelationsSection.svelte";

/**
 * Renders the full new-design Spielerprofil for a given playerId.
 * Pulls the V2 profile (`/v1/players/:id/profile`) for axes / bio /
 * relationships and the games window (`/v1/games`) for ELO history,
 * derived lifetime stats and the form sparkline.
 *
 * `isOwnProfile=true` triggers the first-run onboarding tour once the
 * page has loaded — the foreign-player view (`/app/profile/[id]`)
 * passes `false` so we don't re-prompt the tour on every visit.
 *
 * @type {{ playerId: string|null, isOwnProfile?: boolean, onSelectRelation?: (rel: {type:string, playerId:string}) => void }}
 */
let { playerId, isOwnProfile = false, onSelectRelation = null } = $props();

const { t } = getTranslate();

let profile = $state(null);
let games = $state([]);
let careerStats = $state(null);
let loading = $state(true);
let errorMsg = $state(null);
let activeAxis = $state(null);

$effect(() => {
	const id = playerId;
	if (!id) return;
	let aborted = false;
	loading = true;
	errorMsg = null;
	(async () => {
		try {
			const [profileData, gamesRes, careerRes] = await Promise.all([
				getPlayerProfile(id),
				get("/v1/games?limit=200"),
				getPlayerCareerStats(id).catch((err) => {
					console.warn("Career stats unavailable:", err);
					return null;
				}),
			]);
			if (aborted) return;
			profile = profileData;
			games = gamesRes.data ?? [];
			careerStats = careerRes ?? null;
		} catch (err) {
			if (aborted) return;
			errorMsg = err?.message || $t("player_profile.error");
		} finally {
			if (!aborted) loading = false;
		}
	})();
	return () => {
		aborted = true;
	};
});

// One-shot profile onboarding — fires after the sections render, but
// only on the user's own profile (foreign-player view passes
// `isOwnProfile=false`).
let tourTriggered = false;
$effect(() => {
	if (!isOwnProfile || loading || !profile || tourTriggered) return;
	if (isOnboardingDone(ONBOARDING_KEYS.PROFILE)) return;
	tourTriggered = true;
	requestAnimationFrame(() => {
		requestAnimationFrame(() => {
			runOnboardingTour(ONBOARDING_KEYS.PROFILE);
		});
	});
});

const eloEntry = $derived.by(() => {
	if (!playerId || games.length === 0) return null;
	const history = buildEloHistory(games, { mode: "all" });
	return history.get(playerId) ?? null;
});

const recentResults = $derived.by(() => {
	const recent = profile?.recentForm ?? [];
	return recent.slice(0, 5).map((r) => {
		const code = (r.result ?? r.type ?? "").toLowerCase();
		if (code === "win" || code === "w" || code === "s") return "W";
		if (code === "loss" || code === "l" || code === "n") return "L";
		return "D";
	});
});

const formEloSeries = $derived.by(() => {
	const all = eloEntry?.ratings ?? [];
	return all.slice(-5);
});

const formEloStart = $derived(
	formEloSeries.length > 0 ? formEloSeries[0] : null,
);
const formEloEnd = $derived(
	formEloSeries.length > 0 ? formEloSeries[formEloSeries.length - 1] : null,
);
const formEloDelta = $derived(
	formEloStart != null && formEloEnd != null
		? Math.round(formEloEnd - formEloStart)
		: 0,
);

/**
 * Lifetime stats come from `/v1/stats/:id` (server-side aggregation
 * over the full history, no client-side window cap). The backend
 * returns snake_case from the SQL aggregates — map it once here so the
 * card stays clean.
 */
const lifetimeStats = $derived.by(() => {
	const stats = careerStats;
	if (!stats) {
		return {
			totalGoals: null,
			goalsPerGame: null,
			totalAssists: null,
			assistsPerGame: null,
			longestWinStreak: null,
			hattricks: null,
			highestWin: null,
			peakElo: null,
		};
	}
	return {
		totalGoals: stats.total_individual_goals ?? null,
		goalsPerGame: stats.goals_per_game ?? null,
		totalAssists: stats.total_assists ?? null,
		assistsPerGame: stats.assists_per_game ?? null,
		longestWinStreak: stats.longest_win_streak || null,
		hattricks: stats.hattricks ?? null,
		highestWin: stats.highest_win
			? {
					score: stats.highest_win.score,
					opponentName: stats.highest_win.opponent_name ?? "—",
					date: formatDateShort(stats.highest_win.played_at),
				}
			: null,
		peakElo: stats.peak_elo
			? {
					value: stats.peak_elo.value,
					date: formatDateShort(stats.peak_elo.played_at),
				}
			: null,
	};
});

function formatDateShort(iso) {
	if (!iso) return "";
	const d = new Date(iso);
	return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
}

const heroMarcelQuote = $derived(
	profile?.archetype?.bio || $t("profile.marcel_fallback_character"),
);

const formMarcelQuote = $derived.by(() => {
	if (recentResults.length === 0)
		return $t("profile.marcel_fallback_form_empty");
	const wins = recentResults.filter((r) => r === "W").length;
	if (formEloDelta > 0) {
		return $t("profile.marcel_fallback_form_up", {
			wins,
			total: recentResults.length,
		});
	}
	if (formEloDelta < 0) {
		return $t("profile.marcel_fallback_form_down", {
			wins,
			total: recentResults.length,
		});
	}
	return $t("profile.marcel_fallback_form_flat", {
		wins,
		total: recentResults.length,
	});
});

const archetypeLabel = $derived.by(() => {
	if (!profile?.archetype) return null;
	// Join adjective and label with a typographic en-dash ("solide – Der
	// Zuverlässige") so the two halves read as separate concepts. When
	// the adjective is absent we just show the label without a stray
	// leading dash.
	const adj = profile.archetype.adjective?.trim();
	const label = profile.archetype.label ?? "";
	return adj ? `${adj} – ${label}` : label;
});

const relations = $derived({
	favorite: profile?.relationships?.lieblingsgegner
		? {
				playerId: profile.relationships.lieblingsgegner.playerId,
				name: profile.relationships.lieblingsgegner.username,
				avatarUrl: profile.relationships.lieblingsgegner.avatarUrl,
				wins: profile.relationships.lieblingsgegner.wins ?? 0,
				losses: profile.relationships.lieblingsgegner.losses ?? 0,
				winRate: relationCardWinRatePercent(
					profile.relationships.lieblingsgegner,
				),
			}
		: null,
	nemesis: profile?.relationships?.angstgegner
		? {
				playerId: profile.relationships.angstgegner.playerId,
				name: profile.relationships.angstgegner.username,
				avatarUrl: profile.relationships.angstgegner.avatarUrl,
				wins: profile.relationships.angstgegner.wins ?? 0,
				losses: profile.relationships.angstgegner.losses ?? 0,
				winRate: relationCardWinRatePercent(profile.relationships.angstgegner),
			}
		: null,
	topPartner: profile?.relationships?.topPartner
		? {
				playerId: profile.relationships.topPartner.playerId,
				name: profile.relationships.topPartner.username,
				avatarUrl: profile.relationships.topPartner.avatarUrl,
				matches: profile.relationships.topPartner.totalMatches ?? 0,
				winRate: relationCardWinRatePercent(profile.relationships.topPartner),
			}
		: null,
});

// Win-rate conversion (API ratio [0, 1] → integer percent [0, 100],
// with fallback to recomputing from wins/totalMatches when the field
// is missing) lives in `relationCardWinRatePercent` so the math
// stays in one place. Used directly above in the `relations`
// $derived block.

const awards = $derived(
	(profile?.topBadges ?? []).map((b, idx) => ({
		id: b.type ?? `badge-${idx}`,
		name: $t(`profile.badges.${b.type}`) ?? b.type,
		description: b.unlockedAt ? formatDateShort(b.unlockedAt) : "",
		type: deriveBadgeType(b.type),
		icon: b.emoji ?? null,
		unlockedAt: b.unlockedAt ?? null,
	})),
);

function deriveBadgeType(type) {
	if (!type) return "gold";
	if (type.endsWith("_gold")) return "gold";
	if (type.endsWith("_silber") || type.endsWith("_silver")) return "silver";
	if (type.endsWith("_bronze")) return "bronze";
	return "spark";
}

const totalsWins = $derived(profile?.player?.wins ?? eloEntry?.wins ?? 0);
const totalsDraws = $derived(profile?.player?.draws ?? eloEntry?.draws ?? 0);
const totalsLosses = $derived(profile?.player?.losses ?? eloEntry?.losses ?? 0);
</script>

{#if loading}
	<div class="flex justify-center py-12">
		<div class="animate-spin h-8 w-8 border-2 border-accent-red border-t-transparent rounded-full"></div>
	</div>
{:else if errorMsg}
	<div class="bg-bg-secondary border border-error/60 rounded-2xl p-6 text-center text-error">
		{errorMsg}
	</div>
{:else if profile}
	<div class="flex flex-col gap-3 pb-4">
		<div data-onboarding="profile-hero">
			<ProfileHero
				playerId={profile.player.id ?? playerId}
				username={profile.player.name}
				initials={profile.player.initials ?? (profile.player.name ?? "?").charAt(0).toUpperCase()}
				avatarUrl={profile.player.avatarUrl}
				archetype={archetypeLabel}
				rank={profile.player.rank ?? null}
				matchCount={profile.player.matchCount ?? 0}
				currentRating={eloEntry?.currentRating ?? profile.player.currentRating ?? null}
				ratings={eloEntry?.ratings ?? []}
				weekDelta={eloEntry?.weekDelta ?? 0}
				wins={totalsWins}
				draws={totalsDraws}
				losses={totalsLosses}
				marcelQuote={heroMarcelQuote}
			/>
		</div>

		{#if profile.axes}
			<div data-onboarding="profile-spider">
				<ProfileSpiderSection
					axes={profile.axes}
					playerName={profile.player.name}
					onAxisClick={(key) => (activeAxis = key)}
				/>
			</div>
		{/if}

		{#if recentResults.length > 0}
			<div data-onboarding="profile-form">
				<FormSection
					results={recentResults}
					eloSeries={formEloSeries}
					eloStart={formEloStart}
					eloEnd={formEloEnd}
					eloDelta={formEloDelta}
					marcelQuote={formMarcelQuote}
				/>
			</div>
		{/if}

		<div data-onboarding="profile-relations">
			<RelationsSection
				favorite={relations.favorite}
				nemesis={relations.nemesis}
				topPartner={relations.topPartner}
				onSelect={onSelectRelation}
			/>
		</div>

		<LifetimeStatsSection stats={lifetimeStats} />

		<div data-onboarding="profile-awards">
			<AwardsSection
				{awards}
				totalCount={profile.totalBadges ?? null}
				unlockedCount={awards.length}
				onViewAll={() =>
					goto(
						isOwnProfile
							? "/app/profile/trophies"
							: `/app/profile/${playerId}/trophies`,
					)}
			/>
		</div>
	</div>

	<AxisInfoModal
		axisKey={activeAxis}
		value={activeAxis ? profile?.axes?.[activeAxis] : null}
		onClose={() => (activeAxis = null)}
	/>
{/if}
