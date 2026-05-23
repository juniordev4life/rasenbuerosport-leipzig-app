<script>
/**
 * Dashed-border placeholder used in the awaiting/processing reporter
 * flow. Surfaces the upcoming section ("Timeline · sichtbar nach
 * Bericht") so the page hierarchy stays visible even before the
 * stats are uploaded.
 *
 * @type {{ label: string }}
 */
let { label } = $props();
</script>

<div class="placeholder">{label}</div>

<style>
.placeholder {
	background: #131822;
	border: 1px dashed #1F2937;
	border-radius: 14px;
	padding: 14px;
	text-align: center;
	font-size: 11px;
	color: #4B5563;
	font-style: italic;
}
</style>
