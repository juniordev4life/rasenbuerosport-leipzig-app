<script>
import { getTranslate } from "@tolgee/svelte";
import { cubicOut } from "svelte/easing";
import { fade, fly } from "svelte/transition";
import { portal } from "$lib/utils/portal.utils.js";

/**
 * Modal sheet: slides up from the bottom on phones, a centred card from
 * `sm` up. It is portalled to <body>, so no parent stacking context can
 * trap it under the bottom nav, and it resets inherited typography.
 * Escape and a tap on the scrim call `onClose`; without `onClose` the
 * sheet has no close button and can only be left through its own
 * actions (use that for forced choices).
 *
 * @type {{
 *   title: string,
 *   onClose?: () => void,
 *   size?: "sm"|"md"|"lg",
 *   children: import('svelte').Snippet,
 * }}
 */
let { title, onClose, size = "md", children } = $props();

const { t } = getTranslate();

const uid = $props.id();
const titleId = `sheet-title-${uid}`;

/** @type {HTMLElement|null} */
let panel = $state(null);

// Move focus into the dialog so keyboard and screen-reader users land in it.
$effect(() => {
	panel?.focus();
});

function handleKeydown(event) {
	if (event.key === "Escape") onClose?.();
}
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	use:portal
	in:fade={{ duration: 150 }}
	out:fade={{ duration: 150 }}
	class="scrim overlay"
	onclick={() => onClose?.()}
>
	<div
		bind:this={panel}
		in:fly={{ y: 280, duration: 260, easing: cubicOut }}
		out:fly={{ y: 280, duration: 200, easing: cubicOut }}
		class="sheet panel size-{size}"
		role="dialog"
		aria-modal="true"
		aria-labelledby={titleId}
		tabindex="-1"
		onclick={(e) => e.stopPropagation()}
	>
		<div class="handle" aria-hidden="true"></div>
		<header class="head">
			<h2 id={titleId} class="page-title title">{title}</h2>
			{#if onClose}
				<button
					type="button"
					class="btn btn-ghost btn-icon close"
					onclick={onClose}
					aria-label={$t("common.close")}
				>
					<svg
						viewBox="0 0 24 24"
						width="20"
						height="20"
						fill="none"
						stroke="currentColor"
						stroke-width="2.5"
						stroke-linecap="round"
						aria-hidden="true"
					>
						<line x1="18" y1="6" x2="6" y2="18" />
						<line x1="6" y1="6" x2="18" y2="18" />
					</svg>
				</button>
			{/if}
		</header>
		{@render children()}
	</div>
</div>

<style>
/* Above the bottom nav (z-50) and the page's own overlays. */
.overlay {
	position: fixed;
	inset: 0;
	z-index: 100;
	display: flex;
	align-items: flex-end;
	justify-content: center;
}

.panel {
	width: 100%;
	max-height: 85vh;
	overflow-y: auto;
	padding: 8px 22px max(env(safe-area-inset-bottom, 0px), 22px);
	outline: none;
	text-align: left;
	text-transform: none;
	letter-spacing: normal;
	font-weight: 400;
	font-style: normal;
}

.handle {
	width: 36px;
	height: 4px;
	margin: 6px auto 14px;
	border-radius: 2px;
	background: var(--color-line);
}

.head {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 12px;
	margin-bottom: 12px;
}

.title {
	margin: 0;
	padding-top: 6px;
	font-size: 24px;
	color: var(--color-ink);
}

.close {
	flex-shrink: 0;
	margin: -2px -10px 0 0;
}

@media (min-width: 640px) {
	.overlay {
		align-items: center;
		padding: 16px;
	}

	.panel {
		padding: 22px;
	}

	.size-sm {
		max-width: 26rem;
	}

	.size-md {
		max-width: 30rem;
	}

	.size-lg {
		max-width: 40rem;
	}

	.handle {
		display: none;
	}
}
</style>
