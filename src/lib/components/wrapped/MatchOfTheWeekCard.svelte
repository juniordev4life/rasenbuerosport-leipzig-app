<script>
import { getTranslate } from "@tolgee/svelte";
import PlayerAvatar from "$lib/components/ui/PlayerAvatar.svelte";

/**
 * Hero card for the Wrapped page's Match-of-the-Week slot.
 *
 * Lays out home — score — away with team names on top of each side
 * and a per-side avatar row underneath. Result-type chips (`n.V.` /
 * `i.E.`) sit just below the score so a 5:6 i.E. doesn't read like a
 * regulation win; the losing side's team name steps back to the muted
 * colour. Tap anywhere on the card opens the full match detail page
 * where the AI report, audio, timeline, stats and highlight video all
 * live — the wrapped surface deliberately stays short.
 *
 * @type {{
 *   match: {
 *     game_id: string,
 *     mode?: "1v1"|"2v2",
 *     score: string,
 *     score_home?: number,
 *     score_away?: number,
 *     result_type?: "regular"|"extra_time"|"penalty",
 *     played_at?: string,
 *     home_team_name?: string|null,
 *     away_team_name?: string|null,
 *     home_players?: Array<{id:string, username:string, avatar_url?:string|null}>,
 *     away_players?: Array<{id:string, username:string, avatar_url?:string|null}>,
 *   },
 *   locale?: string,
 * }}
 */
let { match, locale = "de-DE" } = $props();

const { t } = getTranslate();

const homePlayers = $derived(match?.home_players ?? []);
const awayPlayers = $derived(match?.away_players ?? []);
const resultTypeLabel = $derived.by(() => {
	if (match?.result_type === "penalty")
		return $t("wrapped.match.result_penalty");
	if (match?.result_type === "extra_time")
		return $t("wrapped.match.result_extra");
	return null;
});

const dateText = $derived.by(() => {
	if (!match?.played_at) return "";
	const d = new Date(match.played_at);
	if (Number.isNaN(d.getTime())) return "";
	return d.toLocaleDateString(locale, {
		weekday: "short",
		day: "2-digit",
		month: "short",
	});
});

const winner = $derived.by(() => {
	if (match?.score_home == null || match?.score_away == null) return null;
	if (match.score_home > match.score_away) return "home";
	if (match.score_away > match.score_home) return "away";
	return null;
});
</script>

{#snippet side(teamName, players, lost)}
	<span class="side" class:lost>
		<span class="team">{teamName}</span>
		<span class="avatars">
			{#each players as p (p.id)}
				<PlayerAvatar player={p} size={40} ring />
			{/each}
		</span>
		<span class="names">{players.map((p) => p.username).join(" · ")}</span>
	</span>
{/snippet}

<a class="card motw" href={`/app/games/${match.game_id}`}>
	<span class="band">
		<svg
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			width="16"
			height="16"
			aria-hidden="true"
		>
			<polygon
				points="12 2 15 8.5 22 9.3 17 14 18.2 21 12 17.8 5.8 21 7 14 2 9.3 9 8.5 12 2"
			/>
		</svg>
		{$t("wrapped.match_of_the_week.category")}
	</span>

	<span class="duel">
		{@render side(
			match.home_team_name ?? $t("wrapped.match.home_fallback"),
			homePlayers,
			winner === "away",
		)}

		<span class="score-block">
			<span class="score score-big">{match.score}</span>
			{#if resultTypeLabel}
				<span class="chip chip-gold">{resultTypeLabel}</span>
			{/if}
		</span>

		{@render side(
			match.away_team_name ?? $t("wrapped.match.away_fallback"),
			awayPlayers,
			winner === "home",
		)}
	</span>

	<span class="footer">
		<span class="date">{dateText}</span>
		<span class="cta">{$t("wrapped.match.open_report")} →</span>
	</span>
</a>

<style>
.motw {
	display: flex;
	flex-direction: column;
	height: 100%;
	overflow: hidden;
	color: var(--color-ink);
	text-decoration: none;
	transition: box-shadow 150ms;
}

.motw:hover {
	box-shadow: var(--shadow-raised);
}

.band {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 9px 16px;
	background: var(--color-navy);
	color: var(--color-on-navy);
	font-family: var(--font-cond);
	font-weight: 700;
	font-size: 14px;
	line-height: 1.2;
	letter-spacing: 0.03em;
	text-transform: uppercase;
}

.duel {
	display: grid;
	grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
	align-items: start;
	gap: 10px;
	padding: 16px;
}

.side {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8px;
	min-width: 0;
	text-align: center;
}

.team {
	display: flex;
	align-items: center;
	min-height: 2.3em;
	font-family: var(--font-cond);
	font-weight: 700;
	font-size: 15px;
	line-height: 1.15;
	letter-spacing: 0.02em;
	text-transform: uppercase;
	overflow-wrap: anywhere;
}

.lost .team {
	color: var(--color-muted);
}

.avatars {
	display: flex;
	justify-content: center;
	gap: 3px;
}

.names {
	max-width: 100%;
	font-size: 12px;
	line-height: 1.3;
	color: var(--color-muted);
	overflow-wrap: anywhere;
}

.score-block {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8px;
	padding-top: 30px;
}

.score-big {
	min-width: 4.5rem;
	padding: 8px 14px;
	font-size: 30px;
}

/* Pinned to the bottom when the desktop grid stretches the card. */
.footer {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	margin: auto 16px 0;
	padding: 12px 0 14px;
	border-top: 1px solid var(--color-line);
	font-size: 13px;
}

.date {
	color: var(--color-muted);
}

.cta {
	color: var(--color-brand);
	font-weight: 700;
}

.motw:hover .cta {
	color: var(--color-brand-strong);
	text-decoration: underline;
}

/* ── Design B: sentence-case band, overlapping round avatars ─────────── */
:global([data-variant="b"]) .band {
	padding: 8px 18px;
	font-weight: 800;
	font-size: 17px;
	letter-spacing: 0;
	text-transform: none;
}

:global([data-variant="b"]) .duel {
	padding: 16px 18px;
}

:global([data-variant="b"]) .team {
	font-weight: 800;
	letter-spacing: 0;
	text-transform: none;
}

:global([data-variant="b"]) .avatars {
	gap: 0;
}

:global([data-variant="b"]) .avatars > :global(* + *) {
	margin-left: -10px;
}

:global([data-variant="b"]) .footer {
	margin: auto 18px 0;
}
</style>
