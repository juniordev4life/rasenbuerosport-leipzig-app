<script>
import { getTranslate } from "@tolgee/svelte";
import Sparkline from "$lib/components/leaderboard/Sparkline.svelte";
import RecapCard from "../RecapCard.svelte";
import RecapHeroNumber from "../RecapHeroNumber.svelte";
import RecapSlide from "../RecapSlide.svelte";

/**
 * Slide 7 — the ELO journey this season: start vs end rating, a
 * sparkline of the rating history, the season peak and the player's
 * league-wide rank.
 *
 * @type {{ recap: object }}
 */
let { recap } = $props();

const { t } = getTranslate();
const elo = $derived(recap.elo ?? {});

function formatDate(iso) {
	if (!iso) return "";
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return "";
	return d.toLocaleDateString("de-DE", { day: "2-digit", month: "short" });
}
</script>

<RecapSlide title={$t("season_recap.elo_journey.title")}>
	<RecapCard>
		<RecapHeroNumber from={elo.start} value={elo.end} countUp={false} accent />

		{#if elo.history?.length > 1}
			<!-- The line takes the text colour: white on the A frame, green on
			     the B card. -->
			<div class="spark">
				<Sparkline
					points={elo.history}
					width={280}
					height={64}
					stroke="currentColor"
					strokeWidth={2.5}
					opacity={1}
					fluid
				/>
			</div>
		{/if}

		{#if elo.peak}
			<p class="recap-note">
				{$t("season_recap.elo_journey.peak", {
					value: elo.peak.value,
					date: formatDate(elo.peak.played_at),
				})}
			</p>
		{/if}
	</RecapCard>

	{#if elo.rank}
		<p class="recap-pill">
			{$t("season_recap.elo_journey.rank", { rank: elo.rank, of: elo.of })}
		</p>
	{/if}
</RecapSlide>

<style>
.spark {
	width: 100%;
	height: 64px;
}

:global([data-variant="b"]) .spark {
	color: var(--color-win);
}
</style>
