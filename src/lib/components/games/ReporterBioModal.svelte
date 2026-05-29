<script>
import { getTranslate } from "@tolgee/svelte";

/**
 * Modal dialog with a reporter's full biography. Triggered by clicking
 * the reporter avatar inside the match-report card. Closes on overlay
 * click, ESC, or the explicit close button.
 *
 * @type {{
 *   reporter: import('$lib/constants/reporters.constants.js').ReporterPersona,
 *   onClose: () => void,
 * }}
 */
let { reporter, onClose } = $props();

const { t } = getTranslate();

function handleKeydown(event) {
	if (event.key === "Escape") onClose();
}
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="fixed inset-0 z-50 flex sm:items-center sm:justify-center sm:bg-black/70 sm:px-4 sm:py-8"
	onclick={onClose}
	role="dialog"
	aria-modal="true"
	aria-labelledby="reporter-bio-name"
>
	<!--
		Padding bakes in the iOS safe-area insets on mobile so the
		dialog content (and the close button) clears the notch /
		status bar when the app runs as a standalone PWA. On desktop
		(`sm:`) the safe-area values are 0 and `sm:p-7` overrides
		anyway, so nothing changes there.
	-->
	<div
		class="relative w-full h-full sm:h-auto sm:max-w-md sm:max-h-[90vh] sm:rounded-2xl border-0 sm:border sm:border-border bg-bg-secondary overflow-y-auto px-6 pt-[max(env(safe-area-inset-top),1.5rem)] pb-[max(env(safe-area-inset-bottom),1.5rem)] sm:p-7"
		onclick={(e) => e.stopPropagation()}
	>
		<button
			type="button"
			onclick={onClose}
			class="absolute right-3 top-[max(env(safe-area-inset-top),0.75rem)] w-8 h-8 rounded-full bg-bg-input/80 hover:bg-bg-input text-text-secondary text-lg flex items-center justify-center"
			aria-label={$t("common.close")}
		>×</button>

		<div class="flex justify-center mb-5">
			<img
				src={reporter.imageUrl}
				alt={reporter.name}
				class="w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover shadow-2xl ring-2 {reporter.ringClass}"
				loading="lazy"
			/>
		</div>

		<h2 id="reporter-bio-name" class="text-xl sm:text-2xl font-bold text-center mb-1 -tracking-[0.01em]">
			{reporter.name}
		</h2>
		<div class="text-xs font-semibold text-center uppercase tracking-[0.08em] mb-5 {reporter.accentClass}">
			{$t(reporter.titleKey)}
		</div>

		<div class="flex flex-wrap justify-center gap-2 mb-5">
			{#each reporter.pills as pill (pill.labelKey)}
				<span class="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border border-border bg-black/20 text-text-secondary">
					<span aria-hidden="true">{pill.iconKey}</span>
					{$t(pill.labelKey)}
				</span>
			{/each}
		</div>

		<div class="text-sm leading-[1.6] text-text-secondary space-y-3">
			{#each reporter.bioKeys as bioKey (bioKey)}
				<p>{$t(bioKey)}</p>
			{/each}
		</div>

		<blockquote class="mt-5 px-4 py-3.5 rounded-lg bg-black/25 border-l-4 italic text-[13px] text-text-secondary {reporter.accentClass.replace('text-', 'border-')}">
			{$t(reporter.quoteKey)}
		</blockquote>
	</div>
</div>
