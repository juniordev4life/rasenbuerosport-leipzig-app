<script>
import { getTranslate } from "@tolgee/svelte";
import { tolgee } from "$lib/config/i18n.config.js";
import { selectedSeason } from "$lib/stores/season.stores.js";
import {
	getCurrentSeason,
	getSeasonLabel,
	listAllSeasons,
} from "$lib/utils/season.utils.js";

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
	class="bg-bg-secondary border border-border text-text-primary text-sm rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-accent-red"
	aria-label={$t("season.season_label")}
>
	{#each options as option (option.value)}
		<option value={option.value}>{option.label}</option>
	{/each}
</select>
