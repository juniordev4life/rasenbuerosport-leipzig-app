<script>
import { getTranslate } from "@tolgee/svelte";
import { avatarGradient } from "$lib/utils/avatarColor.utils.js";
import CountUpNumber from "../CountUpNumber.svelte";

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
const initial = $derived(
	(recap.player?.username ?? "?").charAt(0).toUpperCase(),
);
const fallbackGradient = $derived(
	avatarGradient(recap.player?.player_id ?? recap.player?.username).gradient,
);
</script>

<div class="flex flex-col items-center text-center gap-5">
	{#if recap.player?.avatar_url}
		<img
			src={recap.player.avatar_url}
			alt=""
			class="w-24 h-24 rounded-full object-cover border-4 border-white/10"
		/>
	{:else}
		<div
			class="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-extrabold text-white border-4 border-white/10"
			style:background={fallbackGradient}
		>
			{initial}
		</div>
	{/if}
	<div class="text-xs uppercase tracking-[0.2em] text-white/50 font-bold">{dateRange}</div>
	<h1 class="text-3xl font-extrabold leading-tight">
		{$t("season_recap.intro.title", { version: recap.season?.game_version ?? "" })}
	</h1>
	<p class="text-white/70">{recap.player?.username}</p>
	{#if recap.stats?.games}
		<div class="text-5xl font-extrabold text-[#E24B4A] mt-2">
			<CountUpNumber value={recap.stats.games} reduced={reducedMotion} />
		</div>
		<div class="text-sm text-white/60 -mt-3">{$t("season_recap.intro.games")}</div>
	{/if}
	{#if recap.league}
		<p class="text-xs text-white/40 mt-4">
			{$t("season_recap.intro.league_facts", {
				version: recap.season?.game_version ?? "",
				games: recap.league.games,
				goals: recap.league.goals,
			})}
		</p>
	{/if}
</div>
