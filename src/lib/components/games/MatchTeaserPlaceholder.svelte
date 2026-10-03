<script>
/**
 * Dashed placeholder used in the awaiting/processing reporter flow.
 * Surfaces the upcoming section ("Statistiken · sichtbar nach Bericht")
 * so the page hierarchy stays visible even before the stats are
 * uploaded. A white surface in both designs, so the muted text keeps
 * its contrast on the A page grey and on the B pitch.
 *
 * @type {{ label: string, class?: string }}
 */
let { label, class: className = "" } = $props();
</script>

<p class="placeholder {className}">{label}</p>

<style>
.placeholder {
	margin: 0;
	padding: 16px;
	border: 1.5px dashed var(--color-line);
	border-radius: var(--radius-card);
	background: var(--color-surface);
	color: var(--color-muted);
	font-size: 13px;
	font-style: italic;
	text-align: center;
}
</style>
