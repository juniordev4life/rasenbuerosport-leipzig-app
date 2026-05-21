<script>
import { getTranslate } from "@tolgee/svelte";

/**
 * Lightweight info modal that explains what an axis means and shows the value.
 * @type {{ axisKey: string|null, value: number|null, onClose: () => void }}
 */
let { axisKey, value, onClose } = $props();

const { t } = getTranslate();
</script>

{#if axisKey}
	<div
		class="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
		role="dialog"
		aria-modal="true"
		tabindex="-1"
		onclick={onClose}
		onkeydown={(e) => e.key === "Escape" && onClose()}
	>
		<div
			class="w-full max-w-md rounded-2xl bg-bg-secondary border border-border p-6 shadow-xl"
			role="document"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
		>
			<h3 class="text-lg font-bold text-text-primary">
				{$t(`player_profile.axes.${axisKey}`)}
			</h3>
			{#if value !== null && value !== undefined}
				<div class="mt-2 text-3xl font-bold text-success">{Math.round(value)}</div>
			{/if}
			<p class="mt-3 text-sm text-text-secondary">
				{$t(`player_profile.axis_info.${axisKey}`)}
			</p>
			<button
				type="button"
				class="mt-4 w-full rounded-lg bg-bg-input px-4 py-2 text-sm font-semibold text-text-primary hover:bg-border"
				onclick={onClose}
			>
				{$t("player_profile.axis_modal_close")}
			</button>
		</div>
	</div>
{/if}
