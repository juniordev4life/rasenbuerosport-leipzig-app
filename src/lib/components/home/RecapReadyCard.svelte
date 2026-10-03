<script>
import { getTranslate } from "@tolgee/svelte";
import TrophyIcon from "$lib/components/icons/TrophyIcon.svelte";
import { designVariant } from "$lib/stores/designVariant.stores.js";

/**
 * "Your recap is ready" banner shown on the dashboard while a closed
 * season's recap is fresh — see `isRecentlyGenerated` in
 * `recapStory.utils.js` for the 14-day freshness window. The whole card
 * is the link; the button is only its visual call to action.
 *
 * @type {{ seasonId: string, gameVersion: string, withTalkrunde?: boolean }}
 */
let { seasonId, gameVersion, withTalkrunde = false } = $props();

const { t } = getTranslate();
</script>

<a href={`/app/recap/${seasonId}`} class="card recap">
	<span class="badge" aria-hidden="true"><TrophyIcon size={24} strokeWidth={2} /></span>
	<span class="flex flex-col gap-0.5 flex-1 min-w-0">
		<span class="title">{$t("home.recap_card.title", { version: gameVersion })}</span>
		<span class="text-[13px] text-muted">
			{withTalkrunde ? $t("home.recap_card.subtitle_with_talkrunde") : $t("home.recap_card.subtitle")}
		</span>
	</span>
	<span class="btn btn-sm shrink-0 {$designVariant === 'b' ? 'btn-accent' : 'btn-primary'}">
		{$t("home.recap_card.cta")}
	</span>
</a>

<style>
.recap {
	display: flex;
	align-items: center;
	gap: 14px;
	padding: 14px 16px;
	text-decoration: none;
}

.badge {
	width: 44px;
	height: 44px;
	flex-shrink: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: var(--radius-tile);
	background: var(--color-brand);
	color: var(--color-on-brand);
}

.title {
	font-family: var(--font-cond);
	font-weight: 700;
	font-size: 17px;
	line-height: 1.15;
	text-transform: var(--label-case);
	letter-spacing: var(--label-tracking);
}

:global([data-variant="b"]) .badge {
	border-radius: 999px;
	background: var(--color-gold);
	color: var(--color-on-gold);
}

:global([data-variant="b"]) .title {
	font-weight: 800;
	font-size: 19px;
	text-transform: none;
	letter-spacing: 0;
}
</style>
