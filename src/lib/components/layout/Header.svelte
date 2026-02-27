<script>
	import { getTranslate } from "@tolgee/svelte";
	import { user } from "$lib/stores/auth.stores.js";
	import { ROUTES } from "$lib/constants/routes.constants.js";

	const { t } = getTranslate();
</script>

<header class="flex items-center justify-end px-4 py-3" style="padding-top: calc(env(safe-area-inset-top) + 0.75rem);">
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
