<script>
import { getTranslate } from "@tolgee/svelte";
import { tolgee } from "$lib/config/i18n.config.js";
import { selectedSeason } from "$lib/stores/season.stores.js";
import {
	getCurrentSeason,
	getSeasonLabel,
	listAllSeasons,
} from "$lib/utils/season.utils.js";

/**
 * Season filter for season-scoped pages (all time or one quarter), bound
 * to the shared `selectedSeason` store. A white pill: on the red hero in
 * design A, a raised sticker on the pitch in B, outlined on the grey page
 * of the desktop toolbar.
 */

const { t } = getTranslate();

let currentLanguage = $state(tolgee.getLanguage());

$effect(() => {
	const updateLanguage = () => {
		currentLanguage = tolgee.getLanguage();
	};
	tolgee.on("language", updateLanguage);
});

const currentLocale = $derived(currentLanguage === "de" ? "de" : "en");
const currentSeason = getCurrentSeason();

const options = $derived.by(() => {
	const seasons = listAllSeasons();
	const items = [{ value: "all", label: $t("season.all_time") }];

	for (const key of seasons) {
		const label = getSeasonLabel(key, currentLocale);
		const isCurrent = key === currentSeason;
		items.push({
			value: key,
			label: isCurrent ? `${label} (${$t("season.current")})` : label,
		});
	}

	return items;
});

function handleChange(event) {
	$selectedSeason = event.target.value;
}
</script>

<select
	value={$selectedSeason}
	onchange={handleChange}
	class="field season-select"
	aria-label={$t("season.season_label")}
>
	{#each options as option (option.value)}
		<option value={option.value}>{option.label}</option>
	{/each}
</select>

<style>
.season-select {
	width: auto;
	max-width: 100%;
	min-height: 40px;
	padding: 0 12px 0 14px;
	border-color: transparent;
	border-radius: 999px;
	font-size: 14px;
	font-weight: 700;
	cursor: pointer;
}

.season-select:focus {
	border-color: var(--color-navy);
	box-shadow: 0 0 0 1px var(--color-navy);
}

:global([data-variant="b"]) .season-select:not(:focus) {
	box-shadow: var(--shadow-control);
}

/* Desktop A: the pill sits on the grey page, so it needs its outline. */
@media (min-width: 1024px) {
	:global([data-variant="a"]) .season-select:not(:focus) {
		border-color: var(--color-line);
	}
}
</style>
