<script>
import Button from "./Button.svelte";
import Sheet from "./Sheet.svelte";

/**
 * Generic confirm / alert dialog on {@link Sheet}: a title, an optional
 * message and a vertical stack of action buttons.
 *
 * Pass `onDismiss` to allow Escape / backdrop-tap / the close button
 * (use it for the safe, non-destructive exit). Omit it to force an
 * explicit button choice.
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
</script>

{#if open}
	<Sheet {title} onClose={onDismiss} size="sm">
		{#if message}
			<p class="m-0 mb-5 text-[15px] leading-relaxed text-muted whitespace-pre-line">
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
	</Sheet>
{/if}
