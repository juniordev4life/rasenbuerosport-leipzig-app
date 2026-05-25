<script>
import { getTranslate } from "@tolgee/svelte";
import { page } from "$app/state";
import ContributionSection from "$lib/components/duo/ContributionSection.svelte";
import DuoHero from "$lib/components/duo/DuoHero.svelte";
import DuoSpiderSection from "$lib/components/duo/DuoSpiderSection.svelte";
import KpiRow from "$lib/components/duo/KpiRow.svelte";
import OnboardingCard from "$lib/components/duo/OnboardingCard.svelte";
import RecentMatchesSection from "$lib/components/duo/RecentMatchesSection.svelte";
import { get } from "$lib/services/api.services.js";
import {
	computeLifecycle,
	deriveChemistry,
	deriveSophieHeroQuote,
	deriveSpiderValues,
	generateDuoTags,
} from "$lib/utils/duoProfile.utils.js";

const { t } = getTranslate();

let detail = $state(null);
let loading = $state(true);
let errorMsg = $state(null);

const duoId = $derived(page.params.id ?? "");
const ids = $derived(duoId.split("_").filter(Boolean));

$effect(() => {
	if (ids.length !== 2) {
		errorMsg = $t("duo.invalid_id");
		loading = false;
		return;
	}
	let aborted = false;
	loading = true;
	errorMsg = null;
	(async () => {
		try {
			const res = await get(`/v1/duos/${ids[0]}/${ids[1]}`);
			if (aborted) return;
			detail = res.data ?? null;
		} catch (err) {
			if (aborted) return;
			errorMsg = err?.message || $t("duo.load_error");
		} finally {
			if (!aborted) loading = false;
		}
	})();
	return () => {
		aborted = true;
	};
});

const lifecycle = $derived(computeLifecycle(detail?.total_games ?? 0));
const spiderValues = $derived(detail ? deriveSpiderValues(detail) : null);
const chemistry = $derived(detail ? deriveChemistry(detail) : null);
const tags = $derived(
	spiderValues
		? generateDuoTags(spiderValues)
		: { strengths: [], weaknesses: [], character: [] },
);

const archetype = $derived.by(() => {
	if (!detail || lifecycle === "fresh") return null;
	const winning = detail.win_rate ?? 0;
	const possession = detail.avg_match_stats?.avg_possession ?? null;
	if (winning >= 60 && possession != null && possession < 50) {
		return $t("duo.archetypes.counter_kings");
	}
	if (possession != null && possession >= 60) {
		return $t("duo.archetypes.controllers");
	}
	if (winning >= 60) {
		return $t("duo.archetypes.efficient");
	}
	return $t("duo.archetypes.balanced");
});

const sophieQuote = $derived(
	detail
		? deriveSophieHeroQuote(
				lifecycle,
				{
					win_rate: detail.win_rate ?? 0,
					total_games: detail.total_games ?? 0,
				},
				{
					freshKey: "duo.sophie.fresh",
					findingKey: "duo.sophie.finding",
					matureKeyHigh: "duo.sophie.mature_high",
					matureKeyMid: "duo.sophie.mature_mid",
					matureKeyLow: "duo.sophie.mature_low",
				},
				(key, params) => $t(key, params),
			)
		: "",
);

const kpiCards = $derived.by(() => {
	if (!detail) return [];
	const goalsFor =
		detail.recent_games?.reduce((acc, g) => acc + scoreFor(g, detail), 0) ?? 0;
	const goalsAgainst =
		detail.recent_games?.reduce((acc, g) => acc + scoreAgainst(g, detail), 0) ??
		0;
	const recentGames = detail.recent_games?.length ?? 0;
	const goalsPerGame =
		recentGames > 0
			? (goalsFor / recentGames).toFixed(1).replace(".", ",")
			: "—";
	const concededPerGame =
		recentGames > 0
			? (goalsAgainst / recentGames).toFixed(1).replace(".", ",")
			: "—";

	return [
		{
			label: $t("duo.kpi.matches"),
			value: String(detail.total_games ?? 0),
			meta:
				lifecycle === "fresh"
					? $t("duo.kpi.matches_meta_fresh")
					: $t("duo.kpi.matches_meta_some", { count: detail.total_games ?? 0 }),
			tone: "neutral",
		},
		{
			label: $t("duo.kpi.win_rate"),
			value: `${detail.win_rate ?? 0}%`,
			meta:
				lifecycle === "fresh"
					? null
					: `${detail.wins ?? 0} ${$t("duo.w_short")} · ${detail.losses ?? 0} ${$t("duo.l_short")}`,
			tone: (detail.win_rate ?? 0) >= 50 ? "positive" : "neutral",
		},
		{
			label: $t("duo.kpi.goals_per_game"),
			value: goalsPerGame,
			meta: $t("duo.kpi.based_on_recent"),
			tone: "neutral",
		},
		{
			label: $t("duo.kpi.goals_against"),
			value: concededPerGame,
			meta: $t("duo.kpi.based_on_recent"),
			tone: "neutral",
		},
	];
});

function scoreFor(game, ctx) {
	const side = ourSide(game, ctx);
	if (!side) return 0;
	return side === "home" ? (game.score_home ?? 0) : (game.score_away ?? 0);
}

function scoreAgainst(game, ctx) {
	const side = ourSide(game, ctx);
	if (!side) return 0;
	return side === "home" ? (game.score_away ?? 0) : (game.score_home ?? 0);
}

function ourSide(game, ctx) {
	const us = game.game_players?.find(
		(p) => p.player_id === ctx.player1.player_id,
	);
	return us?.team ?? null;
}

const recentRows = $derived.by(() => {
	if (!detail?.recent_games) return [];
	return detail.recent_games.map((g) => {
		const side = ourSide(g, detail);
		const my = side === "home" ? g.score_home : g.score_away;
		const opp = side === "home" ? g.score_away : g.score_home;
		const isDraw = my === opp;
		const result = isDraw ? "D" : my > opp ? "W" : "L";
		const opponentNames = (g.game_players ?? [])
			.filter((p) => p.team !== side)
			.map((p) => p.profiles?.username ?? "?")
			.join(" & ");

		let eloDelta = null;
		const snap = g.elo_snapshot ?? g.match_stats?.elo_snapshot;
		if (snap) {
			const entry = [...(snap.teamA ?? []), ...(snap.teamB ?? [])].find(
				(e) => e.playerId === detail.player1.player_id,
			);
			eloDelta = entry?.delta ?? null;
		}

		return {
			id: g.id,
			result,
			opponentNames: opponentNames || "—",
			dateLabel: formatDate(g.played_at),
			score: `${my}:${opp}`,
			eloDelta,
		};
	});
});

function formatDate(iso) {
	if (!iso) return "";
	return new Date(iso).toLocaleDateString("de-DE", {
		day: "2-digit",
		month: "short",
	});
}

/**
 * Per-player contribution rows. The backend does not yet break goals /
 * assists down per player on the duo endpoint, so the section stays
 * hidden until that data is wired in.
 */
const contributionRows = $derived.by(() => []);
</script>

<svelte:head>
	<title>RasenBürosport - {$t("duo.title")}</title>
</svelte:head>

<div class="mx-auto max-w-3xl p-3">

	{#if loading}
		<div class="flex justify-center py-12">
			<div class="animate-spin h-8 w-8 border-2 border-success border-t-transparent rounded-full"></div>
		</div>
	{:else if errorMsg}
		<div class="bg-bg-secondary border border-error/60 rounded-2xl p-6 text-center text-error">
			{errorMsg}
		</div>
	{:else if detail}
		<div class="flex flex-col gap-3 pb-4">
			<DuoHero
				player1={detail.player1}
				player2={detail.player2}
				archetype={lifecycle === "fresh" ? $t("duo.archetypes.fresh") : archetype}
				archetypeTentative={lifecycle === "finding"}
				chemistryScore={chemistry}
				rankInfo={null}
				sophieQuote={sophieQuote || $t("duo.sophie.fresh")}
			/>

			<KpiRow cards={kpiCards} />

			{#if lifecycle === "fresh"}
				<OnboardingCard matchCount={detail.total_games ?? 0} target={10} />
			{:else if spiderValues}
				<DuoSpiderSection
					values={spiderValues}
					duoName={`${detail.player1.username} & ${detail.player2.username}`}
					{tags}
					tentative={lifecycle === "finding"}
				/>

				{#if contributionRows.length > 0}
					<ContributionSection
						player1={detail.player1}
						player2={detail.player2}
						rows={contributionRows}
					/>
				{/if}
			{/if}

			<RecentMatchesSection matches={recentRows} />
		</div>
	{/if}
</div>
