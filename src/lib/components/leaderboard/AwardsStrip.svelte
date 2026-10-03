<script>
import { getTranslate } from "@tolgee/svelte";
import BallIcon from "$lib/components/icons/BallIcon.svelte";
import BarChartIcon from "$lib/components/icons/BarChartIcon.svelte";
import CheckIcon from "$lib/components/icons/CheckIcon.svelte";
import ClockIcon from "$lib/components/icons/ClockIcon.svelte";
import HistoryIcon from "$lib/components/icons/HistoryIcon.svelte";
import LightningIcon from "$lib/components/icons/LightningIcon.svelte";
import ShieldIcon from "$lib/components/icons/ShieldIcon.svelte";
import TargetIcon from "$lib/components/icons/TargetIcon.svelte";
import TrendDownIcon from "$lib/components/icons/TrendDownIcon.svelte";
import TrophyIcon from "$lib/components/icons/TrophyIcon.svelte";
import UsersIcon from "$lib/components/icons/UsersIcon.svelte";
import PlayerAvatar from "$lib/components/ui/PlayerAvatar.svelte";
import Section from "$lib/components/ui/Section.svelte";
import {
	formatAwardValue,
	orderAwards,
} from "$lib/constants/seasonAwards.constants.js";

/**
 * A closed season's league-wide awards (champion, top scorer, dream
 * duo, …) as a titled section of tiles: the award's line icon and
 * label, the winner's avatar(s) and name(s) and the winning value.
 * A horizontal scroll strip on phones, a grid from `lg`. Design A:
 * white cards; design B: grey tiles inside the section card. The
 * champion's icon is gold. Decimal values follow `locale`.
 *
 * @type {{
 *   awards: Array<{ key: string, players: Array<object>, value: number, unit: string }>,
 *   locale?: string,
 * }}
 */
let { awards = [], locale = "de-DE" } = $props();

const { t } = getTranslate();

const ordered = $derived(orderAwards(awards));

/** Line icon per award key; unknown (future) awards get the trophy. */
const AWARD_ICONS = {
	champion: TrophyIcon,
	top_scorer: BallIcon,
	top_assister: TargetIcon,
	dream_duo: UsersIcon,
	penalty_king: BallIcon,
	fair_play: CheckIcon,
	wall: ShieldIcon,
	marathon: HistoryIcon,
	form_of_the_year: BarChartIcon,
	lunch_king: ClockIcon,
	comeback_king: LightningIcon,
	unlucky: TrendDownIcon,
};
</script>

{#if ordered.length > 0}
	<Section title={$t("leaderboard.awards_title")}>
		{#snippet icon()}<TrophyIcon size={22} strokeWidth={2} />{/snippet}
		<ul class="awards">
			{#each ordered as award (award.key)}
				{@const AwardIcon = AWARD_ICONS[award.key] ?? TrophyIcon}
				<li class="award" class:champion={award.key === "champion"}>
					<span class="award-head">
						<span class="award-icon" aria-hidden="true">
							<AwardIcon size={16} strokeWidth={2.2} />
						</span>
						<span class="label award-label">{$t(`season_awards.${award.key}.label`)}</span>
					</span>
					{#if award.players?.[0]}
						<span class="award-winner">
							<span class="award-pics">
								{#each award.players.slice(0, 2) as p, i (i)}
									<PlayerAvatar player={p} size={24} class="award-pic" />
								{/each}
							</span>
							<span class="award-name">{award.players.map((p) => p.username).join(" & ")}</span>
						</span>
					{/if}
					<span class="num award-value">{formatAwardValue(award.value, award.unit, locale)}</span>
				</li>
			{/each}
		</ul>
	</Section>
{/if}

<style>
/* Phone: a strip that scrolls sideways and bleeds to the screen edges. */
.awards {
	display: flex;
	gap: 10px;
	margin: 0 calc(var(--page-gutter, 1rem) * -1);
	padding: 2px var(--page-gutter, 1rem) 10px;
	overflow-x: auto;
	scroll-snap-type: x proximity;
	scroll-padding-inline: var(--page-gutter, 1rem);
	list-style: none;
}

.award {
	display: flex;
	flex-direction: column;
	gap: 8px;
	flex: 0 0 168px;
	min-width: 0;
	padding: 12px;
	scroll-snap-align: start;
	background: var(--color-surface);
	color: var(--color-ink);
	border-radius: var(--radius-card);
	box-shadow: var(--shadow-card);
}

.award-head {
	display: flex;
	align-items: center;
	gap: 8px;
	min-width: 0;
}

.award-icon {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 28px;
	height: 28px;
	flex-shrink: 0;
	border-radius: var(--radius-badge);
	background: var(--color-navy);
	color: var(--color-on-navy);
}

.champion .award-icon {
	background: var(--color-gold);
	color: var(--color-on-gold);
}

.award-label {
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	color: var(--color-muted);
}

.award-winner {
	display: flex;
	align-items: center;
	gap: 8px;
	min-width: 0;
}

.award-pics {
	display: flex;
	flex-shrink: 0;
}

.award-pics :global(.award-pic + .award-pic) {
	margin-left: -8px;
	box-shadow: 0 0 0 2px var(--color-surface);
}

.award-name {
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	font-weight: 700;
	font-size: 13px;
}

.award-value {
	font-size: 24px;
}

/* Desktop: a grid. */
@media (min-width: 1024px) {
	.awards {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
		margin: 0;
		padding: 0;
		overflow: visible;
	}

	.award {
		flex: none;
	}
}

/* Design B: grey tiles inside the section card. */
:global([data-variant="b"]) .awards {
	margin: 0 -18px;
	padding: 0 18px 4px;
	scroll-padding-inline: 18px;
}

:global([data-variant="b"]) .award {
	background: var(--color-sunken);
	border-radius: var(--radius-tile);
	box-shadow: none;
}

:global([data-variant="b"]) .award-icon {
	background: var(--color-win-soft);
	color: var(--color-win);
}

:global([data-variant="b"]) .champion .award-icon {
	background: var(--color-gold);
	color: var(--color-on-gold);
}

@media (min-width: 1024px) {
	:global([data-variant="b"]) .awards {
		margin: 0;
		padding: 0;
	}
}
</style>
