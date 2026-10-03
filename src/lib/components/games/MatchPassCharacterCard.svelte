<script>
import { getTranslate } from "@tolgee/svelte";
import ausgewogen from "$lib/assets/passCharacter/pass-character-ausgewogen.svg?raw";
import fluegelspiel from "$lib/assets/passCharacter/pass-character-fluegelspiel.svg?raw";
import linkslastig from "$lib/assets/passCharacter/pass-character-linkslastig.svg?raw";
import rechtslastig from "$lib/assets/passCharacter/pass-character-rechtslastig.svg?raw";
import zentral from "$lib/assets/passCharacter/pass-character-zentral.svg?raw";
import FootballIcon from "$lib/components/icons/FootballIcon.svelte";
import InfoTip from "$lib/components/ui/InfoTip.svelte";
import Section from "$lib/components/ui/Section.svelte";

/**
 * "Pass-Charakter": one mini pitch per team from the prebuilt SVG
 * illustrations in `src/lib/assets/passCharacter/`, with the team name,
 * its pass count and the style as a chip. The assets carry their own
 * colours; the CSS below repaints pitch, chalk and arrows with the
 * design tokens (home red, away navy), and `prepareSvg` rewrites the
 * gradient/marker ids so both SVGs can coexist on one page.
 *
 * @type {{
 *   homePassNetwork: object|null,
 *   awayPassNetwork: object|null,
 *   homeTeamName?: string|null,
 *   awayTeamName?: string|null,
 *   class?: string,
 * }}
 */
let {
	homePassNetwork = null,
	awayPassNetwork = null,
	homeTeamName = null,
	awayTeamName = null,
	class: className = "",
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
	return raw
		.replace(/\swidth="\d+"/i, "")
		.replace(/\sheight="\d+"/i, "")
		.replace(/id="([^"]+)"/g, (_, id) => `id="${idPrefix}${id}"`)
		.replace(/url\(#([^)]+)\)/g, (_, id) => `url(#${idPrefix}${id})`);
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

/** "Liverpool · 312 Pässe", falling back to Heim / Auswärts. */
function teamTitle(network, side, teamName) {
	const name =
		teamName ??
		(side === "home"
			? $t("game_detail.home_team")
			: $t("game_detail.away_team"));
	const count = passCount(network);
	return count !== null
		? `${name} · ${count} ${$t("match_stats.passes")}`
		: name;
}
</script>

{#snippet pitch(network, side, teamName)}
	{@const style = network?.passStyle ?? null}
	{@const svgMarkup = style ? prepareSvg(style, side) : null}
	{@const label = styleLabel(style)}
	<div class="tile pitch-tile {side}">
		<span class="label team">{teamTitle(network, side, teamName)}</span>
		<div class="mini-pitch">
			{#if svgMarkup}
				<!-- eslint-disable-next-line svelte/no-at-html-tags -->
				{@html svgMarkup}
			{:else}
				<span class="unknown">{$t("game_detail.pass_character.unknown")}</span>
			{/if}
		</div>
		{#if label}
			<span class="chip style-chip {side === 'home' ? 'chip-brand' : 'chip-navy'}">
				{label}
			</span>
		{/if}
	</div>
{/snippet}

{#if hasAnything}
	<Section title={$t("game_detail.section.pass_character")} class={className}>
		{#snippet icon()}<FootballIcon size={22} />{/snippet}
		{#snippet aside()}
			<InfoTip
				titleKey="info_tips.pass_network.title"
				bodyKey="info_tips.pass_network.body"
				size={16}
			/>
		{/snippet}
		<div class="card pass-card">
			{@render pitch(homePassNetwork, "home", homeTeamName)}
			{@render pitch(awayPassNetwork, "away", awayTeamName)}
		</div>
	</Section>
{/if}

<style>
.pass-card {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 10px;
	padding: 14px;
}

.pitch-tile {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 10px;
	min-width: 0;
	padding: 12px;
}

.team {
	max-width: 100%;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	text-align: center;
}

.home .team {
	color: var(--color-home);
}

.away .team {
	color: var(--color-away);
}

/* Token colours for pitch, chalk and arrows. B's mini pitch is pale green
 * rather than the dark grass of its drawn pitches. */
.mini-pitch {
	--pitch-fill: var(--color-pitch);
	--pitch-chalk: var(--color-chalk);
	display: flex;
	align-items: center;
	justify-content: center;
	width: 100%;
	max-width: 150px;
	aspect-ratio: 100 / 120;
}

.home .mini-pitch {
	--team: var(--color-home);
}

.away .mini-pitch {
	--team: var(--color-away);
}

:global([data-variant="b"]) .mini-pitch {
	--pitch-fill: var(--color-win-soft);
	--pitch-chalk: var(--color-chart-2);
}

/* CSS beats the SVG's presentation attributes: repaint the pitch (first
 * rect), the chalk lines and spot, and the arrows' gradients and heads. */
.mini-pitch :global(svg) {
	display: block;
	width: 100%;
	height: 100%;
}

.mini-pitch :global(svg > rect:first-of-type) {
	fill: var(--pitch-fill);
}

.mini-pitch :global(svg > :is(rect, line, circle):not([marker-end])) {
	stroke: var(--pitch-chalk);
}

.mini-pitch :global(svg > circle:not([fill="none"])) {
	fill: var(--pitch-chalk);
}

.mini-pitch :global(svg stop) {
	stop-color: var(--team);
	stop-opacity: 1;
}

.mini-pitch :global(svg marker path) {
	fill: var(--team);
}

.unknown {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 100%;
	height: 100%;
	padding: 0 8px;
	border: 1px dashed var(--color-line);
	border-radius: var(--radius-tile);
	color: var(--color-ink);
	font-size: 12px;
	text-align: center;
}

.style-chip {
	font-size: 12px;
}
</style>
