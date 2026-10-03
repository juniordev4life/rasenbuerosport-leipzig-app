<script>
import { getTranslate } from "@tolgee/svelte";
import { designVariant } from "$lib/stores/designVariant.stores.js";

/**
 * Settings → Design: pick look A ("Rot & Weiß", the default) or B
 * ("Fußballplatz"). Native radio buttons, so arrow keys work without
 * extra code. The choice is stored on this device only. It sits in the
 * Settings section titled "Design", so the legend is for screen readers.
 */

const { t } = getTranslate();

const OPTIONS = [
	{
		value: "a",
		nameKey: "settings.design.a_name",
		hintKey: "settings.design.a_hint",
	},
	{
		value: "b",
		nameKey: "settings.design.b_name",
		hintKey: "settings.design.b_hint",
	},
];
</script>

<fieldset class="flex flex-col gap-3">
	<legend class="sr-only">{$t("settings.design.title")}</legend>
	<p class="text-sm text-muted">{$t("settings.design.body")}</p>
	<div class="grid grid-cols-2 gap-3">
		{#each OPTIONS as option (option.value)}
			<label class="option" class:selected={$designVariant === option.value}>
				<input
					type="radio"
					name="design-variant"
					value={option.value}
					checked={$designVariant === option.value}
					onchange={() => designVariant.set(option.value)}
					class="sr-only"
				/>
				<img
					src="/images/design/variant-{option.value}.webp"
					alt=""
					class="preview"
					width="358"
					height="438"
					loading="lazy"
				/>
				<span class="flex items-center gap-2">
					<span class="radio" aria-hidden="true"></span>
					<span class="font-bold">{$t(option.nameKey)}</span>
				</span>
				<span class="text-xs text-muted leading-snug">{$t(option.hintKey)}</span>
			</label>
		{/each}
	</div>
</fieldset>

<style>
.option {
	display: flex;
	flex-direction: column;
	gap: 8px;
	padding: 8px;
	border-radius: var(--radius-card);
	background: var(--color-surface);
	box-shadow: inset 0 0 0 1px var(--color-line);
	cursor: pointer;
}

.option.selected {
	box-shadow: inset 0 0 0 2px var(--color-brand);
}

.option:has(input:focus-visible) {
	outline: 2px solid var(--color-navy);
	outline-offset: 2px;
}

.preview {
	display: block;
	width: 100%;
	height: auto;
	aspect-ratio: 358 / 438;
	object-fit: cover;
	object-position: top;
	border-radius: calc(var(--radius-card) - 4px);
	background: var(--color-sunken);
}

.radio {
	width: 18px;
	height: 18px;
	flex-shrink: 0;
	border-radius: 999px;
	box-shadow: inset 0 0 0 2px var(--color-line);
}

.selected .radio {
	box-shadow: inset 0 0 0 5px var(--color-brand);
}
</style>
