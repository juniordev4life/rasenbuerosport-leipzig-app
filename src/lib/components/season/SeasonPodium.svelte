<script>
import { getTranslate } from "@tolgee/svelte";
import TrophyIcon from "$lib/components/icons/TrophyIcon.svelte";
import PlayerAvatar from "$lib/components/ui/PlayerAvatar.svelte";
import Section from "$lib/components/ui/Section.svelte";
import { tolgee } from "$lib/config/i18n.config.js";
import { designVariant } from "$lib/stores/designVariant.stores.js";

/**
 * The top three of one finished season, as a titled section. Design A:
 * a ranked list with red display numbers, record and points. Design B: a
 * podium — gold in the middle, silver left, bronze right. Both are an
 * ordered list in rank order; B only rearranges the steps visually.
 *
 * @type {{
 *   season: {
 *     season: string,
 *     display_name?: { de?: string, en?: string },
 *     podium: Array<{
 *       player_id: string,
 *       username: string,
 *       avatar_url?: string|null,
 *       wins: number,
 *       draws: number,
 *       losses: number,
 *       points: number,
 *     }>,
 *   },
 * }}
 */
let { season } = $props();

const { t } = getTranslate();

let currentLanguage = $state(tolgee.getLanguage());

$effect(() => {
	const updateLanguage = () => {
		currentLanguage = tolgee.getLanguage();
	};
	tolgee.on("language", updateLanguage);
});

const currentLocale = $derived(currentLanguage === "de" ? "de" : "en");

const displayName = $derived(
	season.display_name?.[currentLocale] ||
		season.display_name?.en ||
		season.season,
);

const podium = $derived((season.podium ?? []).slice(0, 3));

/** Avatar shape the shared PlayerAvatar understands. */
function avatarOf(player) {
	return {
		name: player.username,
		avatarUrl: player.avatar_url ?? null,
		id: player.player_id,
	};
}

function recordOf(player) {
	return $t("season.podium_record", {
		w: player.wins,
		d: player.draws,
		l: player.losses,
	});
}
</script>

<Section title={displayName}>
	{#snippet icon()}<TrophyIcon size={22} strokeWidth={2} />{/snippet}

	{#if podium.length === 0}
		<p class="card notice">—</p>
	{:else if $designVariant === "b"}
		<ol class="card podium">
			{#each podium as player, index (player.player_id)}
				<li class="step place-{index + 1}">
					<a href={`/app/profile/${player.player_id}`} class="step-link">
						<PlayerAvatar
							player={avatarOf(player)}
							size={index === 0 ? 56 : 48}
							class="podium-avatar"
						/>
						<span class="step-name">{player.username}</span>
						<span class="step-record">{recordOf(player)}</span>
						<span class="block-step">
							<span class="num place">{index + 1}</span>
							<span class="cond step-points">
								{player.points}
								{$t("season.podium_points")}
							</span>
						</span>
					</a>
				</li>
			{/each}
		</ol>
	{:else}
		<ol class="card rows ranking">
			{#each podium as player, index (player.player_id)}
				<li>
					<a href={`/app/profile/${player.player_id}`} class="row">
						<span class="num rank">{index + 1}</span>
						<PlayerAvatar player={avatarOf(player)} size={40} />
						<span class="flex flex-col gap-0.5 flex-1 min-w-0">
							<span class="font-bold truncate">{player.username}</span>
							<span class="text-[13px] text-muted">{recordOf(player)}</span>
						</span>
						<span class="points">
							<span class="num points-value">{player.points}</span>
							<span class="label">{$t("season.podium_points")}</span>
						</span>
					</a>
				</li>
			{/each}
		</ol>
	{/if}
</Section>

<style>
ol {
	margin: 0;
	padding: 0;
	list-style: none;
}

/* ── Design A: ranked list ──────────────────────────────────────────── */
.row {
	display: flex;
	align-items: center;
	gap: 12px;
	min-height: 64px;
	padding: 0 16px;
	text-decoration: none;
	color: inherit;
}

.row:hover {
	background: var(--color-sunken);
}

.rank {
	width: 22px;
	flex-shrink: 0;
	font-size: 26px;
	line-height: 0.8;
	color: var(--color-brand);
}

.points {
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	gap: 4px;
	flex-shrink: 0;
}

.points-value {
	font-size: 26px;
	line-height: 0.8;
}

/* ── Design B: podium ───────────────────────────────────────────────── */
.podium {
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	align-items: end;
	gap: 8px;
}

/* Rank order in the markup, podium order on screen: 2nd, 1st, 3rd. */
.place-1 {
	order: 2;
}

.place-2 {
	order: 1;
}

.place-3 {
	order: 3;
}

.step-link {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 6px;
	min-width: 0;
	text-decoration: none;
	color: inherit;
}

.step-name,
.step-record {
	max-width: 100%;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.step-name {
	font-weight: 700;
	font-size: 14px;
}

.step-record {
	margin-top: -4px;
	font-size: 12px;
	color: var(--color-muted);
}

.block-step {
	align-self: stretch;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 4px;
	border-radius: 12px 12px 4px 4px;
}

.place-1 .block-step {
	height: 96px;
	background: var(--color-gold);
}

.place-2 .block-step {
	height: 76px;
	background: var(--color-line);
}

.place-3 .block-step {
	height: 60px;
	background: color-mix(in srgb, var(--color-tier-bronze) 35%, var(--color-surface));
}

.place {
	font-size: 28px;
	line-height: 1;
}

.place-1 .place {
	font-size: 34px;
}

.step-points {
	font-size: 13px;
	font-variant-numeric: tabular-nums;
	white-space: nowrap;
}

.step-link :global(.podium-avatar) {
	box-shadow: 0 0 0 3px var(--color-tier-silver);
}

.place-1 :global(.podium-avatar) {
	box-shadow: 0 0 0 3px var(--color-gold);
}

.place-3 :global(.podium-avatar) {
	box-shadow: 0 0 0 3px var(--color-tier-bronze);
}
</style>
