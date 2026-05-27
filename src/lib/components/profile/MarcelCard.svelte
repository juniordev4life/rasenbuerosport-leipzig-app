<script>
/**
 * Reporter-quote card with a left red accent stripe, a mini avatar
 * and a single italic line. Marcel appears twice on the profile page:
 *  - `variant="normal"` in the hero (character verdict)
 *  - `variant="compact"` in the form section (situation verdict)
 *
 * @type {{ quote: string, variant?: "normal"|"compact" }}
 */
let { quote, variant = "normal" } = $props();

const isCompact = $derived(variant === "compact");
</script>

<div class="marcel-card" class:compact={isCompact}>
	<div class="marcel-avatar">
		<img src="/images/reporter/marcel.webp" alt="Marcel" />
	</div>
	<div class="marcel-quote">{quote}</div>
</div>

<style>
.marcel-card {
	background: rgba(0,0,0,0.3);
	border-left: 2.5px solid #E24B4A;
	border-radius: 8px;
	padding: 10px 12px;
	display: flex; align-items: center; gap: 10px;
}
.marcel-card.compact {
	padding: 8px 10px;
}
.marcel-avatar {
	position: relative;
	width: 30px; height: 30px;
	border-radius: 50%;
	overflow: visible;
	flex-shrink: 0;
	box-shadow: 0 0 0 1.5px rgba(226, 75, 74, 0.4);
}
.marcel-card.compact .marcel-avatar { width: 24px; height: 24px; }
.marcel-avatar img {
	width: 100%; height: 100%;
	border-radius: 50%;
	object-fit: cover;
}
.marcel-quote {
	font-size: 12px;
	color: #D1D5DB;
	font-style: italic;
	line-height: 1.4;
}
.marcel-card.compact .marcel-quote { font-size: 11px; }
.marcel-quote::before { content: '„'; color: #E24B4A; margin-right: 1px; }
.marcel-quote::after { content: '"'; color: #E24B4A; margin-left: 1px; }
</style>
