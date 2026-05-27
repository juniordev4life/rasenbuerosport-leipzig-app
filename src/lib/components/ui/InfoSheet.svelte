<script>
import { getTranslate } from "@tolgee/svelte";
import { cubicOut } from "svelte/easing";
import { fade, fly } from "svelte/transition";
import { portal } from "$lib/utils/portal.utils.js";

/**
 * Bottom-sheet style modal used by {@link InfoTip} to surface longer
 * explanations of in-app concepts (ELO, archetype, pass network, …).
 * Slides up from the bottom on mobile, centres as a card on desktop.
 *
 * The overlay is moved to `document.body` via `use:portal` so it
 * escapes any parent stacking context (otherwise sections with
 * transforms / filters could trap it behind the BottomNav) and stops
 * inheriting `text-transform` / `font-weight` from the section-label
 * that hosts the trigger.
 *
 * @type {{ titleKey: string, bodyKey: string, onClose: () => void }}
 */
let { titleKey, bodyKey, onClose } = $props();

const { t } = getTranslate();

function handleKeydown(event) {
	if (event.key === "Escape") onClose();
}
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	use:portal
	in:fade={{ duration: 150 }}
	out:fade={{ duration: 150 }}
	class="info-sheet-overlay fixed inset-0 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4"
	role="dialog"
	aria-modal="true"
	aria-labelledby="info-sheet-title"
	onclick={onClose}
>
	<div
		in:fly={{ y: 280, duration: 260, easing: cubicOut }}
		out:fly={{ y: 280, duration: 200, easing: cubicOut }}
		class="info-sheet w-full sm:max-w-md max-h-[80vh] overflow-y-auto"
		onclick={(e) => e.stopPropagation()}
	>
		<!-- Drag handle (visual hint on mobile that this is a sheet) -->
		<div class="info-handle" aria-hidden="true"></div>

		<div class="info-header">
			<h3 id="info-sheet-title" class="info-title">{$t(titleKey)}</h3>
			<button
				type="button"
				onclick={onClose}
				class="info-close"
				aria-label="Schließen"
			>
				<svg
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2.5"
					stroke-linecap="round"
					width="20"
					height="20"
					aria-hidden="true"
				>
					<line x1="18" y1="6" x2="6" y2="18" />
					<line x1="6" y1="6" x2="18" y2="18" />
				</svg>
			</button>
		</div>

		<div class="info-body">{$t(bodyKey)}</div>
	</div>
</div>

<style>
/* Overlay sits above the bottom-nav (z-50) and any other section-level
 * stacking contexts on the profile / leaderboard / dashboard pages.
 * Tailwind's z-[60] would normally suffice, but parent transforms or
 * filters on the section cards create new stacking contexts that
 * trap a child-rendered fixed element below the global nav — hence
 * the bumped value and the !important on z-index. */
.info-sheet-overlay {
	z-index: 100;
}

.info-sheet {
	background: #131822;
	border: 1px solid #1f2937;
	border-radius: 22px 22px 0 0;
	padding: 8px 22px 22px;
	box-shadow: 0 -20px 60px rgba(0, 0, 0, 0.55);
	/* Reset inherited typography. After the `use:portal` action moves
	 * the overlay to `document.body` these resets are technically
	 * redundant — body styles are neutral — but they keep the sheet
	 * looking right even if a future change drops the portal or
	 * someone embeds the sheet inline. Belt + braces.
	 *
	 * Bottom padding pushes the sheet content above the iOS safe
	 * area + the always-visible BottomNav, so nothing reads as
	 * hidden when the sheet is short. */
	text-transform: none;
	letter-spacing: normal;
	font-weight: 400;
	font-style: normal;
	padding-bottom: max(env(safe-area-inset-bottom, 0px), 22px);
	margin-bottom: 0;
}
@media (min-width: 640px) {
	.info-sheet {
		border-radius: 18px;
		padding: 22px 22px 22px;
		box-shadow: 0 24px 60px rgba(0, 0, 0, 0.55);
	}
}
.info-handle {
	display: block;
	width: 36px;
	height: 4px;
	border-radius: 2px;
	background: rgba(255, 255, 255, 0.18);
	margin: 6px auto 14px;
}
@media (min-width: 640px) {
	.info-handle {
		display: none;
	}
}
.info-header {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 12px;
	margin-bottom: 10px;
}
.info-title {
	font-size: 20px;
	font-weight: 800;
	letter-spacing: -0.01em;
	color: #f0f2f5;
	margin: 0;
}
.info-close {
	flex-shrink: 0;
	background: none;
	border: none;
	color: #6b7280;
	padding: 4px;
	margin: -4px;
	cursor: pointer;
	border-radius: 8px;
	transition: color 0.15s, background-color 0.15s;
}
.info-close:hover {
	color: #f0f2f5;
	background: rgba(255, 255, 255, 0.05);
}
.info-body {
	font-size: 13.5px;
	line-height: 1.55;
	color: #d1d5db;
	white-space: pre-line;
}
</style>
