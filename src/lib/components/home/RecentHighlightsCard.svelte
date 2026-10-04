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

{#if items.length === 0}
	<div class="card notice">
		{$t("home.highlights.empty")}
	</div>
{:else}
	<div class="card rows">
		{#each items as game (game.id)}
			<a href={`/app/games/${game.id}`} class="clip">
				<span class="poster">
					<!-- svelte-ignore a11y_media_has_caption -->
					<video
						src={`${game.highlight_url}#t=0.1`}
						preload="metadata"
						muted
						playsinline
						tabindex="-1"
					></video>
					<span class="play" aria-hidden="true">
						<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
							<polygon points="7 4 20 12 7 20" />
						</svg>
					</span>
				</span>
				<span class="flex flex-col gap-0.5 flex-1 min-w-0">
					<span class="font-bold truncate">{matchupLabel(game)}</span>
					<span class="text-[13px] text-muted">{dateLabel(game.played_at)}</span>
				</span>
				<span class="score">{game.score_home ?? 0}:{game.score_away ?? 0}</span>
			</a>
		{/each}
	</div>
{/if}

<style>
.clip {
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 10px 16px;
	text-decoration: none;
	color: inherit;
}

.clip:hover {
	background: var(--color-sunken);
}

.poster {
	position: relative;
	width: 112px;
	flex-shrink: 0;
	aspect-ratio: 16 / 9;
	overflow: hidden;
	border-radius: var(--radius-tile);
	background: var(--color-navy);
}

.poster video {
	width: 100%;
	height: 100%;
	object-fit: cover;
}

.play {
	position: absolute;
	left: 50%;
	top: 50%;
	width: 28px;
	height: 28px;
	display: flex;
	align-items: center;
	justify-content: center;
	transform: translate(-50%, -50%);
	border-radius: 999px;
	background: var(--color-brand);
	color: var(--color-on-brand);
}

:global([data-variant="b"]) .clip {
	padding: 10px 0;
}
</style>
