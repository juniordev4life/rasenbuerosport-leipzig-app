<script>
	/**
	 * AvatarChip - Clickable avatar component for player selection
	 * Shows avatar image or initials in a colored circle with username below
	 * @param {string} label - Display name
	 * @param {string|null} avatarUrl - Avatar image URL
	 * @param {"home"|"away"|null} side - Current assignment (null = unassigned)
	 * @param {boolean} isGuest - Whether this is a guest avatar
	 * @param {boolean} dimmed - Whether player is assigned to the OTHER side (greyed out)
	 * @param {Function} onclick - Click handler
	 */
	let {
		label = "",
		avatarUrl = null,
		side = null,
		isGuest = false,
		dimmed = false,
		onclick,
	} = $props();

	const initial = $derived(
		isGuest ? "?" : (label?.charAt(0)?.toUpperCase() || "?"),
	);

	const ringClass = $derived.by(() => {
		if (dimmed) return "ring-1 ring-border/40";
		if (side === "home") return "ring-2 ring-accent-red";
		if (side === "away") return "ring-2 ring-blue-500";
		return "ring-1 ring-border";
	});

	const bgClass = $derived.by(() => {
		if (avatarUrl) return "";
		if (dimmed) return "bg-bg-input/40";
		if (isGuest && !side) return "bg-bg-input";
		if (side === "home") return "bg-accent-red/20";
		if (side === "away") return "bg-blue-500/20";
		return "bg-bg-secondary";
	});
</script>

<button
	type="button"
	{onclick}
	class="flex flex-col items-center gap-1 p-1.5 rounded-lg transition-all duration-150 active:scale-95 min-w-[56px] {dimmed ? 'opacity-30' : ''}"
>
	{#if avatarUrl && !isGuest}
		<img
			src={avatarUrl}
			alt={label}
			class="w-10 h-10 rounded-full object-cover transition-all duration-150 {ringClass}"
		/>
	{:else}
		<div
			class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-150 {ringClass} {bgClass} {side ? 'text-text-primary' : 'text-text-secondary'}"
		>
			{initial}
		</div>
	{/if}
	<span
		class="text-[10px] leading-tight text-center truncate max-w-[56px] {side ? 'text-text-primary font-medium' : 'text-text-secondary'}"
	>
		{label}
	</span>
</button>
