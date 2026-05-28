<script>
import { getTranslate } from "@tolgee/svelte";
import { goto } from "$app/navigation";
import MessageIcon from "$lib/components/icons/MessageIcon.svelte";
import ProfileEditor from "$lib/components/profile/ProfileEditor.svelte";
import PushNotificationSettings from "$lib/components/profile/PushNotificationSettings.svelte";
import ThemeSelector from "$lib/components/profile/ThemeSelector.svelte";
import Button from "$lib/components/ui/Button.svelte";
import FeedbackSheet from "$lib/components/ui/FeedbackSheet.svelte";
import { ROUTES } from "$lib/constants/routes.constants.js";
import { logout } from "$lib/services/auth.services.js";
import { user } from "$lib/stores/auth.stores.js";

const { t } = getTranslate();

const username = $derived($user?.user_metadata?.username || "");
const avatarUrl = $derived($user?.user_metadata?.avatar_url || null);

let feedbackOpen = $state(false);

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
	<h1 class="text-xl sm:text-2xl font-bold tracking-tight">
		{$t("nav.settings")}
	</h1>

	<section class="bg-bg-secondary border border-border rounded-2xl p-4 sm:p-5 space-y-4">
		<ProfileEditor
			currentUsername={username}
			currentAvatarUrl={avatarUrl}
		/>

		<ThemeSelector />

		<PushNotificationSettings />

		<Button variant="ghost" onclick={handleLogout}>
			{$t("profile.logout")}
		</Button>
	</section>

	<section class="bg-bg-secondary border border-border rounded-2xl p-4 sm:p-5">
		<div class="flex items-start gap-3">
			<span class="text-text-secondary mt-0.5">
				<MessageIcon size={20} />
			</span>
			<div class="flex-1 min-w-0">
				<h2 class="text-sm font-bold text-text-primary">
					{$t("feedback.settings_section_title")}
				</h2>
				<p class="text-xs text-text-secondary mt-1 leading-relaxed">
					{$t("feedback.settings_section_body")}
				</p>
			</div>
		</div>
		<div class="mt-3">
			<Button onclick={() => (feedbackOpen = true)}>
				{$t("feedback.settings_button")}
			</Button>
		</div>
	</section>
</div>

{#if feedbackOpen}
	<FeedbackSheet onClose={() => (feedbackOpen = false)} />
{/if}
