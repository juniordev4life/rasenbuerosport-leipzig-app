<script>
import { getTranslate } from "@tolgee/svelte";
import BallIcon from "$lib/components/icons/BallIcon.svelte";
import GiftIcon from "$lib/components/icons/GiftIcon.svelte";
import LightningIcon from "$lib/components/icons/LightningIcon.svelte";
import MicIcon from "$lib/components/icons/MicIcon.svelte";
import TrophyIcon from "$lib/components/icons/TrophyIcon.svelte";
import UsersIcon from "$lib/components/icons/UsersIcon.svelte";
import PlayerAvatar from "$lib/components/ui/PlayerAvatar.svelte";
import Section from "$lib/components/ui/Section.svelte";
import MatchOfTheWeekCard from "$lib/components/wrapped/MatchOfTheWeekCard.svelte";
import TalkrundePending from "$lib/components/wrapped/TalkrundePending.svelte";
import TalkrundePlayer from "$lib/components/wrapped/TalkrundePlayer.svelte";
import WrappedCompactCard from "$lib/components/wrapped/WrappedCompactCard.svelte";
import WrappedHighlightCard from "$lib/components/wrapped/WrappedHighlightCard.svelte";
import WrappedStatsHero from "$lib/components/wrapped/WrappedStatsHero.svelte";
import WrappedWeekNav from "$lib/components/wrapped/WrappedWeekNav.svelte";
import { listWrapped } from "$lib/services/wrapped.services.js";

const { t } = getTranslate();

/** @type {Array<object>} */
let wraps = $state([]);
let currentIndex = $state(0);
let loading = $state(true);
let error = $state(false);

const current = $derived(wraps[currentIndex] || null);
const canGoOlder = $derived(currentIndex < wraps.length - 1);
const canGoNewer = $derived(currentIndex > 0);

/**
 * The wrapped payload — the `payload` JSONB column gets folded into
 * the row by `embedTalkrunde` on the API side. We destructure once
 * here so the template stays readable.
 */
const payload = $derived(current?.payload ?? {});
const talkrunde = $derived(current?.talkrunde ?? null);

const weekLabel = $derived.by(() => {
	if (!current?.week_start || !current?.week_end) return "";
	return `${formatDate(current.week_start)} – ${formatDate(current.week_end)}`;
});

/**
 * The Friday cron only generates a Talkrunde once per week, so older
 * weeks will always have `status: "pending"` and a stale "Wird Freitag
 * generiert" placeholder. That's confusing — for past weeks the talk
 * show simply never existed. Show the pending placeholder ONLY when
 * the wrapped row belongs to the current Berlin week; otherwise let
 * the slot stay empty.
 */
const isCurrentWeek = $derived.by(() => {
	if (!current?.week_start) return false;
	const wrappedMonday = isoWeekStart(current.week_start);
	const todayMonday = isoWeekStart(new Date());
	return wrappedMonday === todayMonday;
});

const talkReady = $derived(
	talkrunde?.status === "ready" && Boolean(talkrunde.audio_url),
);
/** Pending fallback only for the current week — see `isCurrentWeek`. */
const showTalk = $derived(talkReady || isCurrentWeek);

/**
 * Resolve any wrapped-row date input ("YYYY-MM-DD" string, full ISO
 * timestamp, Date object, or anything coercible) to the Monday of
 * its ISO week as a "YYYY-MM-DD" string. Used to compare a wrapped
 * row's week against today's week.
 */
function isoWeekStart(value) {
	const raw =
		typeof value === "string" && value.length === 10
			? `${value}T00:00:00`
			: value;
	const d = new Date(raw);
	if (Number.isNaN(d.getTime())) return "";
	const dayNum = (d.getDay() + 6) % 7; // 0 = Monday
	d.setDate(d.getDate() - dayNum);
	d.setHours(0, 0, 0, 0);
	const year = d.getFullYear();
	const month = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

$effect(() => {
	loadWraps();
});

async function loadWraps() {
	loading = true;
	error = false;
	try {
		wraps = await listWrapped(30);
		currentIndex = 0;
	} catch (err) {
		console.error("Failed to load wrapped:", err);
		error = true;
	} finally {
		loading = false;
	}
}

function goOlder() {
	if (canGoOlder) currentIndex += 1;
}

function goNewer() {
	if (canGoNewer) currentIndex -= 1;
}

/**
 * Format a wrapped row's week boundary as "25. Mai 2026".
 *
 * The backend returns Postgres `DATE` columns as full ISO timestamps
 * (`2026-05-25T00:00:00.000Z`) when they ride through `pg` + `JSON.
 * stringify`, but it CAN also be a plain `YYYY-MM-DD` string if the
 * column was selected as text or the row came from a local Docker
 * snapshot with a different pg setup. The formatter accepts both
 * and falls back to an empty string on garbage rather than rendering
 * "Invalid Date" to the user.
 */
function formatDate(value) {
	if (!value) return "";
	const iso =
		typeof value === "string" && value.length === 10
			? `${value}T00:00:00`
			: value;
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return "";
	return d.toLocaleDateString("de-DE", {
		day: "2-digit",
		month: "long",
		year: "numeric",
	});
}

/** Signed ELO change with a real minus sign ("+12", "−8"). */
function formatDelta(delta) {
	return `${delta >= 0 ? "+" : "−"}${Math.abs(delta)}`;
}
</script>

<svelte:head>
	<title>RasenBürosport - {$t("wrapped.nav.title")}</title>
</svelte:head>

{#snippet riseIcon()}
	<svg
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		width="14"
		height="14"
		aria-hidden="true"
	>
		<polyline points="3 17 9 11 13 15 21 7" />
		<polyline points="14 7 21 7 21 14" />
	</svg>
{/snippet}

{#snippet fallIcon()}
	<svg
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		width="14"
		height="14"
		aria-hidden="true"
	>
		<polyline points="3 7 9 13 13 9 21 17" />
		<polyline points="14 17 21 17 21 10" />
	</svg>
{/snippet}

{#snippet runnerIcon()}
	<svg
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		width="14"
		height="14"
		aria-hidden="true"
	>
		<circle cx="12" cy="5" r="2" />
		<path d="M12 7v6l-3 8M12 13l3 8M6 11l6-2 6 2" />
	</svg>
{/snippet}

<div class="stack pb-4 lg:pb-8">
	{#if loading}
		<div class="flex justify-center py-16">
			<span class="spinner" role="status" aria-label={$t("common.loading")}></span>
		</div>
	{:else if error}
		<div class="card notice text-loss font-bold">{$t("wrapped.error.load_failed")}</div>
	{:else}
		<!-- On phones the wrapper dissolves (`display: contents`) and every
		     block joins the page stack; at lg it becomes a 12-column grid. -->
		<div class="bento">
			<section class="hero bleed wrapped-hero {current && showTalk ? 'span-7' : 'span-12'}">
				{#if current}
					<WrappedWeekNav
						{weekLabel}
						{canGoOlder}
						{canGoNewer}
						onOlder={goOlder}
						onNewer={goNewer}
					/>
					<WrappedStatsHero
						totals={{
							total_games: payload.total_games,
							total_goals: payload.total_goals,
						}}
					/>
				{:else}
					<WrappedWeekNav
						weekLabel=""
						canGoOlder={false}
						canGoNewer={false}
						onOlder={() => {}}
						onNewer={() => {}}
					/>
				{/if}
			</section>

			{#if !current}
				<div class="card notice span-12">
					<span class="state-icon" aria-hidden="true">
						<GiftIcon size={28} />
					</span>
					<p class="notice-title state-title">{$t("wrapped.empty.title")}</p>
					<p>{$t("wrapped.empty.body")}</p>
				</div>
			{:else}
				{#if showTalk}
					<Section title={$t("wrapped.talkrunde.tag")} class="span-5">
						{#snippet icon()}<MicIcon size={22} strokeWidth={2} />{/snippet}
						{#if talkReady}
							<TalkrundePlayer audioUrl={talkrunde.audio_url} />
						{:else}
							<TalkrundePending status={talkrunde?.status ?? "pending"} />
						{/if}
					</Section>
				{/if}

				<section class="details span-12" aria-labelledby="wrapped-details-title">
					<h2 id="wrapped-details-title" class="section-title details-title">
						{$t("wrapped.section.details")}
					</h2>

					<!-- MVP + Match of the Week side by side on desktop. -->
					{#if payload.mvp}
						<div class={payload.match_of_the_week ? "slot-mvp" : "slot-full"}>
							<WrappedHighlightCard
								variant="mvp"
								categoryLabel={$t("wrapped.mvp.category")}
								title={payload.mvp.username}
								detail={$t("wrapped.mvp.detail", { wins: payload.mvp.wins })}
								href={`/app/profile/${payload.mvp.id}`}
							>
								{#snippet visual()}
									<PlayerAvatar player={payload.mvp} size={72} />
								{/snippet}
							</WrappedHighlightCard>
						</div>
					{/if}

					{#if payload.match_of_the_week}
						<div class={payload.mvp ? "slot-motw" : "slot-full"}>
							<MatchOfTheWeekCard match={payload.match_of_the_week} />
						</div>
					{/if}

					<!-- The week's superlatives: a list on phones, a 2–3 column
					     grid of cards on desktop. -->
					<div class="compact-grid">
						{#if payload.topscorer}
							<WrappedCompactCard
								categoryLabel={$t("wrapped.topscorer.category")}
								name={payload.topscorer.username}
								value={String(payload.topscorer.goals ?? "")}
								valueTone="neutral"
								href={`/app/profile/${payload.topscorer.id}`}
							>
								{#snippet icon()}<BallIcon size={14} />{/snippet}
								{#snippet avatar()}
									<PlayerAvatar player={payload.topscorer} size={40} />
								{/snippet}
							</WrappedCompactCard>
						{/if}

						{#if payload.most_active}
							<WrappedCompactCard
								categoryLabel={$t("wrapped.most_active.category")}
								name={payload.most_active.username}
								value={String(payload.most_active.games_played ?? "")}
								valueTone="neutral"
								href={`/app/profile/${payload.most_active.id}`}
							>
								{#snippet icon()}{@render runnerIcon()}{/snippet}
								{#snippet avatar()}
									<PlayerAvatar player={payload.most_active} size={40} />
								{/snippet}
							</WrappedCompactCard>
						{/if}

						{#if payload.biggest_riser}
							<WrappedCompactCard
								categoryLabel={$t("wrapped.biggest_riser.category")}
								name={payload.biggest_riser.username}
								detail={`${payload.biggest_riser.elo_from} → ${payload.biggest_riser.elo_to} ELO`}
								value={`+${payload.biggest_riser.elo_delta}`}
								valueTone="up"
								href={`/app/profile/${payload.biggest_riser.id}`}
							>
								{#snippet icon()}{@render riseIcon()}{/snippet}
								{#snippet avatar()}
									<PlayerAvatar player={payload.biggest_riser} size={40} />
								{/snippet}
							</WrappedCompactCard>
						{/if}

						<!-- Pechvogel — muted, augenzwinkernd -->
						{#if payload.biggest_loser}
							<WrappedCompactCard
								categoryLabel={$t("wrapped.biggest_loser.category")}
								name={payload.biggest_loser.username}
								detail={`${payload.biggest_loser.elo_from} → ${payload.biggest_loser.elo_to} ELO`}
								value={formatDelta(payload.biggest_loser.elo_delta)}
								valueTone="down"
								href={`/app/profile/${payload.biggest_loser.id}`}
							>
								{#snippet icon()}{@render fallIcon()}{/snippet}
								{#snippet avatar()}
									<PlayerAvatar player={payload.biggest_loser} size={40} />
								{/snippet}
							</WrappedCompactCard>
						{/if}

						{#if payload.hottest_streak}
							<WrappedCompactCard
								categoryLabel={$t("wrapped.hottest_streak.category")}
								name={payload.hottest_streak.username}
								detail={$t("wrapped.hottest_streak.detail", {
									count: payload.hottest_streak.wins_in_a_row,
								})}
								value={String(payload.hottest_streak.wins_in_a_row)}
								valueTone="neutral"
								href={`/app/profile/${payload.hottest_streak.id}`}
							>
								{#snippet icon()}<LightningIcon size={14} />{/snippet}
								{#snippet avatar()}
									<PlayerAvatar player={payload.hottest_streak} size={40} />
								{/snippet}
							</WrappedCompactCard>
						{/if}

						{#if payload.top_duo?.players?.length === 2}
							<WrappedCompactCard
								categoryLabel={$t("wrapped.top_duo.category")}
								name={`${payload.top_duo.players[0].username} & ${payload.top_duo.players[1].username}`}
								detail={$t("wrapped.top_duo.detail", {
									wins: payload.top_duo.wins,
									games: payload.top_duo.games,
									percent: Math.round((payload.top_duo.win_rate ?? 0) * 100),
								})}
							>
								{#snippet icon()}<UsersIcon size={14} strokeWidth={2} />{/snippet}
								{#snippet avatar()}
									<span class="duo-pair">
										<PlayerAvatar player={payload.top_duo.players[0]} size={34} ring />
										<PlayerAvatar player={payload.top_duo.players[1]} size={34} ring />
									</span>
								{/snippet}
							</WrappedCompactCard>
						{/if}

						{#if payload.trophies_this_week?.count > 0}
							<WrappedCompactCard
								categoryLabel={$t("wrapped.trophies.category")}
								name={$t("wrapped.trophies.count", {
									count: payload.trophies_this_week.count,
								})}
								detail={payload.trophies_this_week.breakdown
									.map((b) => (b.count > 1 ? `${b.username} ×${b.count}` : b.username))
									.join(" · ")}
								value={String(payload.trophies_this_week.count)}
								valueTone="neutral"
							>
								{#snippet icon()}<TrophyIcon size={18} strokeWidth={2} />{/snippet}
							</WrappedCompactCard>
						{/if}
					</div>
				</section>
			{/if}
		</div>
	{/if}
</div>

<style>
.bento {
	display: contents;
}

/* ── Hero: red band in A (flush under the header), text on the pitch in B */
.wrapped-hero {
	display: flex;
	flex-direction: column;
	gap: 22px;
	padding-top: 22px;
	padding-bottom: 26px;
}

:global([data-variant="b"]) .wrapped-hero {
	gap: 14px;
	padding-top: 4px;
	padding-bottom: 0;
}

/* ── Details: the MVP, the match of the week and the superlatives ──── */
.details {
	display: flex;
	flex-direction: column;
	gap: 10px;
	min-width: 0;
}

/* B: the heading stands straight on the pitch. */
:global([data-variant="b"]) .details-title {
	color: var(--color-on-page);
	text-shadow: var(--on-page-shadow);
}

.compact-grid {
	display: grid;
	gap: 10px;
}

.duo-pair {
	display: flex;
	gap: 3px;
}

:global([data-variant="b"]) .duo-pair {
	gap: 0;
}

:global([data-variant="b"]) .duo-pair > :global(* + *) {
	margin-left: -10px;
}

/* ── Empty state (.notice): a red gift and a condensed heading ──────── */
.state-icon {
	display: inline-flex;
	margin-bottom: 4px;
	color: var(--color-brand);
}

.state-title {
	font-family: var(--font-cond);
	font-size: 20px;
	letter-spacing: 0.02em;
	text-transform: var(--title-case);
}

/* ── Desktop: hero + talk show, then a grid of cards ────────────────── */
@media (min-width: 1024px) {
	.bento {
		display: grid;
		grid-template-columns: repeat(12, minmax(0, 1fr));
		gap: var(--stack-gap);
	}

	.bento > :global(.span-5) {
		grid-column: span 5;
	}

	.bento > :global(.span-7) {
		grid-column: span 7;
	}

	.bento > :global(.span-12) {
		grid-column: span 12;
	}

	.wrapped-hero {
		margin: 0;
		padding: 28px 32px 32px;
		border-radius: var(--radius-card);
	}

	:global([data-variant="b"]) .wrapped-hero {
		padding: 0;
	}

	.details {
		display: grid;
		grid-template-columns: repeat(12, minmax(0, 1fr));
		gap: 16px;
	}

	.details > * {
		grid-column: span 12;
	}

	.details > .slot-mvp {
		grid-column: span 5;
	}

	.details > .slot-motw {
		grid-column: span 7;
	}

	.compact-grid {
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 16px;
	}
}

@media (min-width: 1280px) {
	.compact-grid {
		grid-template-columns: repeat(3, minmax(0, 1fr));
	}
}
</style>
