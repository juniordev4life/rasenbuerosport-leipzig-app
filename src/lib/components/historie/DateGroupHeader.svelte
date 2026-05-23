<script>
/**
 * Section header rendered above each date bucket in the Historie list.
 * The ELO meta is only shown when the user has chosen the "Meine
 * Spiele" filter, so the visual chrome stays clean for general
 * browsing.
 *
 * @type {{
 *   label: string,
 *   matchCount: number,
 *   eloDelta?: number|null,
 *   matchesLabel?: string,
 * }}
 */
let { label, matchCount, eloDelta = null, matchesLabel = "Matches" } = $props();

const showElo = $derived(eloDelta != null);
const eloText = $derived.by(() => {
	if (eloDelta == null) return null;
	if (eloDelta > 0) return `↑ +${eloDelta} ELO`;
	if (eloDelta < 0) return `↓ ${eloDelta} ELO`;
	return "± 0 ELO";
});
const eloClass = $derived(
	eloDelta == null ? "" : eloDelta > 0 ? "up" : eloDelta < 0 ? "down" : "flat",
);
</script>

<div class="header">
	<div class="title">{label} · <strong>{matchCount} {matchesLabel}</strong></div>
	{#if showElo}
		<div class="meta {eloClass}">{eloText}</div>
	{/if}
</div>

<style>
.header {
	display: flex; justify-content: space-between;
	align-items: baseline;
	margin: 16px 2px 8px;
}
.title {
	font-size: 10px;
	text-transform: uppercase;
	letter-spacing: 0.12em;
	font-weight: 800;
	color: #6B7280;
}
.title strong { color: #9CA3AF; }
.meta {
	font-size: 10px;
	font-weight: 700;
	font-variant-numeric: tabular-nums;
}
.meta.up { color: #84CC16; }
.meta.down { color: #E24B4A; }
.meta.flat { color: #6B7280; }
</style>
