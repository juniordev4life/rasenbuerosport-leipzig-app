<script>
import { getTranslate } from "@tolgee/svelte";
import TalkrundePending from "$lib/components/wrapped/TalkrundePending.svelte";
import TalkrundePlayer from "$lib/components/wrapped/TalkrundePlayer.svelte";
import WrappedAvatar from "$lib/components/wrapped/WrappedAvatar.svelte";
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
 * Format an ISO date (YYYY-MM-DD) as "25. Mai 2026". Anchored at
 * midnight in local time so the day doesn't shift across timezones.
 */
function formatDate(iso) {
	if (!iso) return "";
	const d = new Date(`${iso}T00:00:00`);
	return d.toLocaleDateString("de-DE", {
		day: "2-digit",
		month: "long",
		year: "numeric",
	});
}
</script>

<svelte:head>
	<title>RasenBürosport - {$t("wrapped.nav.title")}</title>
</svelte:head>

<div class="mx-auto max-w-3xl pb-4">
	{#if loading}
		<div class="flex justify-center py-16">
			<div
				class="animate-spin h-8 w-8 border-2 border-accent-red border-t-transparent rounded-full"
			></div>
		</div>
	{:else if error}
		<div
			class="bg-bg-secondary border border-error/60 rounded-2xl p-6 text-center text-error"
		>
			{$t("wrapped.error.load_failed")}
		</div>
	{:else if !current}
		<WrappedWeekNav
			weekLabel=""
			canGoOlder={false}
			canGoNewer={false}
			onOlder={() => {}}
			onNewer={() => {}}
		/>
		<div class="empty">
			<p>{$t("wrapped.empty.title")}</p>
			<p class="empty-detail">{$t("wrapped.empty.body")}</p>
		</div>
	{:else}
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

		{#if talkrunde?.status === "ready" && talkrunde.audio_url}
			<TalkrundePlayer audioUrl={talkrunde.audio_url} />
		{:else}
			<TalkrundePending status={talkrunde?.status ?? "pending"} />
		{/if}

		<div class="section-label">{$t("wrapped.section.details")}</div>

		<!-- MVP block -->
		{#if payload.mvp}
			<WrappedHighlightCard
				variant="mvp"
				categoryLabel={$t("wrapped.mvp.category")}
				title={payload.mvp.username}
				detail={$t("wrapped.mvp.detail", { wins: payload.mvp.wins })}
				href={`/app/profile/${payload.mvp.id}`}
			>
				{#snippet visual()}
					<WrappedAvatar
						playerId={payload.mvp.id}
						name={payload.mvp.username}
						avatarUrl={payload.mvp.avatar_url}
						size={64}
					/>
				{/snippet}
			</WrappedHighlightCard>
		{/if}

		<!-- Match of the Week -->
		{#if payload.match_of_the_week}
			<WrappedHighlightCard
				variant="match"
				categoryLabel={$t("wrapped.match_of_the_week.category")}
				title={payload.match_of_the_week.score}
				detail={payload.match_of_the_week.report ??
					$t("wrapped.match_of_the_week.fallback_detail")}
				href={`/app/games/${payload.match_of_the_week.game_id}`}
			>
				{#snippet visual()}
					<div class="match-icon">
						<svg
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							width="28"
							height="28"
							aria-hidden="true"
						>
							<polygon
								points="12 2 15 8.5 22 9.3 17 14 18.2 21 12 17.8 5.8 21 7 14 2 9.3 9 8.5 12 2"
							/>
						</svg>
					</div>
				{/snippet}
			</WrappedHighlightCard>
		{/if}

		<!-- Topscorer -->
		{#if payload.topscorer}
			<WrappedCompactCard
				categoryLabel={$t("wrapped.topscorer.category")}
				name={payload.topscorer.username}
				value={String(payload.topscorer.goals ?? "")}
				valueTone="neutral"
				href={`/app/profile/${payload.topscorer.id}`}
			>
				{#snippet icon()}
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
						<circle cx="12" cy="12" r="9" />
						<path d="M12 3v18M3 12h18" />
					</svg>
				{/snippet}
				{#snippet avatar()}
					<WrappedAvatar
						playerId={payload.topscorer.id}
						name={payload.topscorer.username}
						avatarUrl={payload.topscorer.avatar_url}
						size={36}
					/>
				{/snippet}
			</WrappedCompactCard>
		{/if}

		<!-- Most active -->
		{#if payload.most_active}
			<WrappedCompactCard
				categoryLabel={$t("wrapped.most_active.category")}
				name={payload.most_active.username}
				value={String(payload.most_active.games_played ?? "")}
				valueTone="neutral"
				href={`/app/profile/${payload.most_active.id}`}
			>
				{#snippet icon()}
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
				{#snippet avatar()}
					<WrappedAvatar
						playerId={payload.most_active.id}
						name={payload.most_active.username}
						avatarUrl={payload.most_active.avatar_url}
						size={36}
					/>
				{/snippet}
			</WrappedCompactCard>
		{/if}

		<!-- Biggest ELO Riser -->
		{#if payload.biggest_riser}
			<WrappedCompactCard
				categoryLabel={$t("wrapped.biggest_riser.category")}
				name={payload.biggest_riser.username}
				detail={`${payload.biggest_riser.elo_from} → ${payload.biggest_riser.elo_to} ELO`}
				value={`+${payload.biggest_riser.elo_delta}`}
				valueTone="up"
				href={`/app/profile/${payload.biggest_riser.id}`}
			>
				{#snippet icon()}
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
				{#snippet avatar()}
					<WrappedAvatar
						playerId={payload.biggest_riser.id}
						name={payload.biggest_riser.username}
						avatarUrl={payload.biggest_riser.avatar_url}
						size={36}
					/>
				{/snippet}
			</WrappedCompactCard>
		{/if}

		<!-- Pechvogel — grey, augenzwinkernd -->
		{#if payload.biggest_loser}
			<WrappedCompactCard
				categoryLabel={$t("wrapped.biggest_loser.category")}
				name={payload.biggest_loser.username}
				detail={`${payload.biggest_loser.elo_from} → ${payload.biggest_loser.elo_to} ELO`}
				value={`${payload.biggest_loser.elo_delta >= 0 ? "+" : "−"}${Math.abs(payload.biggest_loser.elo_delta)}`}
				valueTone="down"
				href={`/app/profile/${payload.biggest_loser.id}`}
			>
				{#snippet icon()}
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
				{#snippet avatar()}
					<WrappedAvatar
						playerId={payload.biggest_loser.id}
						name={payload.biggest_loser.username}
						avatarUrl={payload.biggest_loser.avatar_url}
						size={36}
					/>
				{/snippet}
			</WrappedCompactCard>
		{/if}

		<!-- Hottest Streak -->
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
				{#snippet icon()}
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
						<path d="M13 2L4.5 13h6L11 22l8.5-11h-6L13 2z" />
					</svg>
				{/snippet}
				{#snippet avatar()}
					<WrappedAvatar
						playerId={payload.hottest_streak.id}
						name={payload.hottest_streak.username}
						avatarUrl={payload.hottest_streak.avatar_url}
						size={36}
					/>
				{/snippet}
			</WrappedCompactCard>
		{/if}

		<!-- Top Duo -->
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
				{#snippet icon()}
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
						<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
						<circle cx="9" cy="7" r="4" />
						<path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
					</svg>
				{/snippet}
				{#snippet avatar()}
					<div class="duo-pair">
						<WrappedAvatar
							playerId={payload.top_duo.players[0].id}
							name={payload.top_duo.players[0].username}
							avatarUrl={payload.top_duo.players[0].avatar_url}
							size={32}
						/>
						<WrappedAvatar
							playerId={payload.top_duo.players[1].id}
							name={payload.top_duo.players[1].username}
							avatarUrl={payload.top_duo.players[1].avatar_url}
							size={32}
						/>
					</div>
				{/snippet}
			</WrappedCompactCard>
		{/if}

		<!-- Trophies this week -->
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
				{#snippet icon()}
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
						<path d="M8 21h8M12 17v4M7 4h10v3a5 5 0 01-10 0V4z" />
					</svg>
				{/snippet}
			</WrappedCompactCard>
		{/if}
	{/if}
</div>

<style>
	.section-label {
		font-size: 10px;
		font-weight: 800;
		color: #6b7280;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		padding: 4px 4px 10px;
		margin-top: 8px;
	}
	.match-icon {
		width: 56px;
		height: 56px;
		border-radius: 50%;
		background: radial-gradient(
			circle,
			rgba(168, 85, 247, 0.32) 0%,
			rgba(168, 85, 247, 0.16) 70%
		);
		border: 2px solid rgba(168, 85, 247, 0.45);
		color: #a855f7;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 4px 18px rgba(168, 85, 247, 0.25);
	}
	.duo-pair {
		display: flex;
	}
	.duo-pair :global(.avatar-photo:nth-child(2)),
	.duo-pair :global(.avatar-fallback:nth-child(2)) {
		margin-left: -8px;
		border: 2px solid #131822;
	}
	.empty {
		text-align: center;
		padding: 32px 16px;
		color: #9ca3af;
	}
	.empty-detail {
		font-size: 12px;
		margin-top: 8px;
		color: #6b7280;
	}
</style>
