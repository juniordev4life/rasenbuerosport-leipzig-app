<script>
import CheckIcon from "$lib/components/icons/CheckIcon.svelte";
import Sheet from "$lib/components/ui/Sheet.svelte";

/**
 * Picker for one Historie filter (Wer / Zeitraum / Ergebnis) on the
 * shared Sheet, which brings the portal, scrim, Escape and focus
 * handling. One row per option, the current one marked with a check;
 * picking an option applies it and closes the sheet. Design A: rows
 * with hairlines, the current one in red. Design B: rounded tiles, the
 * current one navy.
 *
 * @type {{
 *   title: string,
 *   options: Array<{ value: string, label: string }>,
 *   value: string,
 *   onSelect: (next: string) => void,
 *   onClose: () => void,
 * }}
 */
let { title, options, value, onSelect, onClose } = $props();

function pick(v) {
	onSelect(v);
	onClose();
}
</script>

<Sheet {title} {onClose} size="sm">
	<div class="options">
		{#each options as opt (opt.value)}
			{@const selected = opt.value === value}
			<button
				type="button"
				class="option"
				class:selected
				aria-pressed={selected}
				onclick={() => pick(opt.value)}
			>
				<span class="min-w-0">{opt.label}</span>
				{#if selected}
					<CheckIcon size={18} />
				{/if}
			</button>
		{/each}
	</div>
</Sheet>

<style>
.options {
	display: flex;
	flex-direction: column;
}

.option {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	width: 100%;
	min-height: 52px;
	padding: 0 4px;
	border: 0;
	border-bottom: 1px solid var(--color-line);
	background: transparent;
	color: var(--color-ink);
	font-family: var(--font-sans);
	font-size: 16px;
	font-weight: 500;
	text-align: left;
	cursor: pointer;
}

.option:last-child {
	border-bottom: 0;
}

.option:hover {
	background: var(--color-sunken);
}

.option.selected {
	color: var(--color-brand);
	font-weight: 700;
}

/* Design B: rounded tiles, the current option navy. */
:global([data-variant="b"]) .options {
	gap: 6px;
}

:global([data-variant="b"]) .option {
	padding: 0 16px;
	border-bottom: 0;
	border-radius: var(--radius-tile);
	background: var(--color-sunken);
}

:global([data-variant="b"]) .option:hover {
	background: var(--color-line);
}

:global([data-variant="b"]) .option.selected {
	background: var(--color-navy);
	color: var(--color-on-navy);
}
</style>
