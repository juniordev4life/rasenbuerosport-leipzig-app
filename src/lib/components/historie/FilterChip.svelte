<script>
/**
 * Filter chip with active/inactive states and a chevron suffix that
 * mirrors a select-style dropdown. Used in the horizontal chip row at
 * the top of the Historie page.
 *
 * @type {{ label: string, active?: boolean, onClick: () => void }}
 */
let { label, active = false, onClick } = $props();
</script>

<button type="button" class="chip" class:active onclick={onClick}>
	<span>{label}</span>
	<svg
		class="chevron"
		viewBox="0 0 24 24"
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
.chip {
	display: inline-flex; align-items: center; gap: 5px;
	background: #131822;
	border: 1px solid #1F2937;
	color: #D1D5DB;
	font-size: 11px; font-weight: 600;
	padding: 7px 11px;
	border-radius: 999px;
	cursor: pointer;
	flex-shrink: 0;
	white-space: nowrap;
	transition: background-color .15s, border-color .15s, color .15s;
}
.chip:active { background: #1A1F2A; }
.chip.active {
	background: rgba(226, 75, 74, 0.12);
	border-color: rgba(226, 75, 74, 0.35);
	color: #E24B4A;
}
.chevron {
	width: 10px; height: 10px;
	opacity: 0.6;
}
</style>
