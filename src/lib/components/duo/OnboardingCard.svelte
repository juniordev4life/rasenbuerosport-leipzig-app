<script>
import { getTranslate } from "@tolgee/svelte";
import FootballIcon from "$lib/components/icons/FootballIcon.svelte";

/**
 * Shown while a duo is "fresh" (fewer than 5 matches): how many more
 * matches unlock the full profile, plus a progress bar towards the
 * target.
 *
 * @type {{ matchCount: number, target?: number }}
 */
let { matchCount, target = 10 } = $props();

const { t } = getTranslate();

const remaining = $derived(Math.max(0, target - matchCount));
const progressRatio = $derived(Math.min(1, matchCount / target));
</script>

<div class="card onboarding">
	<FootballIcon size={44} />
	<p class="headline">{$t("duo.onboarding_headline", { remaining })}</p>
	<p class="body">{$t("duo.onboarding_body")}</p>
	<div class="meter">
		<span class="count">{matchCount} / {target}</span>
		<div class="progress bar" aria-hidden="true">
			<span style:width="{progressRatio * 100}%"></span>
		</div>
	</div>
</div>

<style>
.onboarding {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 10px;
	padding: 24px 18px;
	text-align: center;
}

.headline {
	max-width: 22rem;
	margin: 0;
	font-family: var(--font-cond);
	font-weight: 700;
	font-size: 20px;
	line-height: 1.15;
	text-transform: var(--label-case);
	letter-spacing: var(--label-tracking);
	text-wrap: balance;
}

.body {
	max-width: 22rem;
	margin: 0;
	font-size: 14px;
	line-height: 1.45;
	color: var(--color-muted);
}

.meter {
	display: flex;
	align-items: center;
	gap: 10px;
	width: 100%;
	max-width: 16rem;
	margin-top: 6px;
}

.count {
	flex-shrink: 0;
	font-family: var(--font-cond);
	font-weight: 700;
	font-size: 15px;
	font-variant-numeric: tabular-nums;
}

.bar {
	flex: 1;
}

:global([data-variant="b"]) .headline {
	font-weight: 800;
	font-size: 22px;
}

:global([data-variant="b"]) .count {
	font-weight: 800;
	color: var(--color-win);
}
</style>
