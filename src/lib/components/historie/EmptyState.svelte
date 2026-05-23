<script>
import { getTranslate } from "@tolgee/svelte";

/**
 * Empty state for the Historie page. Shows a context-aware headline
 * based on the active filter combination and a reset button when at
 * least one filter is non-default.
 *
 * @type {{
 *   who: string,
 *   zeit: string,
 *   erg: string,
 *   onReset: () => void,
 * }}
 */
let { who, zeit, erg, onReset } = $props();

const { t } = getTranslate();

const headline = $derived.by(() => {
	if (erg === "comebacks") return $t("historie.empty.comebacks");
	if (erg === "hattricks") return $t("historie.empty.hattricks");
	if (who === "me" && zeit === "thisweek")
		return $t("historie.empty.me_thisweek");
	if (who === "me") return $t("historie.empty.me_default");
	if (zeit === "today") return $t("historie.empty.today");
	return $t("historie.empty.default");
});

const canReset = $derived(
	who !== "all" || zeit !== "thisweek" || erg !== "all",
);
</script>

<div class="empty">
	<div class="ball">⚽</div>
	<div class="headline">{headline}</div>
	{#if canReset}
		<button type="button" class="cta" onclick={onReset}>
			{$t("historie.empty.reset")}
		</button>
	{/if}
</div>

<style>
.empty {
	background: #131822;
	border: 1px solid #1F2937;
	border-radius: 14px;
	padding: 32px 20px;
	text-align: center;
	display: flex; flex-direction: column;
	align-items: center;
	gap: 12px;
	margin-top: 8px;
}
.ball { font-size: 44px; }
.headline {
	font-size: 13px;
	color: #9CA3AF;
	font-weight: 600;
	max-width: 280px;
	line-height: 1.5;
}
.cta {
	background: rgba(226, 75, 74, 0.12);
	border: 1px solid rgba(226, 75, 74, 0.35);
	color: #E24B4A;
	font-size: 12px;
	font-weight: 700;
	padding: 8px 16px;
	border-radius: 999px;
	cursor: pointer;
}
.cta:hover { background: rgba(226, 75, 74, 0.18); }
</style>
