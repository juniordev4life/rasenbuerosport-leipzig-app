<script>
/**
 * Labelled text input on the shared `.field` style (see app.css).
 *
 * @type {{
 *   type?: string,
 *   placeholder?: string,
 *   label?: string,
 *   value?: string,
 *   required?: boolean,
 *   autocomplete?: string,
 *   id?: string,
 *   class?: string,
 * }}
 */
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
	<label for={id} class="block text-sm font-bold text-ink mb-1.5">
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
	class="field {className}"
/>
