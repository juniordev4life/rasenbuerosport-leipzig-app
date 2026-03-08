<script>
	/**
	 * TeamLogo - Team crest/logo with fallback to initial circle
	 * @param {string|null} logoUrl - CDN URL for the team logo
	 * @param {string} teamName - Team name for alt text and fallback
	 * @param {"sm"|"md"|"lg"} [size="md"] - Display size
	 */
	let { logoUrl = null, teamName = "", size = "md" } = $props();

	let imgError = $state(false);

	const sizeMap = { sm: "w-6 h-6", md: "w-10 h-10", lg: "w-14 h-14" };
	const sizeClass = $derived(sizeMap[size] || sizeMap.md);
	const fontSizeMap = { sm: "text-[10px]", md: "text-xs", lg: "text-base" };
	const fontClass = $derived(fontSizeMap[size] || fontSizeMap.md);
	const initial = $derived(teamName?.charAt(0)?.toUpperCase() || "?");

	// Reset error state when logoUrl changes
	$effect(() => {
		if (logoUrl) imgError = false;
	});
</script>

{#if logoUrl && !imgError}
	<img
		src={logoUrl}
		alt="{teamName} logo"
		class="{sizeClass} object-contain shrink-0"
		loading="lazy"
		onerror={() => {
			imgError = true;
		}}
	/>
{:else}
	<div
		class="{sizeClass} rounded-full bg-bg-input flex items-center justify-center {fontClass} font-bold text-text-primary shrink-0"
	>
		{initial}
	</div>
{/if}
