<script>
	let { username = "", email = "", avatarUrl = null } = $props();

	const initial = $derived(username?.charAt(0)?.toUpperCase() || "?");
</script>

<div class="flex flex-col items-center gap-2">
	<div
		class="w-20 h-20 rounded-full bg-accent-red flex items-center justify-center text-3xl font-bold text-white"
	>
		{initial}
	</div>
	<h2 class="text-xl font-bold text-text-primary">{username}</h2>
	<p class="text-sm text-text-secondary">{email}</p>
</div>
