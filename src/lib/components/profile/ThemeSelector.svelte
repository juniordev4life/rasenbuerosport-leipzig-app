<script>
import { getTranslate } from "@tolgee/svelte";
import { theme } from "$lib/stores/theme.stores.js";

const { t } = getTranslate();

const options = [
	{ value: "light", labelKey: "profile.theme.light", icon: "sun" },
	{ value: "dark", labelKey: "profile.theme.dark", icon: "moon" },
	{ value: "system", labelKey: "profile.theme.system", icon: "device" },
];
</script>

<div class="bg-bg-secondary border border-border rounded-lg p-4">
	<h3 class="text-sm font-medium text-text-primary mb-3">
		{$t("profile.theme.title")}
	</h3>

	<div class="flex gap-1 bg-bg-input rounded-lg p-1">
		{#each options as opt (opt.value)}
			<button
				type="button"
				onclick={() => theme.set(opt.value)}
				class="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-medium transition-all
					{$theme === opt.value
					? 'bg-bg-secondary text-text-primary shadow-sm'
					: 'text-text-secondary hover:text-text-primary'}"
			>
				{#if opt.icon === "sun"}
					<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
					</svg>
				{:else if opt.icon === "moon"}
					<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
					</svg>
				{:else}
					<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
					</svg>
				{/if}
				{$t(opt.labelKey)}
			</button>
		{/each}
	</div>
</div>
