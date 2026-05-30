<script>
import { getTranslate } from "@tolgee/svelte";
import MatchAudioPlayer from "$lib/components/games/MatchAudioPlayer.svelte";
import MicIcon from "$lib/components/icons/MicIcon.svelte";
import { REPORTERS } from "$lib/constants/reporters.constants.js";

/**
 * Friday-talkshow card. When a persisted episode is available
 * (`talkrunde.audioUrl` set) the card renders the shared
 * `<MatchAudioPlayer>` with the klassiker palette so Marcel's
 * accent-red carries the talkshow brand. Otherwise the empty-state
 * copy is shown — the placeholder the dashboard had since the very
 * first version.
 *
 * Reporter avatars use the persona photos shared with the Frank card
 * and the match-report header. They are intentionally NOT clickable
 * here — the bio dialog is reserved for the contexts where the
 * reporter is the lead voice on the card.
 *
 * @type {{
 *   talkrunde?: {
 *     title?: string,
 *     subtitle?: string,
 *     audioUrl?: string|null,
 *     isFresh?: boolean,
 *   } | null,
 * }}
 */
let { talkrunde = null } = $props();

const { t } = getTranslate();

const lineup = [
	{ key: "marcel", reporter: REPORTERS.klassiker },
	{ key: "sophie", reporter: REPORTERS.analyst },
	{ key: "frank", reporter: REPORTERS.euphoriker },
];
</script>

<div class="talkrunde-card">
	{#if talkrunde?.isFresh}
		<div class="talkrunde-new-ribbon">{$t("home.talkrunde.new")}</div>
	{/if}

	<div class="flex items-center gap-2.5 mb-3">
		<div class="talkrunde-icon">
			<MicIcon size={18} />
		</div>
		<div class="flex-1 leading-tight">
			<div class="text-[13px] font-extrabold text-white">
				{talkrunde?.title ?? $t("home.talkrunde.placeholder_title")}
			</div>
			<div class="text-[10px] text-text-secondary mt-0.5">
				{talkrunde?.subtitle ?? $t("home.talkrunde.placeholder_subtitle")}
			</div>
		</div>
	</div>

	<div class="flex items-center gap-2 mb-3 p-2.5 bg-black/25 rounded-lg">
		<div class="reporter-avatars">
			{#each lineup as r, i (r.key)}
				<img
					src={r.reporter.imageUrl}
					alt={r.reporter.name}
					class="reporter-avatar-photo {r.key}"
					style={i === 0 ? "" : "margin-left: -8px;"}
					loading="lazy"
				/>
			{/each}
		</div>
		<div class="text-[11px] text-text-secondary flex-1">
			<strong class="text-text-primary font-semibold">Marcel, Sophie &amp; Frank</strong>
			{$t("home.talkrunde.lineup_suffix")}
		</div>
	</div>

	{#if talkrunde?.audioUrl}
		<MatchAudioPlayer audioUrl={talkrunde.audioUrl} reporterId="klassiker" />
	{:else}
		<p class="text-[11px] text-text-muted italic">
			{$t("home.talkrunde.empty_state")}
		</p>
	{/if}
</div>

<style>
.talkrunde-card {
	background: linear-gradient(135deg, #1A1F2A 0%, #232938 100%);
	border: 1px solid #2A3142;
	border-radius: 18px;
	padding: 14px;
	position: relative;
	overflow: hidden;
}
.talkrunde-new-ribbon {
	position: absolute;
	top: 10px; right: -22px;
	background: linear-gradient(135deg, #E24B4A, #C73E3D);
	color: white;
	font-size: 8px;
	font-weight: 800;
	padding: 2px 24px;
	text-transform: uppercase;
	letter-spacing: 0.1em;
	transform: rotate(35deg);
	box-shadow: 0 2px 6px rgba(0,0,0,0.3);
}
.talkrunde-icon {
	width: 36px;
	height: 36px;
	border-radius: 10px;
	background: linear-gradient(135deg, #E24B4A, #C73E3D);
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	color: white;
}
.reporter-avatars { display: flex; }
.reporter-avatar-photo {
	width: 30px;
	height: 30px;
	border-radius: 50%;
	object-fit: cover;
	border: 2px solid #131822;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}
.reporter-avatar-photo.marcel { box-shadow: 0 0 0 1px rgba(226, 75, 74, 0.4); }
.reporter-avatar-photo.sophie { box-shadow: 0 0 0 1px rgba(147, 197, 253, 0.4); }
.reporter-avatar-photo.frank { box-shadow: 0 0 0 1px rgba(251, 191, 36, 0.4); }
</style>
