<script>
	import { getTranslate } from "@tolgee/svelte";
	import { user } from "$lib/stores/auth.stores.js";
	import { ROUTES } from "$lib/constants/routes.constants.js";

	const { t } = getTranslate();
</script>

<header class="flex items-center justify-between px-4 py-3">
	<a
		href={ROUTES.NEW_GAME}
		class="flex items-center justify-center w-10 h-10 rounded-full bg-accent-red text-white hover:bg-accent-red/90 active:scale-95 transition-all"
		aria-label={$t("dashboard.new_game")}
	>
		<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
			<line x1="12" y1="5" x2="12" y2="19"></line>
			<line x1="5" y1="12" x2="19" y2="12"></line>
		</svg>
	</a>

	<div class="flex items-center gap-3">
		<span class="text-sm text-text-primary">
			{$t("dashboard.greeting", { username: $user?.user_metadata?.username || "User" })}
		</span>
		{#if $user?.user_metadata?.avatar_url}
			<img
				src={$user.user_metadata.avatar_url}
				alt={$user.user_metadata.username || "Avatar"}
				class="w-9 h-9 rounded-full object-cover ring-1 ring-border"
			/>
		{:else}
			<div
				class="w-9 h-9 rounded-full bg-bg-secondary border border-border flex items-center justify-center text-sm font-bold text-text-secondary"
			>
				{($user?.user_metadata?.username || "U").charAt(0).toUpperCase()}
			</div>
		{/if}
	</div>
</header>
