<script>
/**
 * Generic pill-style segmented toggle (2+ options). Used across the
 * Rangliste for every "pick one of a few labelled views" control —
 * Spieler/Duos, Aktuell/Form, Gesamt/Pro Spiel — instead of a
 * one-off component per pair.
 *
 * Fully controlled — the caller owns the active value, which keeps URL
 * synchronisation on the page level straightforward.
 *
 * @type {{
 *   options: Array<{ value: string, label: string }>,
 *   value: string,
 *   onChange: (next: string) => void,
 *   ariaLabel: string,
 * }}
 */
let { options, value, onChange, ariaLabel } = $props();
</script>

<div
	class="flex bg-bg-input border border-border rounded-full p-0.5 gap-0.5"
	role="tablist"
	aria-label={ariaLabel}
>
	{#each options as option (option.value)}
		<button
			type="button"
			role="tab"
			aria-selected={option.value === value}
			class="flex-1 py-1.5 rounded-full text-xs font-bold transition-colors {option.value ===
			value
				? 'bg-accent-red text-white shadow-sm'
				: 'text-text-secondary hover:text-text-primary'}"
			onclick={() => onChange(option.value)}
		>
			{option.label}
		</button>
	{/each}
</div>
