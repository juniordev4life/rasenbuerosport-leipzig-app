<script>
import { getTranslate } from "@tolgee/svelte";
import FootballIcon from "$lib/components/icons/FootballIcon.svelte";

/**
 * Shown when two players have never faced each other directly: a
 * ball, a friendly headline, a short note and a button back to the
 * selection screen. Built on the shared `.notice`; the headline is set
 * larger in the condensed face.
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

<div class="card notice">
	<FootballIcon size={56} />
	<p class="notice-title headline">
		{$t("compare.empty_headline", { a: playerAName, b: playerBName })}
	</p>
	<p class="body">{$t("compare.empty_body")}</p>
	<button type="button" class="btn btn-secondary" onclick={onBack}>
		{$t("compare.back_to_selection")}
	</button>
</div>

<style>
.headline {
	max-width: 22rem;
	font-family: var(--font-cond);
	font-size: 20px;
	line-height: 1.15;
	text-transform: var(--label-case);
	letter-spacing: var(--label-tracking);
	text-wrap: balance;
}

.body {
	max-width: 20rem;
	margin-bottom: 6px;
}

:global([data-variant="b"]) .headline {
	font-weight: 800;
	font-size: 22px;
}
</style>
