<script>
/**
 * Reporter-quote card for Sophie the analyst. Visual twin of
 * `MarcelCard` but with the duo-page accent (midnight-blue stripe,
 * blue typographical quotes). Used twice on the duo page — for the
 * Hero verdict and the Beitragsverteilung-Synthese.
 *
 * @type {{ quote: string, variant?: "normal"|"compact" }}
 */
let { quote, variant = "normal" } = $props();

const isCompact = $derived(variant === "compact");
</script>

<div class="sophie-card" class:compact={isCompact}>
	<div class="sophie-avatar">
		<img src="/images/reporter/sophie.webp" alt="Sophie" />
		<span class="sophie-badge" aria-hidden="true">{"\u{1F4CA}"}</span>
	</div>
	<div class="sophie-quote">{quote}</div>
</div>

<style>
.sophie-card {
	background: rgba(0,0,0,0.3);
	border-left: 2.5px solid #1E3A8A;
	border-radius: 8px;
	padding: 10px 12px;
	display: flex; align-items: center; gap: 10px;
}
.sophie-card.compact { padding: 8px 10px; }
.sophie-avatar {
	position: relative;
	width: 30px; height: 30px;
	border-radius: 50%;
	flex-shrink: 0;
	box-shadow: 0 0 0 1.5px rgba(99, 132, 215, 0.4);
}
.sophie-card.compact .sophie-avatar { width: 24px; height: 24px; }
.sophie-avatar img {
	width: 100%; height: 100%;
	border-radius: 50%;
	object-fit: cover;
}
.sophie-badge {
	position: absolute;
	bottom: -2px; right: -2px;
	width: 14px; height: 14px;
	background: #1E3A8A;
	border-radius: 50%;
	border: 1.5px solid #131822;
	display: flex; align-items: center; justify-content: center;
	font-size: 8px;
	line-height: 1;
}
.sophie-card.compact .sophie-badge { width: 12px; height: 12px; font-size: 6px; }
.sophie-quote {
	font-size: 12px;
	color: #D1D5DB;
	font-style: italic;
	line-height: 1.4;
}
.sophie-card.compact .sophie-quote { font-size: 11px; }
.sophie-quote::before { content: '„'; color: #93C5FD; margin-right: 1px; }
.sophie-quote::after { content: '"'; color: #93C5FD; margin-left: 1px; }
</style>
