<script>
import { getTranslate } from "@tolgee/svelte";
import PlayIcon from "$lib/components/icons/PlayIcon.svelte";
import RecapCard from "../RecapCard.svelte";
import RecapSlide from "../RecapSlide.svelte";
import RecapStatGrid from "../RecapStatGrid.svelte";

/**
 * Slide 6 — the match of the season, plus a few small season facts
 * (biggest win, highest-scoring game, most common score, favorite and
 * best club).
 *
 * @type {{ recap: object }}
 */
let { recap } = $props();

const { t } = getTranslate();
const stats = $derived(recap.stats ?? {});
const mos = $derived(stats.match_of_season);

const facts = $derived(
	[
		stats.biggest_win && {
			key: "biggest_win",
			label: $t("season_recap.match_of_season.biggest_win"),
			value: stats.biggest_win.score,
		},
		stats.highest_scoring_game && {
			key: "highest_scoring",
			label: $t("season_recap.match_of_season.highest_scoring"),
			value: stats.highest_scoring_game.score,
		},
		stats.most_common_score && {
			key: "most_common_score",
			label: $t("season_recap.match_of_season.most_common_score"),
			value: stats.most_common_score.score,
			extra: `×${stats.most_common_score.count}`,
		},
		stats.favorite_club && {
			key: "favorite_club",
			label: $t("season_recap.match_of_season.favorite_club"),
			value: stats.favorite_club.name,
			text: true,
		},
		stats.best_club && {
			key: "best_club",
			label: $t("season_recap.match_of_season.best_club"),
			value: stats.best_club.name,
			extra: `${Math.round(stats.best_club.win_rate * 100)}%`,
			text: true,
		},
	].filter(Boolean),
);

function formatDate(iso) {
	if (!iso) return "";
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return "";
	return d.toLocaleDateString("de-DE", { day: "2-digit", month: "short" });
}
</script>

<RecapSlide title={$t("season_recap.match_of_season.title")}>
	{#if mos}
		<RecapCard>
			{#if mos.result_type === "penalty"}
				<span class="chip chip-gold badge">
					{$t("season_recap.match_of_season.penalty_badge")}
				</span>
			{/if}
			<p class="mos-score">{mos.score}</p>
			<div class="mos-meta">
				<p class="mos-teams">
					{(mos.home_players ?? []).join(" & ")} vs {(mos.away_players ?? []).join(" & ")}
				</p>
				<p class="recap-note">{formatDate(mos.played_at)}</p>
			</div>
			{#if mos.highlight_url}
				<a
					href={mos.highlight_url}
					target="_blank"
					rel="noopener noreferrer"
					class="btn btn-sm btn-accent watch"
				>
					<PlayIcon size={14} />
					{$t("season_recap.match_of_season.watch_highlight")}
				</a>
			{/if}
		</RecapCard>
	{/if}

	{#if facts.length > 0}
		<RecapCard>
			<RecapStatGrid items={facts} />
		</RecapCard>
	{/if}
</RecapSlide>

<style>
.badge {
	align-self: flex-start;
}

.mos-score {
	align-self: flex-start;
	margin: 0;
	font-family: var(--font-num);
	font-weight: var(--num-weight);
	font-variant-numeric: tabular-nums;
	font-size: min(104px, 28cqw);
	line-height: 0.85;
}

.mos-meta {
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.mos-teams {
	margin: 0;
	font-family: var(--font-cond);
	font-weight: 700;
	font-size: 18px;
	line-height: 1.2;
	letter-spacing: 0.02em;
	text-transform: var(--title-case);
	overflow-wrap: anywhere;
}

.watch {
	align-self: flex-start;
}

/* B: the score in its dark green chip, as everywhere else in B. */
:global([data-variant="b"]) .mos-score {
	padding: 10px 18px;
	border-radius: 16px;
	background: var(--color-score);
	color: var(--color-on-score);
	font-size: min(64px, 18cqw);
	line-height: 1;
}

:global([data-variant="b"]) .mos-teams {
	font-weight: 800;
	letter-spacing: 0;
}
</style>
