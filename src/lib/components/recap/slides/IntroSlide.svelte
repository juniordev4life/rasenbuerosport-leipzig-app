<script>
import { getTranslate } from "@tolgee/svelte";
import PlayerAvatar from "$lib/components/ui/PlayerAvatar.svelte";
import RecapCard from "../RecapCard.svelte";
import RecapHeroNumber from "../RecapHeroNumber.svelte";
import RecapSlide from "../RecapSlide.svelte";

/**
 * Slide 1 — intro: season dates, the player's avatar and their total
 * games this season.
 *
 * @type {{ recap: object, reducedMotion: boolean }}
 */
let { recap, reducedMotion } = $props();

const { t } = getTranslate();

function formatDate(iso) {
	if (!iso) return "";
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return "";
	return d.toLocaleDateString("de-DE", {
		day: "2-digit",
		month: "long",
		year: "numeric",
	});
}

const dateRange = $derived(
	`${formatDate(recap.season?.starts_at)} – ${formatDate(recap.season?.ends_at)}`,
);
</script>

<RecapSlide>
	<div class="intro-head">
		<PlayerAvatar player={recap.player} size={88} class="intro-avatar" />
		<p class="dates">{dateRange}</p>
		<h1 class="page-title intro-title">
			{$t("season_recap.intro.title", { version: recap.season?.game_version ?? "" })}
		</h1>
	</div>

	<RecapCard>
		<p class="player-name">{recap.player?.username}</p>
		{#if recap.stats?.games}
			<RecapHeroNumber
				value={recap.stats.games}
				label={$t("season_recap.intro.games")}
				accent
				reduced={reducedMotion}
			/>
		{/if}
		{#if recap.league}
			<p class="recap-note">
				{$t("season_recap.intro.league_facts", {
					version: recap.season?.game_version ?? "",
					games: recap.league.games,
					goals: recap.league.goals,
				})}
			</p>
		{/if}
	</RecapCard>
</RecapSlide>

<style>
.intro-head {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 12px;
}

/* A: a white frame around the square picture; B: a gold ring. */
.intro-head :global(.intro-avatar) {
	margin-bottom: 6px;
	box-shadow: 0 0 0 4px currentColor;
}

.dates {
	margin: 0;
	font-family: var(--font-cond);
	font-weight: 700;
	font-size: 14px;
	letter-spacing: 0.03em;
	text-transform: uppercase;
}

.intro-title {
	margin: 0;
	font-size: min(52px, 14cqw);
	text-wrap: balance;
	text-shadow: var(--on-page-shadow);
}

.player-name {
	margin: 0;
	font-family: var(--font-cond);
	font-weight: 700;
	font-size: 22px;
	line-height: 1.1;
	letter-spacing: 0.03em;
	text-transform: uppercase;
	overflow-wrap: anywhere;
}

:global([data-variant="b"]) .intro-head :global(.intro-avatar) {
	box-shadow: 0 0 0 4px var(--color-gold);
}

:global([data-variant="b"]) .dates {
	padding: 4px 12px;
	border-radius: 999px;
	background: var(--color-surface);
	color: var(--color-ink);
	box-shadow: var(--shadow-control);
	font-family: var(--font-sans);
	font-size: 13px;
	letter-spacing: 0;
	text-transform: none;
}

:global([data-variant="b"]) .intro-title {
	font-size: min(40px, 11cqw);
}

:global([data-variant="b"]) .player-name {
	font-weight: 800;
	letter-spacing: 0;
	text-transform: none;
}
</style>
