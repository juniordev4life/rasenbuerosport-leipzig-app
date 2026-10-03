<script>
import { getTranslate } from "@tolgee/svelte";
import InfoSheet from "./InfoSheet.svelte";

/**
 * A small question-mark icon that, when tapped, opens an
 * {@link InfoSheet} explaining a concept in the app — ELO, archetype,
 * pass network and so on. The icon is intentionally subtle so it
 * doesn't compete with the surrounding content, but its hit-target is
 * larger than its visual area for comfortable tapping on mobile.
 *
 * The `titleKey` / `bodyKey` props are Tolgee i18n keys; the sheet
 * resolves both at render time, so DE/EN switching just works.
 *
 * @type {{
 *   titleKey: string,
 *   bodyKey: string,
 *   ariaLabel?: string,
 *   size?: number,
 * }}
 */
let { titleKey, bodyKey, ariaLabel, size = 14 } = $props();

const { t } = getTranslate();

let open = $state(false);

function handleClick(event) {
	// Stop propagation so clicking the info icon doesn't trigger any
	// containing handlers (e.g. a player card that opens a profile on
	// tap). The sheet handles its own dismiss on backdrop click.
	event.stopPropagation();
	open = true;
}
</script>

<button
	type="button"
	class="info-tip"
	onclick={handleClick}
	aria-label={ariaLabel ?? $t(titleKey)}
>
	<svg
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		width={size}
		height={size}
		aria-hidden="true"
	>
		<circle cx="12" cy="12" r="10" />
		<line x1="12" y1="16" x2="12" y2="12" />
		<circle cx="12" cy="8" r="0.6" fill="currentColor" stroke="none" />
	</svg>
</button>

{#if open}
	<InfoSheet {titleKey} {bodyKey} onClose={() => (open = false)} />
{/if}

<style>
/* Takes the colour of the text it sits in (navy on cards, white on the
 * red hero or the B pitch), dimmed until hovered. */
.info-tip {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 22px;
	height: 22px;
	margin: -4px;
	padding: 4px;
	border: 0;
	border-radius: 999px;
	background: none;
	color: inherit;
	opacity: 0.6;
	cursor: pointer;
	vertical-align: middle;
	transition:
		opacity 0.15s,
		background-color 0.15s;
}
.info-tip:hover,
.info-tip:focus-visible {
	opacity: 1;
	background: color-mix(in srgb, currentColor 10%, transparent);
}

/* Dimmed white drops below 3:1 on the red band and the pitch. */
:global(.hero) .info-tip,
:global(.on-page) .info-tip {
	opacity: 1;
}
</style>
