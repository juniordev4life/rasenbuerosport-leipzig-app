<script>
import { getTranslate } from "@tolgee/svelte";

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

<div class="flex flex-col items-center text-center gap-5 w-full">
	<h2 class="text-xs uppercase tracking-[0.2em] text-white/50 font-bold">
		{$t("season_recap.new_elo.title")}
	</h2>

	{#if elo.old_rating != null}
		<div class="flex items-center gap-3 text-2xl font-extrabold tabular-nums">
			<span class="text-white/50">{elo.old_rating}</span>
			<span class="text-white/30 text-lg">{"→"}</span>
			<span class="text-[#84CC16]">{elo.new_rating}</span>
		</div>
		<p class="text-[13px] text-white/60 max-w-xs">{$t("season_recap.new_elo.explainer")}</p>
	{/if}

	{#if hints.length > 0}
		<ul class="w-full flex flex-col gap-2 text-left">
			{#each hints as hint (hint)}
				<li class="rounded-xl bg-white/5 px-3 py-2 text-[13px] text-white/80">{hint}</li>
			{/each}
		</ul>
	{/if}
</div>
