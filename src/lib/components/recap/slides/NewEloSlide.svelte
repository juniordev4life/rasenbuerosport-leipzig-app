<script>
import { getTranslate } from "@tolgee/svelte";
import CheckIcon from "$lib/components/icons/CheckIcon.svelte";
import RecapCard from "../RecapCard.svelte";
import RecapHeroNumber from "../RecapHeroNumber.svelte";
import RecapSlide from "../RecapSlide.svelte";

/**
 * Slide 8 — "the new ELO": old rating vs the live League-ELO v2
 * rating, with personalised hints from `elo.drivers` explaining why
 * the number moved the way it did. The old/new comparison is hidden
 * entirely when `old_rating` is null (unknown for this player).
 *
 * @type {{ recap: object }}
 */
let { recap } = $props();

const { t } = getTranslate();
const elo = $derived(recap.elo ?? {});
const drivers = $derived(elo.drivers ?? {});

const hints = $derived.by(() => {
	const list = [];
	if (drivers.yellow_cards > 0) {
		list.push(
			$t("season_recap.new_elo.hint_yellow_cards", {
				count: drivers.yellow_cards,
			}),
		);
	}
	if (drivers.one_vs_two_games > 0) {
		list.push(
			$t("season_recap.new_elo.hint_one_vs_two", {
				count: drivers.one_vs_two_games,
			}),
		);
	}
	if (drivers.draws > 0) {
		list.push($t("season_recap.new_elo.hint_draws", { count: drivers.draws }));
	}
	if (drivers.shootouts > 0) {
		list.push(
			$t("season_recap.new_elo.hint_shootouts", { count: drivers.shootouts }),
		);
	}
	return list;
});
</script>

<RecapSlide title={$t("season_recap.new_elo.title")}>
	{#if elo.old_rating != null}
		<RecapCard>
			<RecapHeroNumber
				from={elo.old_rating}
				value={elo.new_rating}
				countUp={false}
				accent
			/>
			<p class="recap-note">{$t("season_recap.new_elo.explainer")}</p>
		</RecapCard>
	{/if}

	{#if hints.length > 0}
		<RecapCard panel>
			<ul class="hints rows">
				{#each hints as hint (hint)}
					<li class="hint">
						<span class="hint-icon" aria-hidden="true">
							<CheckIcon size={14} />
						</span>
						<span>{hint}</span>
					</li>
				{/each}
			</ul>
		</RecapCard>
	{/if}
</RecapSlide>

<style>
.hints {
	display: flex;
	flex-direction: column;
	margin: 0;
	padding: 0;
	list-style: none;
}

.hint {
	display: flex;
	align-items: flex-start;
	gap: 10px;
	padding: 10px 0;
	font-size: 14px;
	line-height: 1.4;
}

.hint:first-child {
	padding-top: 0;
}

.hint:last-child {
	padding-bottom: 0;
}

.hint-icon {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	width: 22px;
	height: 22px;
	border-radius: var(--radius-badge);
	background: var(--color-win);
	color: var(--color-on-win);
}
</style>
