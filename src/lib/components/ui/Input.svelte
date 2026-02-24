<script>
	let {
		type = "text",
		placeholder = "",
		label = "",
		value = $bindable(""),
		required = false,
		autocomplete = "",
		id = "",
		class: className = "",
	} = $props();
</script>

{#if label}
	<label for={id} class="block text-sm font-medium text-text-primary mb-1.5">
		{label}
	</label>
{/if}
<input
	{id}
	{type}
	{placeholder}
	{required}
	{autocomplete}
	bind:value
	class="w-full px-4 py-3 bg-bg-input border border-border rounded-lg text-text-primary placeholder-text-muted
		focus:outline-none focus:border-accent-red focus:ring-1 focus:ring-accent-red/50
		transition-colors duration-200 {className}"
/>
