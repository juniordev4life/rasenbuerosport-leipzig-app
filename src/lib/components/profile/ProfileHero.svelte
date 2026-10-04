<script>
import { getTranslate } from "@tolgee/svelte";
import Sparkline from "$lib/components/leaderboard/Sparkline.svelte";
import InfoTip from "$lib/components/ui/InfoTip.svelte";
import PlayerAvatar from "$lib/components/ui/PlayerAvatar.svelte";
import { designVariant } from "$lib/stores/designVariant.stores.js";
import MarcelCard from "./MarcelCard.svelte";

/**
 * Profile hero: who the player is (picture, name, archetype, rank and
 * games), their ELO with this week's change and the rating curve,
 * Marcel's character verdict and the win / draw / loss record.
 * Design A: the red hero band under the header. Design B: a white card
 * with a jersey carrying the name and rank number, the picture pinned
 * to it. From `lg` the blocks sit in two columns.
 *
 * @type {{
 *   playerId: string|null,
 *   username: string,
 *   avatarUrl: string|null,
 *   archetype: string|null,
 *   rank: number|null,
 *   matchCount: number,
 *   currentRating: number|null,
 *   ratings: number[],
 *   weekDelta: number,
 *   wins: number,
 *   draws: number,
 *   losses: number,
 *   marcelQuote: string,
 * }}
 */
let {
	playerId,
	username,
	avatarUrl,
	archetype,
	rank,
	matchCount,
	currentRating,
	ratings,
	weekDelta,
	wins,
	draws,
	losses,
	marcelQuote,
} = $props();

const { t } = getTranslate();

const uid = $props.id();
const nameId = `profile-name-${uid}`;

const player = $derived({ id: playerId, name: username, avatarUrl });

/** Long names step down a size so they don't break mid-word. */
const nameSize = $derived(
	(username ?? "").length > 12
		? "long"
		: (username ?? "").length > 8
			? "mid"
			: "short",
);

const jerseyName = $derived((username ?? "").toUpperCase().slice(0, 12));

const decided = $derived(wins + losses);
const winRate = $derived(decided > 0 ? Math.round((wins / decided) * 100) : 0);

const roundedDelta = $derived(Math.round(weekDelta ?? 0));
const deltaTone = $derived(
	roundedDelta > 0 ? "win" : roundedDelta < 0 ? "loss" : "draw",
);
const deltaText = $derived(
	roundedDelta > 0
		? `+${roundedDelta}`
		: roundedDelta < 0
			? `−${Math.abs(roundedDelta)}`
			: "±0",
);

const stats = $derived([
	{ key: "wins", label: $t("profile.wins"), value: wins, tone: "win" },
	{ key: "draws", label: $t("profile.draws"), value: draws, tone: "plain" },
	{ key: "losses", label: $t("profile.losses"), value: losses, tone: "loss" },
	{
		key: "rate",
		label: $t("profile.win_rate"),
		value: `${winRate}%`,
		tone: "plain",
	},
]);
</script>

{#snippet archetypeLine()}
	<span class="archetype">
		{archetype ?? $t("profile.archetype_placeholder")}
		<InfoTip titleKey="info_tips.archetype.title" bodyKey="info_tips.archetype.body" />
	</span>
{/snippet}

<section class="ph hero bleed" aria-labelledby={nameId}>
	{#if $designVariant === "b"}
		<div class="id id-b">
			<div class="jersey">
				<svg class="jersey-svg" viewBox="0 0 120 120" aria-hidden="true">
					<path
						class="shirt"
						d="M40 10L20 20L4 44l18 12 8-8v64h60V48l8 8 18-12-16-24-20-10c-4 8-12 12-20 12S44 18 40 10z"
					/>
					<path class="trim" d="M40 10c4 8 12 12 20 12s16-4 20-12" />
					<path class="trim" d="M6 45.5l15.5 10.3M114 45.5l-15.5 10.3" />
					<text
						class="jersey-name"
						x="60"
						y="44"
						text-anchor="middle"
						textLength={jerseyName.length > 7 ? 58 : undefined}
						lengthAdjust="spacingAndGlyphs"
					>{jerseyName}</text>
					{#if rank != null}
						<text class="jersey-number" x="60" y="96" text-anchor="middle">{rank}</text>
					{/if}
				</svg>
				<PlayerAvatar {player} size={44} ring class="jersey-avatar" />
			</div>
			<div class="id-text">
				<span class="tag">{$t("profile.hero_tag")}</span>
				<h1 id={nameId} class="page-title name {nameSize}">{username}</h1>
				{@render archetypeLine()}
				<span class="chip chip-gold games-pill">
					{#if rank != null}{$t("profile.rank_short")} #{rank} ·{/if}
					{matchCount}
					{$t("profile.games_short")}
				</span>
			</div>
		</div>
	{:else}
		<div class="head">
			<span class="tag">{$t("profile.hero_tag")}</span>
			{#if rank != null}
				<span class="rank">
					<span class="rank-label">{$t("profile.rank_short")}</span>
					<span class="rank-num">{rank}</span>
				</span>
			{/if}
		</div>
		<div class="id">
			<PlayerAvatar {player} size={76} class="hero-avatar" />
			<div class="id-text">
				<h1 id={nameId} class="page-title name {nameSize}">{username}</h1>
				{@render archetypeLine()}
				<span class="games">{matchCount} {$t("profile.games_short")}</span>
			</div>
		</div>
	{/if}

	<div class="elo">
		<div class="elo-main">
			<span class="elo-row">
				<span class="num elo-value">{currentRating ?? "—"}</span>
				<InfoTip titleKey="info_tips.elo.title" bodyKey="info_tips.elo.body" />
			</span>
			<span class="delta delta-{deltaTone}">{deltaText} {$t("profile.this_week")}</span>
		</div>
		<div class="spark">
			<Sparkline
				points={ratings}
				width={150}
				height={56}
				stroke="var(--hero-spark)"
				area={$designVariant === "b"}
				strokeWidth={2.5}
				opacity={1}
				fluid
			/>
		</div>
	</div>

	<div class="quote">
		<MarcelCard quote={marcelQuote} />
	</div>

	<dl class="stats">
		{#each stats as stat (stat.key)}
			<div class="stat">
				<dt class="stat-label">{stat.label}</dt>
				<dd class="num stat-value tone-{stat.tone}">{stat.value}</dd>
			</div>
		{/each}
	</dl>
</section>

<style>
/* ── Design A: the red hero band ────────────────────────────────────── */
.ph {
	--hero-spark: var(--color-on-brand);
	display: grid;
	grid-template-columns: minmax(0, 1fr);
	grid-template-areas:
		"head"
		"id"
		"elo"
		"quote"
		"stats";
	row-gap: 22px;
	padding-top: 20px;
	padding-bottom: 28px;
}

.head {
	grid-area: head;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	margin-bottom: -14px;
}

.tag {
	font-family: var(--font-cond);
	font-weight: 700;
	font-size: 14px;
	letter-spacing: 0.03em;
	text-transform: uppercase;
}

.rank {
	width: 64px;
	height: 64px;
	flex-shrink: 0;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 2px;
	border-radius: 999px;
	box-shadow: inset 0 0 0 1px currentColor;
	font-family: var(--font-cond);
	font-weight: 700;
	line-height: 1;
}

.rank-label {
	font-size: 11px;
	letter-spacing: 0.03em;
	text-transform: uppercase;
}

.rank-num {
	font-size: 26px;
	font-variant-numeric: tabular-nums;
}

.id {
	grid-area: id;
	display: flex;
	align-items: center;
	gap: 16px;
	min-width: 0;
}

/* A: the picture (or initials) on a white tile, initials in red. */
.id :global(.hero-avatar) {
	--avatar-bg: var(--color-surface);
	--avatar-fg: var(--color-brand);
}

.id-text {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 8px;
	min-width: 0;
}

.name {
	margin: 0;
	font-size: 48px;
	line-height: 0.85;
	overflow-wrap: anywhere;
}

.name.mid {
	font-size: 38px;
}

.name.long {
	font-size: 30px;
}

.archetype {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	font-family: var(--font-cond);
	font-weight: 700;
	font-size: 15px;
	letter-spacing: 0.03em;
	text-transform: uppercase;
}

.games {
	font-size: 13px;
}

.elo {
	grid-area: elo;
	display: flex;
	align-items: flex-end;
	justify-content: space-between;
	gap: 12px;
	min-width: 0;
}

.elo-main {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 8px;
}

.elo-row {
	display: flex;
	align-items: flex-start;
	gap: 6px;
}

.elo-value {
	font-size: 84px;
	line-height: 0.8;
}

/* This week's change is the shared `.delta`: a tinted pill in B. On A's
 * red band it stays a caption in the band's white, not a coloured figure. */
.delta {
	font-size: 13px;
}

:global(:root:not([data-variant="b"])) .delta {
	color: inherit;
}

.spark {
	flex: 1 1 auto;
	min-width: 96px;
	max-width: 220px;
	height: 56px;
	margin-right: 8px;
}

.quote {
	grid-area: quote;
	min-width: 0;
}

.stats {
	grid-area: stats;
	display: grid;
	grid-template-columns: repeat(4, minmax(0, 1fr));
	gap: 8px;
	margin: 0;
}

/* Value above its label; the label stays first for screen readers. */
.stat {
	display: flex;
	flex-direction: column-reverse;
	justify-content: flex-end;
	gap: 6px;
	min-width: 0;
}

.stat-value {
	margin: 0;
	font-size: 26px;
	line-height: 0.85;
}

.stat-label {
	font-family: var(--font-cond);
	font-weight: 700;
	font-size: 12px;
	letter-spacing: 0.03em;
	text-transform: uppercase;
	overflow-wrap: anywhere;
}

@media (min-width: 1024px) {
	.ph {
		grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		grid-template-areas:
			"head head"
			"id quote"
			"elo stats";
		align-items: center;
		column-gap: 40px;
		row-gap: 26px;
		margin: 0;
		padding: 28px;
		border-radius: var(--radius-card);
	}
}

/* ── Design B: a white card with the jersey ─────────────────────────── */
:global([data-variant="b"]) .ph {
	--hero-spark: var(--color-brand);
	grid-template-areas:
		"id"
		"elo"
		"quote"
		"stats";
	row-gap: 14px;
	padding: 18px;
	border-radius: var(--radius-card);
	background: var(--color-surface);
	color: var(--color-ink);
	box-shadow: var(--shadow-card);
}

@media (min-width: 1024px) {
	:global([data-variant="b"]) .ph {
		grid-template-areas:
			"id quote"
			"elo stats";
		row-gap: 20px;
		padding: 24px;
	}
}

.id-b {
	gap: 14px;
}

.jersey {
	position: relative;
	width: 130px;
	height: 140px;
	flex-shrink: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 16px;
	background: var(--color-win-soft);
}

.jersey-svg {
	width: 116px;
	height: 116px;
	overflow: visible;
}

.shirt {
	fill: var(--color-surface);
	stroke: var(--color-ink);
	stroke-width: 2.5;
	stroke-linejoin: round;
}

.trim {
	fill: none;
	stroke: var(--color-brand);
	stroke-width: 5;
	stroke-linecap: round;
}

.jersey-name,
.jersey-number {
	font-family: var(--font-cond);
	font-weight: 800;
	fill: var(--color-brand);
}

.jersey-name {
	font-size: 13px;
	letter-spacing: 1px;
}

.jersey-number {
	font-size: 50px;
}

.jersey :global(.jersey-avatar) {
	position: absolute;
	right: -6px;
	bottom: -6px;
}

.id-b .id-text {
	gap: 6px;
}

.id-b .tag {
	font-family: var(--font-sans);
	font-size: 12px;
	letter-spacing: 0;
	text-transform: none;
	color: var(--color-muted);
}

.id-b .name {
	font-size: 34px;
	line-height: 1;
}

.id-b .name.mid {
	font-size: 30px;
}

.id-b .name.long {
	font-size: 26px;
}

.id-b .archetype {
	font-family: var(--font-sans);
	font-weight: 500;
	font-size: 14px;
	letter-spacing: 0;
	text-transform: none;
	color: var(--color-brand-strong);
}

.games-pill {
	padding: 3px 10px;
	font-family: var(--font-cond);
	font-size: 13px;
	white-space: normal;
}

/* Small phones: a smaller jersey leaves the name room. */
@media (max-width: 359px) {
	.jersey {
		width: 104px;
		height: 116px;
	}

	.jersey-svg {
		width: 92px;
		height: 92px;
	}
}

:global([data-variant="b"]) .elo-value {
	font-size: 60px;
	line-height: 1;
}

:global([data-variant="b"]) .elo-main {
	gap: 6px;
}

:global([data-variant="b"]) .delta {
	font-size: 12px;
}

:global([data-variant="b"]) .spark {
	margin-right: 0;
}

:global([data-variant="b"]) .stats {
	gap: 6px;
}

:global([data-variant="b"]) .stat {
	align-items: center;
	gap: 2px;
	padding: 8px 4px;
	border-radius: 12px;
	background: var(--color-win-soft);
}

:global([data-variant="b"]) .stat-value {
	font-size: 22px;
	line-height: 1.1;
}

:global([data-variant="b"]) .stat-value.tone-win {
	color: var(--color-win);
}

:global([data-variant="b"]) .stat-value.tone-loss {
	color: var(--color-loss);
}

:global([data-variant="b"]) .stat-label {
	font-family: var(--font-sans);
	font-weight: 400;
	font-size: 11px;
	letter-spacing: 0;
	text-transform: none;
	color: var(--color-muted);
	text-align: center;
}
</style>
