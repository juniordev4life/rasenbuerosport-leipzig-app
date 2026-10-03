<script>
import { getTranslate } from "@tolgee/svelte";
import Sheet from "$lib/components/ui/Sheet.svelte";

/**
 * Axis info sheet — explains what a spider-chart axis means and shows
 * the player's value on it. Built on the shared `Sheet` (bottom sheet on
 * phones, centred card from `sm`, Escape and scrim close it). Renders
 * nothing while `axisKey` is null.
 *
 * @type {{ axisKey: string|null, value: number|null, onClose: () => void }}
 */
let { axisKey, value, onClose } = $props();

const { t } = getTranslate();
</script>

{#if axisKey}
	<Sheet title={$t(`player_profile.axes.${axisKey}`)} {onClose} size="sm">
		<div class="axis">
			<p class="label kind">{$t(`player_profile.axis_type.${axisKey}`)}</p>
			{#if value !== null && value !== undefined}
				<p class="num value">{Math.round(value)}</p>
			{/if}
			<p class="body">{$t(`player_profile.axis_info.${axisKey}`)}</p>
		</div>
	</Sheet>
{/if}

<style>
.axis {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.kind {
	margin: -6px 0 0;
	color: var(--color-muted);
}

.value {
	margin: 0;
	font-size: 44px;
	color: var(--color-brand);
}

.body {
	margin: 0;
	font-size: 15px;
	line-height: 1.5;
	white-space: pre-line;
}

:global([data-variant="b"]) .value {
	color: var(--color-ink);
}
</style>
