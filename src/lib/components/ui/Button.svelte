<script>
	let {
		type = "button",
		variant = "primary",
		disabled = false,
		loading = false,
		class: className = "",
		onclick,
		children,
	} = $props();

	const baseClasses =
		"w-full py-3.5 px-6 rounded-lg font-semibold text-lg transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

	const variants = {
		primary:
			"bg-accent-red text-text-primary hover:bg-accent-red-hover active:scale-[0.98] shadow-lg shadow-accent-red/20",
		secondary:
			"bg-bg-secondary text-text-primary border border-border hover:border-border-light",
		ghost: "bg-transparent text-text-secondary hover:text-text-primary",
	};

	const classes = $derived(`${baseClasses} ${variants[variant]} ${className}`);
</script>

<button {type} disabled={disabled || loading} class={classes} {onclick}>
	{#if loading}
		<span class="inline-flex items-center gap-2">
			<svg
				class="animate-spin h-5 w-5"
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
			>
				<circle
					class="opacity-25"
					cx="12"
					cy="12"
					r="10"
					stroke="currentColor"
					stroke-width="4"
				></circle>
				<path
					class="opacity-75"
					fill="currentColor"
					d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
				></path>
			</svg>
			{@render children()}
		</span>
	{:else}
		{@render children()}
	{/if}
</button>
