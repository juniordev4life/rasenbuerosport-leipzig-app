<script>
/**
 * Narrative banner on top of the Verlauf tab. The icon + colour
 * convey the streak energy without overpowering the layout.
 *
 * @type {{ headline: string, detail: string }}
 */
let { headline, detail } = $props();
</script>

<div class="banner">
	<div class="icon" aria-hidden="true">⚡</div>
	<div class="text">
		<div class="headline">{headline}</div>
		<div class="detail">{detail}</div>
	</div>
</div>

<style>
.banner {
	display: flex; align-items: center; gap: 12px;
	background: linear-gradient(135deg, rgba(245, 158, 11, 0.10), rgba(245, 158, 11, 0.02));
	border: 1px solid rgba(245, 158, 11, 0.25);
	border-radius: 14px;
	padding: 12px 14px;
}
.icon {
	width: 36px; height: 36px;
	border-radius: 10px;
	background: linear-gradient(135deg, #F59E0B, #D97706);
	color: #1A1F2A;
	font-size: 18px;
	font-weight: 800;
	display: flex; align-items: center; justify-content: center;
	flex-shrink: 0;
}
.text { flex: 1; min-width: 0; }
.headline {
	font-size: 13px;
	font-weight: 800;
	color: #FFFFFF;
	margin-bottom: 2px;
}
.detail {
	font-size: 11px;
	color: #9CA3AF;
	line-height: 1.4;
}
</style>
