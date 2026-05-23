<script>
import { getTranslate } from "@tolgee/svelte";
import AccountMenu from "$lib/components/layout/AccountMenu.svelte";
import { user } from "$lib/stores/auth.stores.js";

const { t } = getTranslate();

let menuOpen = $state(false);
</script>

<header
	class="flex items-center justify-end px-4 py-3 lg:hidden"
	style="padding-top: calc(env(safe-area-inset-top) + 0.75rem);"
>
	<div class="flex items-center gap-3">
		<span class="text-sm text-text-secondary">
			{$t("dashboard.greeting", { username: $user?.user_metadata?.username || "User" })}
		</span>
		<button
			type="button"
			onclick={() => (menuOpen = true)}
			class="w-9 h-9 rounded-full overflow-hidden ring-1 ring-border focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-red"
			aria-label={$t("nav.settings")}
		>
			{#if $user?.user_metadata?.avatar_url}
				<img
					src={$user.user_metadata.avatar_url}
					alt={$user.user_metadata.username || "Avatar"}
					class="w-full h-full object-cover"
				/>
			{:else}
				<div
					class="w-full h-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-sm font-bold text-white"
				>
					{($user?.user_metadata?.username || "U").charAt(0).toUpperCase()}
				</div>
			{/if}
		</button>
	</div>
</header>

{#if menuOpen}
	<AccountMenu onClose={() => (menuOpen = false)} />
{/if}
