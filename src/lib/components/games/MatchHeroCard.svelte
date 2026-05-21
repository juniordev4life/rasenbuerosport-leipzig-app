<script>
import { getTranslate } from "@tolgee/svelte";
import OvrBadge from "$lib/components/ui/OvrBadge.svelte";
import StarRating from "$lib/components/ui/StarRating.svelte";
import TeamLogo from "$lib/components/ui/TeamLogo.svelte";
import { getCountryFlag } from "$lib/constants/teams.constants.js";
import { getMatchCharacterTags } from "$lib/utils/matchCharacterTags.utils.js";

/**
 * Match hero card — top of the Spielbericht page. Renders mode + date,
 * the two teams with logos/OVR, the big scoreline, and a small set of
 * derived character tags ("Spätes Drama", "Glücklicher Sieg", …).
 *
 * @type {{
 *   game: object,
 *   homeTeam: object|null,
 *   awayTeam: object|null,
 *   homeTeamName: string|null,
 *   awayTeamName: string|null,
 *   resultSuffix?: string,
 * }}
 */
let {
	game,
	homeTeam = null,
	awayTeam = null,
	homeTeamName = null,
	awayTeamName = null,
	resultSuffix = "",
} = $props();

const { t } = getTranslate();

const tags = $derived(getMatchCharacterTags(game));

const homeWins = $derived(game.score_home > game.score_away);
const awayWins = $derived(game.score_away > game.score_home);

const formattedDate = $derived(
	new Date(game.played_at).toLocaleDateString("de-DE", {
		weekday: "long",
		day: "2-digit",
		month: "long",
		year: "numeric",
	}),
);
const formattedTime = $derived(
	new Date(game.played_at).toLocaleTimeString("de-DE", {
		hour: "2-digit",
		minute: "2-digit",
	}),
);

const TAG_VARIANT_CLASSES = {
	warning: "bg-warning/15 text-warning",
	red: "bg-accent-red/15 text-accent-red",
	success: "bg-success/15 text-success",
	info: "bg-blue-500/15 text-blue-400",
};

const TAG_ICONS = {
	late_drama: "⏱",
	lucky_win: "🎯",
	defensive_battle: "🛡",
	penalty_decision: "⚡",
	goal_fest: "🔥",
	clear_win: "🚀",
	draw: "🤝",
	comeback: "🎢",
};
</script>

<div class="rounded-2xl border border-border bg-gradient-to-b from-bg-secondary to-bg-card p-5 sm:p-7">
	<div class="flex items-center justify-between mb-4">
		<span class="bg-accent-red/15 text-accent-red text-[11px] font-bold tracking-[0.06em] uppercase px-2.5 py-1 rounded-md">
			{game.mode}
		</span>
		<span class="text-xs text-text-muted">
			{formattedDate} · {formattedTime}
		</span>
	</div>

	<div class="grid grid-cols-[1fr_auto_1fr] items-center gap-4 sm:gap-6 mb-5">
		<!-- Home -->
		<div class="flex items-center justify-end gap-3 text-right">
			<div class="hidden sm:block min-w-0">
				<div class="text-sm sm:text-lg font-semibold truncate">
					{homeTeam?.name || homeTeamName || "—"}
				</div>
				{#if homeTeam}
					<div class="text-[11px] text-text-secondary mt-0.5 flex items-center justify-end gap-1.5">
						<OvrBadge rating={homeTeam.overall_rating} size="xs" />
						<StarRating rating={homeTeam.star_rating} size="xs" />
					</div>
				{/if}
			</div>
			<div class="flex flex-col items-center gap-1">
				<TeamLogo logoUrl={homeTeam?.logo_url} teamName={homeTeam?.name || homeTeamName || "?"} size="lg" />
				<span class="sm:hidden text-[11px] text-text-secondary truncate max-w-[88px]">
					{#if homeTeam}{getCountryFlag(homeTeam.country_code)}{/if}
					{homeTeam?.name || homeTeamName || "—"}
				</span>
			</div>
		</div>

		<!-- Score -->
		<div class="text-center px-1 sm:px-2">
			<div class="text-4xl sm:text-6xl font-bold leading-none tabular-nums flex items-baseline gap-1">
				<span class={homeWins ? "text-accent-red" : "text-text-muted"}>{game.score_home}</span>
				<span class="text-text-muted text-3xl sm:text-5xl">:</span>
				<span class={awayWins ? "text-success" : "text-text-muted"}>{game.score_away}</span>
			</div>
			{#if resultSuffix}
				<p class="text-[11px] font-medium text-accent-red mt-1.5">{resultSuffix}</p>
			{/if}
		</div>

		<!-- Away -->
		<div class="flex items-center justify-start gap-3 text-left">
			<div class="flex flex-col items-center gap-1">
				<TeamLogo logoUrl={awayTeam?.logo_url} teamName={awayTeam?.name || awayTeamName || "?"} size="lg" />
				<span class="sm:hidden text-[11px] text-text-secondary truncate max-w-[88px]">
					{#if awayTeam}{getCountryFlag(awayTeam.country_code)}{/if}
					{awayTeam?.name || awayTeamName || "—"}
				</span>
			</div>
			<div class="hidden sm:block min-w-0">
				<div class="text-sm sm:text-lg font-semibold truncate">
					{awayTeam?.name || awayTeamName || "—"}
				</div>
				{#if awayTeam}
					<div class="text-[11px] text-text-secondary mt-0.5 flex items-center gap-1.5">
						<OvrBadge rating={awayTeam.overall_rating} size="xs" />
						<StarRating rating={awayTeam.star_rating} size="xs" />
					</div>
				{/if}
			</div>
		</div>
	</div>

	{#if tags.length > 0}
		<ul class="flex flex-wrap items-center justify-center gap-2 list-none p-0 m-0">
			{#each tags as tag (tag.id)}
				<li class="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full {TAG_VARIANT_CLASSES[tag.variant]}">
					<span aria-hidden="true">{TAG_ICONS[tag.id]}</span>
					{$t(`game_detail.character_tag.${tag.id}`)}
				</li>
			{/each}
		</ul>
	{/if}
</div>
