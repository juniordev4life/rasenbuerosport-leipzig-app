<script>
import { getTranslate } from "@tolgee/svelte";
import RecapCard from "../RecapCard.svelte";
import RecapHeroNumber from "../RecapHeroNumber.svelte";
import RecapSlide from "../RecapSlide.svelte";
import RecapStatGrid from "../RecapStatGrid.svelte";

/**
 * Slide 2 — the season in numbers: games, W/D/L, win rate and the
 * player's rank among the league for wins.
 *
 * @type {{ recap: object, reducedMotion: boolean }}
 */
let { recap, reducedMotion } = $props();

const { t } = getTranslate();
const stats = $derived(recap.stats ?? {});
const winPct = $derived(Math.round((stats.win_rate ?? 0) * 100));

const results = $derived([
	{
		key: "wins",
		label: $t("season_recap.numbers.wins"),
		value: stats.wins ?? 0,
		tone: "win",
	},
	{
		key: "draws",
		label: $t("season_recap.numbers.draws"),
		value: stats.draws ?? 0,
	},
	{
		key: "losses",
		label: $t("season_recap.numbers.losses"),
		value: stats.losses ?? 0,
		tone: "loss",
	},
]);
</script>

<RecapSlide title={$t("season_recap.numbers.title")}>
	<RecapCard>
		<RecapHeroNumber
			value={winPct}
			suffix="%"
			label={$t("season_recap.numbers.win_rate")}
			reduced={reducedMotion}
		/>
		<RecapStatGrid items={results} columns={3} reduced={reducedMotion} />
		<p class="recap-note">
			{$t("season_recap.numbers.games_played", { count: stats.games })}
		</p>
	</RecapCard>

	{#if stats.ranks?.wins}
		<p class="recap-pill">
			{$t("season_recap.numbers.rank", {
				rank: stats.ranks.wins.rank,
				of: stats.ranks.wins.of,
			})}
		</p>
	{/if}
</RecapSlide>
