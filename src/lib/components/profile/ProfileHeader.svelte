<script>
	import { getTranslate } from "@tolgee/svelte";

	/**
	 * ProfileHeader - Displays avatar, username, email with edit button
	 * @param {string} username
	 * @param {string} email
	 * @param {string|null} avatarUrl
	 * @param {Function} onEdit - Callback to open profile editor
	 */
	let { username = "", email = "", avatarUrl = null, onEdit } = $props();

	const { t } = getTranslate();

	const initial = $derived(username?.charAt(0)?.toUpperCase() || "?");
</script>

<div class="flex flex-col items-center gap-2 relative">
	<!-- Avatar -->
	{#if avatarUrl}
		<img
			src={avatarUrl}
			alt={username}
			class="w-20 h-20 rounded-full object-cover ring-2 ring-accent-red"
		/>
	{:else}
		<div
			class="w-20 h-20 rounded-full bg-accent-red flex items-center justify-center text-3xl font-bold text-white"
		>
			{initial}
		</div>
	{/if}

	<h2 class="text-xl font-bold text-text-primary">{username}</h2>
	<p class="text-sm text-text-secondary">{email}</p>

	<!-- Edit Button -->
	{#if onEdit}
		<button
			type="button"
			onclick={onEdit}
			class="absolute top-0 right-0 p-2 text-text-secondary hover:text-text-primary transition-colors rounded-lg hover:bg-bg-input"
			aria-label={$t("profile.edit.title")}
		>
			<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
			</svg>
		</button>
	{/if}
</div>
