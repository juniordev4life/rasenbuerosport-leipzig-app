<script>
import { getTranslate } from "@tolgee/svelte";

/**
 * Empty state shown when two players have never faced each other
 * directly. Big ⚽ icon, friendly headline, body text and a CTA back
 * to the selection screen.
 *
 * @type {{
 *   playerAName: string,
 *   playerBName: string,
 *   onBack: () => void,
 * }}
 */
let { playerAName, playerBName, onBack } = $props();

const { t } = getTranslate();
</script>

<div class="empty">
	<div class="ball" aria-hidden="true">⚽</div>
	<div class="headline">
		{$t("compare.empty_headline", { a: playerAName, b: playerBName })}
	</div>
	<div class="body">{$t("compare.empty_body")}</div>
	<button type="button" class="cta" onclick={onBack}>
		{$t("compare.back_to_selection")}
	</button>
</div>

<style>
.empty {
	background: #131822;
	border: 1px solid #1F2937;
	border-radius: 18px;
	padding: 32px 20px;
	text-align: center;
	display: flex; flex-direction: column;
	align-items: center;
	gap: 12px;
}
.ball { font-size: 56px; }
.headline {
	font-size: 16px;
	font-weight: 800;
	color: #FFFFFF;
}
.body {
	font-size: 12px;
	color: #9CA3AF;
	line-height: 1.5;
	max-width: 280px;
}
.cta {
	margin-top: 8px;
	background: rgba(6, 182, 212, 0.12);
	border: 1px solid rgba(6, 182, 212, 0.4);
	color: #06B6D4;
	font-size: 13px;
	font-weight: 700;
	padding: 10px 18px;
	border-radius: 999px;
	cursor: pointer;
}
.cta:hover { background: rgba(6, 182, 212, 0.2); }
</style>
