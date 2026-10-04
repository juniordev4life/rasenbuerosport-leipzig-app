<script>
import { getTranslate } from "@tolgee/svelte";
import SegmentedControl from "$lib/components/ui/SegmentedControl.svelte";

/**
 * Season tabs of the Rangliste — one per league season (an EA FC
 * edition), newest first, each with its state underneath: "FC27 /
 * läuft", "FC26 / Endstand". A two-line SegmentedControl: underline tabs
 * in the text colour around them in design A (white on the red hero), a
 * white pill track with the active season in navy in B.
 *
 * `value` may be the concrete season id or the "current" alias (the
 * store's default) — a season matches when its id equals `value`, or
 * when `value` is "current" and the season is the current one.
 *
 * @type {{
 *   seasons: Array<{ id: string, game_version: string, is_current: boolean }>,
 *   value: string,
 *   onChange: (next: string) => void,
 * }}
 */
let { seasons = [], value, onChange } = $props();

const { t } = getTranslate();

const options = $derived(
	seasons.map((season) => ({
		value: season.id,
		label: season.game_version,
		sub: season.is_current
			? $t("leaderboard.season_running")
			: $t("leaderboard.season_final"),
	})),
);

const activeId = $derived(
	value === "current"
		? (seasons.find((season) => season.is_current)?.id ?? value)
		: value,
);
</script>

{#if seasons.length > 0}
	<SegmentedControl
		{options}
		value={activeId}
		{onChange}
		ariaLabel={$t("leaderboard.season_switch")}
	/>
{/if}
