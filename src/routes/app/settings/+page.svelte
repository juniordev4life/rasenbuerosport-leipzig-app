<script>
import { getTranslate } from "@tolgee/svelte";
import { goto } from "$app/navigation";
import ProfileEditor from "$lib/components/profile/ProfileEditor.svelte";
import PushNotificationSettings from "$lib/components/profile/PushNotificationSettings.svelte";
import ThemeSelector from "$lib/components/profile/ThemeSelector.svelte";
import Button from "$lib/components/ui/Button.svelte";
import { ROUTES } from "$lib/constants/routes.constants.js";
import { logout } from "$lib/services/auth.services.js";
import { user } from "$lib/stores/auth.stores.js";

const { t } = getTranslate();

let editing = $state(false);

const username = $derived($user?.user_metadata?.username || "");
const avatarUrl = $derived($user?.user_metadata?.avatar_url || null);

async function handleLogout() {
	try {
		await logout();
		goto(ROUTES.LOGIN);
	} catch (err) {
		console.error("Logout failed:", err);
	}
}
</script>

<svelte:head>
	<title>RasenBürosport - {$t("nav.settings")}</title>
</svelte:head>

<div class="flex flex-col gap-4 max-w-2xl mx-auto pb-4">
	<header class="flex items-center gap-2 pt-2">
		<button
			type="button"
			onclick={() => history.back()}
			class="flex items-center gap-1 text-text-secondary text-sm hover:text-text-primary transition-colors"
		>
			<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M15 19l-7-7 7-7" />
			</svg>
			{$t("common.back")}
		</button>
	</header>

	<h1 class="text-xl sm:text-2xl font-bold tracking-tight">
		{$t("nav.settings")}
	</h1>

	<section class="bg-bg-secondary border border-border rounded-2xl p-4 sm:p-5 space-y-4">
		{#if editing}
			<ProfileEditor
				currentUsername={username}
				currentAvatarUrl={avatarUrl}
				onClose={() => (editing = false)}
				onSaved={() => (editing = false)}
			/>
		{:else}
			<Button variant="ghost" onclick={() => (editing = true)}>
				{$t("profile.edit.title")}
			</Button>
		{/if}

		<ThemeSelector />

		<PushNotificationSettings />

		<Button variant="ghost" onclick={handleLogout}>
			{$t("profile.logout")}
		</Button>
	</section>
</div>
