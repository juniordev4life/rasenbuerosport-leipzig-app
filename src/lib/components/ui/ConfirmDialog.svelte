<script>
import { cubicOut } from "svelte/easing";
import { fade, fly } from "svelte/transition";
import { portal } from "$lib/utils/portal.utils.js";
import Button from "./Button.svelte";

/**
 * Generic confirm / alert dialog: a portalled bottom-sheet on mobile, centered
 * card on desktop, with a title, optional message and a vertical stack of
 * action buttons. Reuses the app's slide-up modal pattern (see AxisInfoModal)
 * but is themed via design tokens so it works in light and dark mode.
 *
 * Pass `onDismiss` to allow Escape / backdrop-tap to close (use it for the
 * safe, non-destructive exit). Omit it to force an explicit button choice.
 *
 * @type {{
 *   open: boolean,
 *   title: string,
 *   message?: string,
 *   actions?: Array<{ label: string, variant?: "primary"|"secondary"|"ghost", onClick: () => void }>,
 *   onDismiss?: () => void,
 * }}
 */
let { open, title, message = "", actions = [], onDismiss } = $props();

function handleKeydown(event) {
	if (event.key === "Escape" && onDismiss) onDismiss();
}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		use:portal
		in:fade={{ duration: 150 }}
		out:fade={{ duration: 150 }}
		class="confirm-overlay fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4"
		role="dialog"
		aria-modal="true"
		aria-labelledby="confirm-dialog-title"
		onclick={() => onDismiss?.()}
	>
		<div
			in:fly={{ y: 280, duration: 260, easing: cubicOut }}
			out:fly={{ y: 280, duration: 200, easing: cubicOut }}
			class="w-full sm:max-w-md bg-bg-card border border-border rounded-t-2xl sm:rounded-2xl px-6 pt-2 pb-[max(env(safe-area-inset-bottom,0px),1.5rem)] sm:pt-6 sm:pb-6"
			onclick={(e) => e.stopPropagation()}
		>
			<div
				class="mx-auto mb-4 h-1 w-9 rounded-full bg-border sm:hidden"
				aria-hidden="true"
			></div>

			<h3
				id="confirm-dialog-title"
				class="text-xl font-bold text-text-primary mb-2"
			>
				{title}
			</h3>
			{#if message}
				<p class="text-sm leading-relaxed text-text-secondary mb-5 whitespace-pre-line">
					{message}
				</p>
			{/if}

			<div class="flex flex-col gap-2.5">
				{#each actions as action (action.label)}
					<Button variant={action.variant ?? "secondary"} onclick={action.onClick}>
						{action.label}
					</Button>
				{/each}
			</div>
		</div>
	</div>
{/if}
