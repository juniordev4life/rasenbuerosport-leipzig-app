<script>
import { getTranslate } from "@tolgee/svelte";

/**
 * PassNetworkTags — kompakte Pill-Anzeige des Pass-Verteilungs-Stils
 * pro Team aus der AI-Vision-Auswertung des Pässe-Screenshots.
 *
 * Jedes Team bekommt eine Pille mit einem der fünf kanonischen
 * Zustände: Zentral / Rechtslastig / Linkslastig / Ausgewogen /
 * Flügelspiel. Bei fehlenden Indikatoren (z.B. weil die Auswertung
 * das Netzwerk nicht lesen konnte) wird die jeweilige Pille
 * weggelassen.
 *
 * @type {{
 *   homePassNetwork?: { passStyle?: string } | null,
 *   awayPassNetwork?: { passStyle?: string } | null,
 *   homeTeamName?: string | null,
 *   awayTeamName?: string | null,
 * }}
 */
let {
	homePassNetwork = null,
	awayPassNetwork = null,
	homeTeamName = null,
	awayTeamName = null,
} = $props();

const { t } = getTranslate();

const KNOWN_STYLES = new Set([
	"Zentral",
	"Rechtslastig",
	"Linkslastig",
	"Ausgewogen",
	"Flügelspiel",
]);

const STYLE_TO_KEY = {
	Zentral: "zentral",
	Rechtslastig: "rechtslastig",
	Linkslastig: "linkslastig",
	Ausgewogen: "ausgewogen",
	Flügelspiel: "fluegelspiel",
};

const homeStyle = $derived(homePassNetwork?.passStyle ?? null);
const awayStyle = $derived(awayPassNetwork?.passStyle ?? null);
const hasAnything = $derived(
	(homeStyle && KNOWN_STYLES.has(homeStyle)) ||
		(awayStyle && KNOWN_STYLES.has(awayStyle)),
);

function styleLabel(style) {
	if (!style || !KNOWN_STYLES.has(style)) return null;
	return $t(`match_stats.pass_style.${STYLE_TO_KEY[style]}`);
}
</script>

{#if hasAnything}
	<section
		class="bg-bg-secondary border border-border rounded-lg p-4"
		aria-label={$t("match_stats.pass_style.section_label")}
	>
		<header class="flex items-center gap-2 mb-3">
			<span aria-hidden="true">🧭</span>
			<h3 class="text-sm font-medium text-text-primary">
				{$t("match_stats.pass_style.title")}
			</h3>
		</header>

		<ul class="flex flex-wrap gap-2 list-none p-0 m-0">
			{#if homeStyle && KNOWN_STYLES.has(homeStyle)}
				<li class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-bg-primary border border-border">
					<span class="text-xs font-medium text-text-tertiary">
						{homeTeamName ?? $t("match_stats.pass_style.home_fallback")}
					</span>
					<span class="text-xs font-semibold text-text-primary">
						{styleLabel(homeStyle)}
					</span>
				</li>
			{/if}
			{#if awayStyle && KNOWN_STYLES.has(awayStyle)}
				<li class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-bg-primary border border-border">
					<span class="text-xs font-medium text-text-tertiary">
						{awayTeamName ?? $t("match_stats.pass_style.away_fallback")}
					</span>
					<span class="text-xs font-semibold text-text-primary">
						{styleLabel(awayStyle)}
					</span>
				</li>
			{/if}
		</ul>
	</section>
{/if}
