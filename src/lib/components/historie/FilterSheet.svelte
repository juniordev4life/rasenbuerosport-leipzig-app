<script>
/**
 * Generic bottom-sheet for selecting one option from a list. Used for
 * all three Historie filters (Wer / Zeitraum / Ergebnis) so the sheet
 * styling stays consistent.
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

function handleKey(event) {
	if (event.key === "Escape") onClose();
}
</script>

<svelte:window onkeydown={handleKey} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="backdrop" onclick={onClose} role="dialog" aria-modal="true">
	<div class="sheet" onclick={(e) => e.stopPropagation()}>
		<div class="grabber" aria-hidden="true"></div>
		<div class="title">{title}</div>
		<div class="options">
			{#each options as opt (opt.value)}
				<button
					type="button"
					class="option"
					class:active={opt.value === value}
					onclick={() => pick(opt.value)}
				>
					<span>{opt.label}</span>
					{#if opt.value === value}
						<span class="check" aria-hidden="true">✓</span>
					{/if}
				</button>
			{/each}
		</div>
	</div>
</div>

<style>
.backdrop {
	position: fixed;
	inset: 0;
	background: rgba(0, 0, 0, 0.6);
	z-index: 60;
	display: flex;
	align-items: flex-end;
	justify-content: center;
}
.sheet {
	width: 100%;
	max-width: 480px;
	background: #1A1F2A;
	border-top-left-radius: 18px;
	border-top-right-radius: 18px;
	padding: 12px 14px 18px;
	max-height: 75vh;
	overflow-y: auto;
}
.grabber {
	width: 36px; height: 4px;
	background: rgba(255,255,255,0.15);
	border-radius: 999px;
	margin: 0 auto 10px;
}
.title {
	font-size: 10px;
	color: #6B7280;
	text-transform: uppercase;
	letter-spacing: 0.12em;
	font-weight: 800;
	margin-bottom: 8px;
}
.options { display: flex; flex-direction: column; gap: 4px; }
.option {
	display: flex; justify-content: space-between; align-items: center;
	width: 100%;
	padding: 12px 14px;
	background: rgba(255,255,255,0.02);
	border: 1px solid #1F2937;
	border-radius: 12px;
	color: #D1D5DB;
	font-size: 13px;
	font-weight: 600;
	cursor: pointer;
	text-align: left;
	transition: background-color .15s, border-color .15s, color .15s;
}
.option:hover { background: rgba(255,255,255,0.05); }
.option.active {
	background: rgba(226, 75, 74, 0.12);
	border-color: rgba(226, 75, 74, 0.35);
	color: #E24B4A;
}
.check { color: #E24B4A; font-weight: 800; }
</style>
