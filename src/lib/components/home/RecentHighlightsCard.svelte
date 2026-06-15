<script>
import { getTranslate } from "@tolgee/svelte";
import { hasHighlight } from "$lib/utils/highlights.utils.js";

/**
 * Dashboard tile listing the most recent games that have a ready
 * highlight reel, as compact rows with a video poster, matchup and
 * score. This is the desktop "watch highlights on the laptop" surface;
 * it renders inside a bento grid cell.
 *
 * @type {{ games?: Array<object>, limit?: number }}
 */
let { games = [], limit = 4 } = $props();

const { t } = getTranslate();

const items = $derived(games.filter(hasHighlight).slice(0, limit));

/**
 * Comma-free "Home vs Away" label, preferring real team names and
 * falling back to the joined player usernames for ad-hoc sides.
 * @param {object} game - A game row from `/v1/games`.
 * @returns {string} The matchup label, or "—" when nothing is known.
 * @example matchupLabel(game); // → "Rote vs Blaue"
 */
function matchupLabel(game) {
	const home = sideLabel(game, "home") || game.home_team_name;
	const away = sideLabel(game, "away") || game.away_team_name;
	if (home && away) return `${home} vs ${away}`;
	return home || away || "—";
}

function sideLabel(game, team) {
	const names = (game.game_players ?? [])
		.filter((p) => p.team === team)
		.map((p) => p.profiles?.username)
		.filter(Boolean);
	return names.length ? names.join(" & ") : null;
}

function dateLabel(iso) {
	if (!iso) return "";
	return new Date(iso).toLocaleDateString("de-DE", {
		day: "2-digit",
		month: "short",
	});
}
</script>

<div class="flex flex-col gap-1.5">
	{#each items as game (game.id)}
		<a
			href={`/app/games/${game.id}`}
			class="bg-bg-card border border-border rounded-xl p-2 flex items-center gap-3 hover:bg-bg-input transition-colors"
		>
			<div class="relative w-28 shrink-0 aspect-video rounded-md overflow-hidden bg-black">
				<!-- svelte-ignore a11y_media_has_caption -->
				<video
					src={`${game.highlight_url}#t=0.1`}
					preload="metadata"
					muted
					playsinline
					class="w-full h-full object-cover"
				></video>
				<span class="absolute inset-0 flex items-center justify-center" aria-hidden="true">
					<span class="w-6 h-6 rounded-full bg-black/55 flex items-center justify-center">
						<svg class="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor">
							<polygon points="6 4 20 12 6 20" />
						</svg>
					</span>
				</span>
			</div>
			<div class="flex-1 min-w-0">
				<div class="text-[12px] font-semibold text-text-primary truncate">
					{matchupLabel(game)}
				</div>
				<div class="text-[10px] text-text-muted">{dateLabel(game.played_at)}</div>
			</div>
			<div class="text-[14px] font-extrabold tabular-nums shrink-0 text-text-primary">
				{game.score_home ?? 0}:{game.score_away ?? 0}
			</div>
			<svg
				class="w-4 h-4 shrink-0 text-text-muted"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<path d="M9 5l7 7-7 7" />
			</svg>
		</a>
	{/each}
	{#if items.length === 0}
		<div class="flex-1 flex items-center justify-center text-center text-[11px] text-text-muted italic py-6">
			{$t("home.highlights.empty")}
		</div>
	{/if}
</div>
