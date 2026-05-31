<script>
import { getTranslate } from "@tolgee/svelte";
import WrappedAvatar from "./WrappedAvatar.svelte";

/**
 * Hero card for the Wrapped page's Match-of-the-Week slot.
 *
 * Lays out home — score — away with team names on top of each side
 * and a per-side avatar row underneath. Result-type pills (`n.V.` /
 * `i.E.`) sit just below the score so a 5:6 i.E. doesn't read like a
 * regulation win. Tap anywhere on the card opens the full match
 * detail page where the AI report, audio, timeline and stats all
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

<a class="motw" href={`/app/games/${match.game_id}`}>
	<div class="motw-tag">
		<svg
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			width="11"
			height="11"
			aria-hidden="true"
		>
			<polygon
				points="12 2 15 8.5 22 9.3 17 14 18.2 21 12 17.8 5.8 21 7 14 2 9.3 9 8.5 12 2"
			/>
		</svg>
		{$t("wrapped.match_of_the_week.category")}
	</div>

	<div class="duel">
		<div class="side" data-winner={winner === "home"}>
			<div class="team-name">{match.home_team_name ?? $t("wrapped.match.home_fallback")}</div>
			<div class="avatars">
				{#each homePlayers as p (p.id)}
					<WrappedAvatar
						playerId={p.id}
						name={p.username}
						avatarUrl={p.avatar_url}
						size={36}
					/>
				{/each}
			</div>
			<div class="player-names">
				{homePlayers.map((p) => p.username).join(" · ")}
			</div>
		</div>

		<div class="score-block">
			<div class="score">{match.score}</div>
			{#if resultTypeLabel}
				<div class="result-pill">{resultTypeLabel}</div>
			{/if}
		</div>

		<div class="side" data-winner={winner === "away"}>
			<div class="team-name">{match.away_team_name ?? $t("wrapped.match.away_fallback")}</div>
			<div class="avatars">
				{#each awayPlayers as p (p.id)}
					<WrappedAvatar
						playerId={p.id}
						name={p.username}
						avatarUrl={p.avatar_url}
						size={36}
					/>
				{/each}
			</div>
			<div class="player-names">
				{awayPlayers.map((p) => p.username).join(" · ")}
			</div>
		</div>
	</div>

	<div class="footer">
		<span class="date">{dateText}</span>
		<span class="cta">{$t("wrapped.match.open_report")} →</span>
	</div>
</a>

<style>
	.motw {
		display: block;
		background:
			radial-gradient(
				ellipse at top right,
				rgba(168, 85, 247, 0.18) 0%,
				transparent 60%
			),
			linear-gradient(180deg, #1a1f2a 0%, #131822 100%);
		border: 1px solid rgba(168, 85, 247, 0.35);
		border-radius: 18px;
		padding: 16px 14px 14px;
		margin-bottom: 12px;
		color: #e5e7eb;
		text-decoration: none;
		position: relative;
		overflow: hidden;
		transition: border-color 0.15s;
	}
	.motw:hover {
		border-color: rgba(168, 85, 247, 0.55);
	}
	.motw::before {
		content: "";
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 2px;
		background: linear-gradient(
			90deg,
			transparent,
			#a855f7 50%,
			transparent
		);
		opacity: 0.6;
	}
	.motw-tag {
		font-size: 10px;
		font-weight: 800;
		color: #a855f7;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		display: flex;
		align-items: center;
		gap: 5px;
		margin-bottom: 14px;
	}
	.duel {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		gap: 8px;
		align-items: start;
	}
	.side {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: 6px;
		min-width: 0;
		transition: opacity 0.15s;
	}
	.side[data-winner="false"] {
		opacity: 0.55;
	}
	.team-name {
		font-size: 11px;
		font-weight: 700;
		color: #d1d5db;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		line-height: 1.15;
		min-height: 26px;
		display: flex;
		align-items: center;
	}
	.avatars {
		display: flex;
		justify-content: center;
	}
	.avatars > :global(*:not(:first-child)) {
		margin-left: -10px;
	}
	.avatars :global(.avatar-photo),
	.avatars :global(.avatar-fallback) {
		border: 2px solid #131822;
	}
	.player-names {
		font-size: 10px;
		color: #9ca3af;
		line-height: 1.3;
		max-width: 100%;
		overflow-wrap: anywhere;
	}
	.score-block {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 6px;
		padding: 0 6px;
		min-height: 70px;
	}
	.score {
		font-size: 32px;
		font-weight: 800;
		color: white;
		font-variant-numeric: tabular-nums;
		letter-spacing: -0.02em;
		line-height: 1;
	}
	.result-pill {
		font-size: 9px;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		padding: 2px 7px;
		border-radius: 999px;
		background: rgba(168, 85, 247, 0.15);
		color: #a855f7;
		border: 1px solid rgba(168, 85, 247, 0.35);
	}
	.footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 14px;
		padding-top: 12px;
		border-top: 1px solid rgba(255, 255, 255, 0.06);
		font-size: 11px;
	}
	.date {
		color: #6b7280;
	}
	.cta {
		color: #a855f7;
		font-weight: 700;
	}
</style>
