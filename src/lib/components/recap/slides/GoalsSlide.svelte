<script>
import { getTranslate } from "@tolgee/svelte";
import RecapCard from "../RecapCard.svelte";
import RecapHeroNumber from "../RecapHeroNumber.svelte";
import RecapSlide from "../RecapSlide.svelte";
import RecapStatGrid from "../RecapStatGrid.svelte";

/**
 * Slide 3 — goals: total goals, assists, goals per game, hattricks
 * and clean sheets.
 *
 * @type {{ recap: object, reducedMotion: boolean }}
 */
let { recap, reducedMotion } = $props();

const { t } = getTranslate();
const stats = $derived(recap.stats ?? {});

const details = $derived(
	[
		{
			key: "assists",
			label: $t("season_recap.goals.assists"),
			value: stats.assists ?? 0,
		},
		{
			key: "per_game",
			label: $t("season_recap.goals.per_game"),
			value: stats.goals_per_game?.toFixed(2) ?? "—",
			countUp: false,
		},
		stats.hattricks && {
			key: "hattricks",
			label: $t("season_recap.goals.hattricks"),
			value: stats.hattricks,
		},
		stats.clean_sheets && {
			key: "clean_sheets",
			label: $t("season_recap.goals.clean_sheets"),
			value: stats.clean_sheets,
		},
	].filter(Boolean),
);
</script>

<RecapSlide title={$t("season_recap.goals.title")}>
	<RecapCard>
		<RecapHeroNumber
			value={stats.goals ?? 0}
			label={$t("season_recap.goals.goals_label")}
			accent
			reduced={reducedMotion}
		/>
		<RecapStatGrid items={details} reduced={reducedMotion} />
	</RecapCard>
</RecapSlide>
