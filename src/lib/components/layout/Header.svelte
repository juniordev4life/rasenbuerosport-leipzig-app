<script>
	import { getTranslate } from "@tolgee/svelte";
	import { user } from "$lib/stores/auth.stores.js";

	const { t } = getTranslate();
</script>

<header class="flex items-center justify-between px-4 py-3">
	<img src="/logo.png" alt="RasenBürosport Logo" class="h-10 w-auto" />

	<div class="flex items-center gap-3">
		<span class="text-sm text-text-primary">
			{$t("dashboard.greeting", { username: $user?.user_metadata?.username || "User" })}
		</span>
		<div
			class="w-9 h-9 rounded-full bg-bg-secondary border border-border flex items-center justify-center text-sm font-bold text-text-secondary"
		>
			{($user?.user_metadata?.username || "U").charAt(0).toUpperCase()}
		</div>
	</div>
</header>
