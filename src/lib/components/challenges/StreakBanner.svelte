<script>
import LightningIcon from "$lib/components/icons/LightningIcon.svelte";

/**
 * Banner on top of the History tab: how the last weeks went, as a
 * headline and a detail line next to a gold lightning tile.
 *
 * @type {{ headline: string, detail: string }}
 */
let { headline, detail } = $props();
</script>

<div class="card banner">
	<span class="icon" aria-hidden="true"><LightningIcon size={22} strokeWidth={2} /></span>
	<div class="min-w-0">
		<p class="headline">{headline}</p>
		<p class="detail">{detail}</p>
	</div>
</div>

<style>
.banner {
	display: flex;
	align-items: center;
	gap: 14px;
	padding: 14px 16px;
}

.icon {
	width: 44px;
	height: 44px;
	flex-shrink: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: var(--radius-tile);
	background: var(--color-gold);
	color: var(--color-on-gold);
}

.headline {
	margin: 0;
	font-family: var(--font-cond);
	font-weight: 700;
	font-size: 17px;
	line-height: 1.15;
	text-transform: var(--label-case);
	letter-spacing: var(--label-tracking);
}

.detail {
	margin: 3px 0 0;
	font-size: 13px;
	line-height: 1.4;
	color: var(--color-muted);
}

:global([data-variant="b"]) .icon {
	border-radius: 999px;
}

:global([data-variant="b"]) .headline {
	font-weight: 800;
	font-size: 19px;
}
</style>
