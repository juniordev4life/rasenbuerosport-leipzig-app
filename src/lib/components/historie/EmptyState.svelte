<script>
import { getTranslate } from "@tolgee/svelte";
import FootballIcon from "$lib/components/icons/FootballIcon.svelte";

/**
 * Empty state for the Historie page: a card (the shared `.notice`) with a
 * headline that fits the active filter combination and a reset button
 * once at least one filter differs from its default.
 *
 * `checked` is set while older pages could still hold a match: the
 * headline then only says that none of the loaded matches fits.
 *
 * @type {{
 *   who: string,
 *   zeit: string,
 *   erg: string,
 *   checked?: number|null,
 *   onReset: () => void,
 * }}
 */
let { who, zeit, erg, checked = null, onReset } = $props();

const { t } = getTranslate();

const headline = $derived.by(() => {
	if (checked != null) return $t("historie.empty.partial", { count: checked });
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

<div class="card notice">
	<span class="icon" aria-hidden="true"><FootballIcon size={44} /></span>
	<p class="notice-title headline">{headline}</p>
	{#if canReset}
		<button type="button" class="btn btn-sm btn-secondary" onclick={onReset}>
			{$t("historie.empty.reset")}
		</button>
	{/if}
</div>

<style>
.icon {
	display: flex;
}

.headline {
	max-width: 300px;
	font-weight: 500;
	text-wrap: balance;
}
</style>
