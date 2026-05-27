<script>
import { getTranslate } from "@tolgee/svelte";
import { cubicOut } from "svelte/easing";
import { fade, fly } from "svelte/transition";
import { portal } from "$lib/utils/portal.utils.js";

/**
 * Axis info sheet — explains what a spider-chart axis means and shows
 * the player's value on it. Mirrors the {@link InfoSheet} layout so
 * the whole app shares one slide-up bottom-sheet pattern: drag handle
 * on top, close-X in the header, no footer button.
 *
 * The overlay is portalled to `document.body` (escapes parent stacking
 * contexts so the sheet sits above the BottomNav) and slides up from
 * the bottom with a fade backdrop.
 *
 * @type {{ axisKey: string|null, value: number|null, onClose: () => void }}
 */
let { axisKey, value, onClose } = $props();

const { t } = getTranslate();

function handleKeydown(event) {
	if (event.key === "Escape") onClose();
}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if axisKey}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		use:portal
		in:fade={{ duration: 150 }}
		out:fade={{ duration: 150 }}
		class="axis-modal-overlay fixed inset-0 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4"
		role="dialog"
		aria-modal="true"
		aria-labelledby="axis-info-title"
		onclick={onClose}
	>
		<div
			in:fly={{ y: 280, duration: 260, easing: cubicOut }}
			out:fly={{ y: 280, duration: 200, easing: cubicOut }}
			class="axis-modal-card w-full sm:max-w-md max-h-[80vh] overflow-y-auto"
			onclick={(e) => e.stopPropagation()}
		>
			<div class="axis-modal-handle" aria-hidden="true"></div>

			<div class="axis-modal-header">
				<h3 id="axis-info-title" class="axis-modal-title">
					{$t(`player_profile.axes.${axisKey}`)}
				</h3>
				<button
					type="button"
					onclick={onClose}
					class="axis-modal-close"
					aria-label={$t("player_profile.axis_modal_close")}
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

			<div class="axis-modal-subtitle">
				{$t(`player_profile.axis_type.${axisKey}`)}
			</div>

			{#if value !== null && value !== undefined}
				<div class="axis-modal-value">{Math.round(value)}</div>
			{/if}

			<p class="axis-modal-body">
				{$t(`player_profile.axis_info.${axisKey}`)}
			</p>
		</div>
	</div>
{/if}

<style>
/* Sits above the BottomNav (z-50) even when a parent on the Profile
 * page creates its own stacking context. The portal action above
 * makes that point moot for most cases, but the z-index keeps the
 * sheet on top of anything else portalled into body. */
.axis-modal-overlay {
	z-index: 100;
}

.axis-modal-card {
	background: #131822;
	border: 1px solid #1f2937;
	border-radius: 22px 22px 0 0;
	padding: 8px 22px 22px;
	box-shadow: 0 -20px 60px rgba(0, 0, 0, 0.55);
	/* Reset typography inherited from the chart parent (`section-label`
	 * is bold + uppercase). After the portal these resets are redundant
	 * but kept for belt + braces. */
	text-transform: none;
	letter-spacing: normal;
	font-weight: 400;
	font-style: normal;
	padding-bottom: max(env(safe-area-inset-bottom, 0px), 22px);
}
@media (min-width: 640px) {
	.axis-modal-card {
		border-radius: 18px;
		padding: 22px 22px 22px;
		box-shadow: 0 24px 60px rgba(0, 0, 0, 0.55);
	}
}

.axis-modal-handle {
	display: block;
	width: 36px;
	height: 4px;
	border-radius: 2px;
	background: rgba(255, 255, 255, 0.18);
	margin: 6px auto 14px;
}
@media (min-width: 640px) {
	.axis-modal-handle {
		display: none;
	}
}

.axis-modal-header {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 12px;
	margin-bottom: 4px;
}
.axis-modal-title {
	font-size: 20px;
	font-weight: 800;
	letter-spacing: -0.01em;
	color: #f0f2f5;
	margin: 0;
}
.axis-modal-close {
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
.axis-modal-close:hover {
	color: #f0f2f5;
	background: rgba(255, 255, 255, 0.05);
}
.axis-modal-subtitle {
	font-size: 10px;
	text-transform: uppercase;
	letter-spacing: 0.1em;
	font-weight: 700;
	color: #6b7280;
	margin-bottom: 14px;
}
.axis-modal-value {
	font-size: 32px;
	font-weight: 800;
	color: #22c55e;
	line-height: 1;
	margin-bottom: 14px;
}
.axis-modal-body {
	font-size: 13.5px;
	line-height: 1.55;
	color: #d1d5db;
	margin: 0;
	white-space: pre-line;
}
</style>
