<script>
import { getTranslate } from "@tolgee/svelte";
import SophieCard from "$lib/components/duo/SophieCard.svelte";
import LightningIcon from "$lib/components/icons/LightningIcon.svelte";
import TrophyIcon from "$lib/components/icons/TrophyIcon.svelte";
import PlayerAvatar from "$lib/components/ui/PlayerAvatar.svelte";

/**
 * Top of the H2H detail: both players face to face (avatar, name,
 * player type, ELO), the head-to-head wins in the middle with the
 * draws below, a trophy badge on whoever leads by 2+ wins, a gold
 * chip for a run of 2+ duel wins and Sophie's verdict.
 *
 * Design A: the red hero band (a red card from `lg`). Design B: a white
 * card on the pitch.
 *
 * @type {{
 *   playerA: { id: string, username: string, avatarUrl: string|null, initials: string, archetype: string|null, elo: number|null, rank: number|null },
 *   playerB: { id: string, username: string, avatarUrl: string|null, initials: string, archetype: string|null, elo: number|null, rank: number|null },
 *   winsA: number,
 *   winsB: number,
 *   draws: number,
 *   streakLeader?: string|null,
 *   streakCount?: number|null,
 *   sophieQuote: string,
 * }}
 */
let {
	playerA,
	playerB,
	winsA,
	winsB,
	draws,
	streakLeader = null,
	streakCount = null,
	sophieQuote,
} = $props();

const { t } = getTranslate();

const crownOn = $derived.by(() => {
	if (Math.abs(winsA - winsB) < 2) return null;
	return winsA > winsB ? "a" : "b";
});

const streakLabel = $derived(
	streakLeader && streakCount && streakCount >= 2
		? `${streakCount} ${$t("compare.in_a_row")}`
		: null,
);
</script>

{#snippet side(player, leads)}
	<div class="side">
		<span class="side-pic">
			<PlayerAvatar
				player={{ id: player.id, username: player.username, avatarUrl: player.avatarUrl }}
				size={64}
				class="side-avatar"
			/>
			{#if leads}
				<span class="lead-badge" aria-hidden="true"><TrophyIcon size={14} strokeWidth={2.2} /></span>
			{/if}
		</span>
		<span class="side-name">{player.username}</span>
		{#if player.archetype}
			<span class="side-type">{player.archetype}</span>
		{/if}
		<span class="side-elo">
			ELO {player.elo ?? "—"}{#if player.rank}<span class="side-rank"> · #{player.rank}</span>{/if}
		</span>
	</div>
{/snippet}

<section class="hero bleed duel" aria-label={$t("compare.h2h_tag")}>
	<div class="duel-head">
		<p class="duel-tag">{$t("compare.h2h_tag")}</p>
		{#if streakLabel}
			<span class="chip chip-gold">
				<LightningIcon size={12} strokeWidth={2.4} />
				{streakLabel}
			</span>
		{/if}
	</div>

	<div class="faceoff">
		{@render side(playerA, crownOn === "a")}
		<div class="tally">
			<span class="num tally-score">
				<span>{winsA}</span><span class="tally-sep">:</span><span>{winsB}</span>
			</span>
			{#if draws > 0}
				<span class="tally-draws">{draws} {$t("compare.draws_short")}</span>
			{/if}
		</div>
		{@render side(playerB, crownOn === "b")}
	</div>

	<SophieCard quote={sophieQuote} />
</section>

<style>
/* ── Design A: the red hero band ────────────────────────────────────── */
.duel {
	display: flex;
	flex-direction: column;
	gap: 18px;
	padding-top: 20px;
	padding-bottom: 24px;
}

.duel-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
}

.duel-tag {
	margin: 0;
	font-family: var(--font-cond);
	font-weight: 700;
	font-size: 14px;
	letter-spacing: 0.03em;
	text-transform: uppercase;
}

.faceoff {
	display: grid;
	grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
	align-items: start;
	gap: 10px;
}

.side {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 5px;
	min-width: 0;
	text-align: center;
}

.side-pic {
	position: relative;
	display: flex;
	margin-bottom: 4px;
}

:global([data-variant="a"]) .side-pic :global(.side-avatar) {
	--avatar-bg: var(--color-surface);
	--avatar-fg: var(--color-ink);
}

.lead-badge {
	position: absolute;
	top: -8px;
	right: -10px;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 26px;
	height: 26px;
	border: 2px solid var(--color-surface);
	border-radius: 999px;
	background: var(--color-gold);
	color: var(--color-on-gold);
}

.side-name {
	max-width: 100%;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	font-family: var(--font-display);
	font-size: 22px;
	line-height: 1;
	text-transform: uppercase;
}

.side-type {
	max-width: 100%;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	font-family: var(--font-cond);
	font-weight: 700;
	font-size: 13px;
	letter-spacing: 0.02em;
	text-transform: uppercase;
}

.side-elo {
	font-size: 13px;
	font-variant-numeric: tabular-nums;
}

.tally {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 6px;
	padding-top: 8px;
}

.tally-score {
	display: flex;
	align-items: baseline;
	gap: 6px;
	font-size: 56px;
	line-height: 0.85;
}

.tally-sep {
	font-size: 0.6em;
}

.tally-draws {
	font-size: 12px;
	white-space: nowrap;
}

@media (min-width: 1024px) {
	.duel {
		margin: 0;
		padding: 24px;
		border-radius: var(--radius-card);
	}

	.faceoff {
		gap: 24px;
	}

	.tally-score {
		font-size: 72px;
	}
}

/* ── Design B: a white card on the pitch ────────────────────────────── */
:global([data-variant="b"]) .duel {
	gap: 14px;
	padding: 18px;
	background: var(--color-surface);
	color: var(--color-ink);
	border-radius: var(--radius-card);
	box-shadow: var(--shadow-card);
}

:global([data-variant="b"]) .duel-tag {
	font-family: var(--font-sans);
	font-size: 12px;
	letter-spacing: 0;
	text-transform: none;
	color: var(--color-muted);
}

:global([data-variant="b"]) .side-pic :global(.side-avatar) {
	box-shadow: 0 0 0 3px var(--color-surface), 0 0 0 5px var(--color-line);
}

:global([data-variant="b"]) .side-name {
	font-family: var(--font-cond);
	font-weight: 800;
	font-size: 20px;
	text-transform: none;
}

:global([data-variant="b"]) .side-type {
	font-family: var(--font-sans);
	font-weight: 500;
	font-size: 12px;
	letter-spacing: 0;
	text-transform: none;
	color: var(--color-brand-strong);
}

:global([data-variant="b"]) .side-elo {
	color: var(--color-muted);
}

:global([data-variant="b"]) .tally-score {
	font-size: 52px;
	line-height: 1;
}

:global([data-variant="b"]) .tally-draws {
	color: var(--color-muted);
}
</style>
