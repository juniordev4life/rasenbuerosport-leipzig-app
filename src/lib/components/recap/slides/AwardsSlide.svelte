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
import UserIcon from "$lib/components/icons/UserIcon.svelte";
import UsersIcon from "$lib/components/icons/UsersIcon.svelte";
import PlayerAvatar from "$lib/components/ui/PlayerAvatar.svelte";
import {
	formatAwardValue,
	orderAwards,
} from "$lib/constants/seasonAwards.constants.js";
import ConfettiBurst from "../ConfettiBurst.svelte";
import RecapSlide from "../RecapSlide.svelte";

/**
 * Slide 9 — the season's league-wide awards. Awards the viewer won
 * (`awards_won`) are highlighted in gold and marked with a check, with
 * a confetti burst to celebrate. Decimal values follow `locale`.
 *
 * @type {{ recap: object, reducedMotion: boolean, locale?: string }}
 */
let { recap, reducedMotion, locale = "de-DE" } = $props();

const { t } = getTranslate();

/** Line icon per award key; unknown (future) awards get the trophy. */
const AWARD_ICONS = {
	champion: TrophyIcon,
	top_scorer: BallIcon,
	top_assister: LightningIcon,
	dream_duo: UsersIcon,
	wall: ShieldIcon,
	fair_play: CheckIcon,
	penalty_king: TargetIcon,
	form_of_the_year: BarChartIcon,
	marathon: UserIcon,
	lunch_king: ClockIcon,
	comeback_king: HistoryIcon,
	unlucky: TrendDownIcon,
};

const ordered = $derived(orderAwards(recap.league?.awards ?? []));
const wonKeys = $derived(new Set(recap.awards_won ?? []));
const wonAnyAward = $derived(wonKeys.size > 0);
</script>

<RecapSlide title={$t("season_recap.awards.title")}>
	{#if wonAnyAward}
		<ConfettiBurst reduced={reducedMotion} />
	{/if}

	<ul class="awards">
		{#each ordered as award (award.key)}
			{@const AwardIcon = AWARD_ICONS[award.key] ?? TrophyIcon}
			<li class="award" class:won={wonKeys.has(award.key)}>
				<span class="award-head">
					<span class="award-icon" aria-hidden="true">
						<AwardIcon size={16} strokeWidth={2} />
					</span>
					<span class="award-label">{$t(`season_awards.${award.key}.label`)}</span>
					{#if wonKeys.has(award.key)}
						<span class="won-mark" aria-hidden="true"><CheckIcon size={12} /></span>
					{/if}
				</span>
				{#if award.players?.[0]}
					<span class="award-player">
						<PlayerAvatar player={award.players[0]} size={22} />
						<span class="award-names">
							{award.players.map((p) => p.username).join(" & ")}
						</span>
					</span>
				{/if}
				<span class="award-value">{formatAwardValue(award.value, award.unit, locale)}</span>
			</li>
		{/each}
	</ul>

	{#if wonAnyAward}
		<p class="recap-pill">{$t("season_recap.awards.you_won")}</p>
	{/if}
</RecapSlide>

<style>
.awards {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 8px;
	margin: 0;
	padding: 0;
	list-style: none;
}

.award {
	display: flex;
	flex-direction: column;
	gap: 6px;
	min-width: 0;
	padding: 10px 12px;
	border-radius: var(--radius-tile);
	background: var(--color-surface);
	color: var(--color-ink);
}

.award.won {
	background: var(--color-gold);
	color: var(--color-on-gold);
}

.award-head {
	display: flex;
	align-items: center;
	gap: 6px;
	min-width: 0;
}

.award-icon {
	display: inline-flex;
	flex-shrink: 0;
	color: var(--color-brand);
}

.won .award-icon {
	color: inherit;
}

.award-label {
	flex: 1;
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	font-family: var(--font-label);
	font-weight: var(--label-weight);
	text-transform: var(--label-case);
	letter-spacing: var(--label-tracking);
	font-size: 11px;
	line-height: 1.2;
}

.won-mark {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	width: 18px;
	height: 18px;
	border-radius: var(--radius-badge);
	background: var(--color-navy);
	color: var(--color-on-navy);
}

.award-player {
	display: flex;
	align-items: center;
	gap: 6px;
	min-width: 0;
}

.award-names {
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	font-weight: 700;
	font-size: 12px;
}

.award-value {
	font-family: var(--font-num);
	font-weight: var(--num-weight);
	font-variant-numeric: tabular-nums;
	font-size: 22px;
	line-height: 1;
}

:global([data-variant="b"]) .award {
	border-radius: 16px;
	box-shadow: var(--shadow-control);
}

:global([data-variant="b"]) .award-label {
	color: var(--color-muted);
}

:global([data-variant="b"]) .won .award-label {
	color: inherit;
}
</style>
