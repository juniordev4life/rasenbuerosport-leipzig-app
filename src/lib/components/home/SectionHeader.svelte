<script>
/**
 * Compact uppercase header used between home sections — small line
 * icon on the left, optional action link on the right.
 *
 * @type {{
 *   title: string,
 *   href?: string|null,
 *   actionLabel?: string|null,
 *   icon: import('svelte').Snippet,
 * }}
 */
let { title, href = null, actionLabel = null, icon } = $props();
</script>

<div class="flex items-center justify-between mx-0.5 mt-5 mb-2.5">
	<div class="flex items-center gap-1.5 text-[11px] tracking-[0.1em] uppercase font-bold text-text-secondary">
		{@render icon()}
		<span>{title}</span>
	</div>
	{#if href && actionLabel}
		<a href={href} class="text-[10px] font-bold text-text-muted hover:text-text-primary">
			{actionLabel}
		</a>
	{:else if actionLabel}
		<span class="text-[10px] font-bold text-text-muted">{actionLabel}</span>
	{/if}
</div>
