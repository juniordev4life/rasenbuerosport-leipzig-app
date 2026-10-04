<script>
/**
 * Pick-one control for a few labelled views (Spieler | Duos,
 * Aktuell | Form, …). Design A: underline tabs that take the text colour
 * of their surroundings (navy on the page, white on the red hero).
 * Design B: a white pill track; the active option is navy, or red with
 * `tone="brand"`.
 *
 * Fully controlled — the caller owns the active value, which keeps URL
 * synchronisation on the page level straightforward.
 *
 * An option with `sub` renders as two lines (title + caption).
 *
 * @type {{
 *   options: Array<{ value: string, label: string, sub?: string }>,
 *   value: string,
 *   onChange: (next: string) => void,
 *   ariaLabel: string,
 *   tone?: "navy"|"brand",
 *   class?: string,
 * }}
 */
let {
	options,
	value,
	onChange,
	ariaLabel,
	tone = "navy",
	class: className = "",
} = $props();
</script>

<div
	class="seg {tone === 'brand' ? 'seg-brand' : ''} {className}"
	role="tablist"
	aria-label={ariaLabel}
>
	{#each options as option (option.value)}
		<button
			type="button"
			role="tab"
			class="seg-option"
			class:seg-option-2={option.sub}
			aria-selected={option.value === value}
			onclick={() => onChange(option.value)}
		>
			{#if option.sub}
				<span class="seg-title">{option.label}</span>
				<span class="seg-sub">{option.sub}</span>
			{:else}
				{option.label}
			{/if}
		</button>
	{/each}
</div>
