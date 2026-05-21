<script>
import { getTranslate } from "@tolgee/svelte";
import ausgewogen from "$lib/assets/passCharacter/pass-character-ausgewogen.svg?raw";
import fluegelspiel from "$lib/assets/passCharacter/pass-character-fluegelspiel.svg?raw";
import linkslastig from "$lib/assets/passCharacter/pass-character-linkslastig.svg?raw";
import rechtslastig from "$lib/assets/passCharacter/pass-character-rechtslastig.svg?raw";
import zentral from "$lib/assets/passCharacter/pass-character-zentral.svg?raw";

/**
 * Pass-character panel — one mini-pitch per team using the prebuilt
 * SVG illustrations from `src/lib/assets/passCharacter/`. The assets
 * ship in green; we recolour the strokes/markers to the team's accent
 * (red for home, green for away) and rewrite the gradient/marker ids
 * so two SVGs can coexist on the same page without id clashes.
 *
 * @type {{
 *   homePassNetwork: object|null,
 *   awayPassNetwork: object|null,
 *   homeTeamName?: string|null,
 *   awayTeamName?: string|null,
 * }}
 */
let {
	homePassNetwork = null,
	awayPassNetwork = null,
	homeTeamName = null,
	awayTeamName = null,
} = $props();

const { t } = getTranslate();

const STYLE_SVGS = {
	Zentral: zentral,
	Rechtslastig: rechtslastig,
	Linkslastig: linkslastig,
	Ausgewogen: ausgewogen,
	Flügelspiel: fluegelspiel,
};

const STYLE_TO_KEY = {
	Zentral: "zentral",
	Rechtslastig: "rechtslastig",
	Linkslastig: "linkslastig",
	Ausgewogen: "ausgewogen",
	Flügelspiel: "fluegelspiel",
};

const HOME_COLOR = "#e63950";
const AWAY_COLOR = "#22c55e";
const ASSET_COLOR = "#84CC16";

const hasAnything = $derived(
	(homePassNetwork?.passStyle && STYLE_SVGS[homePassNetwork.passStyle]) ||
		(awayPassNetwork?.passStyle && STYLE_SVGS[awayPassNetwork.passStyle]),
);

/**
 * Strip the SVG's intrinsic width/height (so it fills its container)
 * and prefix every internal id with the side, then rewrite both
 * `id=` declarations and matching `url(#…)` references.
 */
function prepareSvg(style, side) {
	const raw = STYLE_SVGS[style];
	if (!raw) return null;
	const idPrefix = `${side}-`;
	let out = raw
		.replace(/\swidth="\d+"/i, "")
		.replace(/\sheight="\d+"/i, "")
		.replace(/id="([^"]+)"/g, (_, id) => `id="${idPrefix}${id}"`)
		.replace(/url\(#([^)]+)\)/g, (_, id) => `url(#${idPrefix}${id})`);
	if (side === "home") {
		out = out.replaceAll(ASSET_COLOR, HOME_COLOR);
	} else {
		out = out.replaceAll(ASSET_COLOR, AWAY_COLOR);
	}
	return out;
}

function styleLabel(style) {
	const key = STYLE_TO_KEY[style];
	return key ? $t(`match_stats.pass_style.${key}`) : null;
}

function passCount(network) {
	if (!network) return null;
	const total = network.totalPasses ?? network.passes ?? null;
	return typeof total === "number" ? total : null;
}
</script>

{#snippet pitch(network, side, teamName)}
	{@const style = network?.passStyle ?? null}
	{@const svgMarkup = style ? prepareSvg(style, side) : null}
	<div class="rounded-xl bg-bg-input p-3.5 flex flex-col items-center">
		<div class="text-[10px] tracking-[0.06em] uppercase font-semibold text-center w-full mb-2.5 {side === 'home' ? 'text-accent-red' : 'text-success'}">
			{teamName ?? (side === "home" ? $t("game_detail.home_team") : $t("game_detail.away_team"))}
			{#if passCount(network) !== null}
				· {passCount(network)} {$t("match_stats.passes")}
			{/if}
		</div>
		<div class="w-full max-w-[160px]" style="aspect-ratio: 100 / 120;">
			{#if svgMarkup}
				<!-- eslint-disable-next-line svelte/no-at-html-tags -->
				{@html svgMarkup}
			{:else}
				<div class="w-full h-full rounded-lg border border-dashed border-border flex items-center justify-center text-[10px] text-text-muted text-center px-2">
					{$t("game_detail.pass_character.unknown")}
				</div>
			{/if}
		</div>
		<div class="flex flex-col items-center gap-1.5 mt-3 text-center">
			{#if styleLabel(style)}
				<span class="text-[11px] font-semibold px-2.5 py-1 rounded-full {side === 'home' ? 'bg-accent-red/15 text-accent-red' : 'bg-success/15 text-success'}">
					{styleLabel(style)}
				</span>
			{/if}
		</div>
	</div>
{/snippet}

{#if hasAnything}
	<section class="rounded-2xl border border-border bg-bg-secondary p-4 sm:p-5">
		<h3 class="text-[11px] tracking-[0.08em] uppercase text-text-muted font-semibold mb-3">
			{$t("game_detail.section.pass_character")}
		</h3>
		<div class="grid grid-cols-2 gap-3">
			{@render pitch(homePassNetwork, "home", homeTeamName)}
			{@render pitch(awayPassNetwork, "away", awayTeamName)}
		</div>
	</section>
{/if}

<style>
section :global(svg) {
	display: block;
	width: 100%;
	height: 100%;
}
</style>
