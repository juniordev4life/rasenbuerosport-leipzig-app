<script>
/**
 * Filter pill in the Historie hero: shows the current value of one
 * filter and opens its picker sheet. A white pill on the red hero (A) or
 * on the pitch (B); navy once the filter differs from its default.
 *
 * @type {{ label: string, active?: boolean, onClick: () => void }}
 */
let { label, active = false, onClick } = $props();
</script>

<button
	type="button"
	class="filter-chip"
	class:active
	aria-haspopup="dialog"
	onclick={onClick}
>
	<span class="truncate">{label}</span>
	<svg
		class="chevron"
		viewBox="0 0 24 24"
		width="14"
		height="14"
		fill="none"
		stroke="currentColor"
		stroke-width="2.5"
		stroke-linecap="round"
		stroke-linejoin="round"
		aria-hidden="true"
	>
		<polyline points="6 9 12 15 18 9" />
	</svg>
</button>

<style>
.filter-chip {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	flex-shrink: 0;
	max-width: 100%;
	min-height: 40px;
	padding: 0 12px 0 14px;
	border: 0;
	border-radius: var(--radius-control);
	background: var(--color-surface);
	color: var(--color-ink);
	box-shadow: var(--shadow-control);
	font-family: var(--font-sans);
	font-size: 13px;
	font-weight: 500;
	line-height: 1.1;
	white-space: nowrap;
	cursor: pointer;
	transition:
		background-color 120ms,
		color 120ms,
		transform 120ms;
}

.filter-chip:hover:not(.active) {
	background: var(--color-sunken);
}

.filter-chip:active {
	transform: scale(0.98);
}

.filter-chip.active {
	background: var(--color-navy);
	color: var(--color-on-navy);
}

.chevron {
	flex-shrink: 0;
}

:global([data-variant="b"]) .filter-chip {
	font-weight: 700;
}
</style>
